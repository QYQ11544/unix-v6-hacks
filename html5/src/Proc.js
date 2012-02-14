// trace must be global.

// import PDP11
// import ProcFile
// 

var Proc = {

  uint8_array: null,
  uint16_array: null,
  int16_array: null,
  symbols: null,
  text_address: 0,
  text_size: 0,
  data_address: 0,
  stack_address: 0,
  exit_flag: false,
  files: null,
  step: 0,

  create: function( ) {
    this.files = new Array( ) ;
    // not right logic yet.
    var inode = get_inode( 0 ) ;
    this.files.push( object( ProcFile ).create( inode ) ) ; // stdin
    this.files.push( object( ProcFile ).create( inode ) ) ; // stdout
    this.files.push( object( ProcFile ).create( inode ) ) ; // stderr
    return this ;
  },

  load: function( exe ) {
    var memory = new Array( ) ;
    this.text_size = 0 ;
    this.text_address = 0 ;

    for( var i = exe.text_address( ); i < exe.data_address( ); i++ ) {
      memory.push( exe.file.byte_data( i ) ) ;
      this.text_size++ ;
    }

    if( exe.header.magic_number( ) == 0x108 ) {
      while( memory.length % 0x2000 != 0 ) {
        memory.push( 0 ) ;
      }
    }

    this.data_address = memory.length ;
    for( var i = exe.data_address( ); i < exe.symbol_address( ); i++ ) {
      memory.push( exe.file.byte_data( i ) ) ;
    }

    for( var i = 0; i < exe.header.bss_size( ); i++ ) {
      memory.push( 0 ) ;
    }

    // for stack
    for( var i = 0; i < 0x400; i++ ) {
      memory.push( 0 ) ;
    }

    this.stack_address = memory.length ;

    this.symbols = { } ;

    for( var i = exe.symbol_address( ); i < exe.end_address( ); i += 12 ) {

      var name = '' ;
      for( var j = 0; j < 12; j++ ) {
        var tmp = exe.file.byte_data( i + j ) ;
        if( tmp == 0 )
          break ;
        name += String.fromCharCode( tmp ) ;
      }

      var type = exe.file.word_data( i + 8 ) ;
      var address = exe.file.word_data( i + 10 ) ;
      this.symbols[ name ] = address ;

    }

    var buffer = new ArrayBuffer( memory.length ) ;
    this.uint8_array = new Uint8Array( buffer ) ;
    this.uint16_array = new Uint16Array( buffer ) ;
    this.int16_array = new Int16Array( buffer ) ;

    for( var i = 0; i < memory.length; i++ )
      this.uint8_array[ i ] = memory[ i ] ;

  },

  text_begin_address: function( ) {
    return this.text_address ;
  },

  text_end_address: function( ) {
    return this.text_address + this.text_size ;
  },

  data_begin_address: function( ) {
    return this.data_address ;
  },

  stack_begin_address: function( ) {
    return this.stack_address ;
  },

  get_byte: function( pos ) {
    return this.uint8_array[ pos ] ;
  },

  get_word: function( pos ) {
//    return this.uint16_array[ pos >> 1 ] ;
    return this.int16_array[ pos >> 1 ] ;
  },

  set_byte: function( pos, value ) {
    this.uint8_array[ pos ] = value ;
  },

  set_word: function( pos, value ) {
//    this.uint16_array[ pos >> 1 ] = value ;
    this.int16_array[ pos >> 1 ] = value ;
  },

  push: function( word ) {
    pdp11.regs[ 6 ].decrement( ) ;
    this.set_word( pdp11.regs[ 6 ].get( ), word ) ;
  },

  pop: function( ) {
    var word = this.get_word( pdp11.regs[ 6 ].get( ) ) ;
    pdp11.regs[ 6 ].increment( ) ;
    return word ;
  },

  // dupllicated
  init: function( ) {

    this.files = new Array( ) ;
    // not right logic yet.
    var inode = get_inode( 0 ) ;
    this.files.push( object( ProcFile ).create( inode ) ) ; // stdin
    this.files.push( object( ProcFile ).create( inode ) ) ; // stdout
    this.files.push( object( ProcFile ).create( inode ) ) ; // stderr

    var args_values = new Array( ) ;
    if( argview.value != '' )
      var args_values = argview.value.split( ' ' ) ;
    var args = new Array( ) ;
    args.push( current_name ) ;
    for( var i = 0; i < args_values.length; i++ ) {
      args.push( args_values[ i ] ) ;
    }
    args = args.reverse( ) ;

    var all_length = 0 ;

    var arg_lengthes = new Array( ) ;
    for( i = 0; i < args.length; i++ ) {
      var length = args[ i ].length + 1 ;
      if( length & 1 )
        length++ ;
      arg_lengthes.push( length ) ;
      all_length += length ;
    }

    pdp11.regs[0].set( 0 ) ;
    pdp11.regs[1].set( 0 ) ;
    pdp11.regs[2].set( 0 ) ;
    pdp11.regs[3].set( 0 ) ;
    pdp11.regs[4].set( 0 ) ;
    pdp11.regs[5].set( 0 ) ;
    pdp11.regs[6].set( this.stack_begin_address( ) - all_length - 2 * args.length - 4 ) ;
    pdp11.regs[7].set( 0 ) ;

    this.pop( ) ;
    for( var i = 0; i < args.length; i++ )
      this.pop( ) ;
    this.pop( ) ;
    this.push( -1 ) ;
    var addr = this.stack_begin_address( ) ;
    for( var i = 0; i < args.length; i++ ) {
      addr -= arg_lengthes[ i ] ;
      this.push( addr ) ;
    }
    this.push( args.length ) ;

    var addr = this.stack_begin_address( ) ;
    for( var i = 0 ; i < args.length; i++ ) {
      addr -= arg_lengthes[ i ] ;
      for( var j = 0 ; j < arg_lengthes[ i ]; j++ ) {
        var val = args[ i ].length > j ? args[ i ].charCodeAt( j ) : 0 ;
        this.set_byte( addr + j, val ) ;
      }
    }

    this.exit_flag = false ;

    this.step = 0 ;

  },

  run: function( ) {

    var args_values = new Array( ) ;
    if( argview.value != '' )
      var args_values = argview.value.split( ' ' ) ;
    var args = new Array( ) ;
    args.push( current_name ) ;
    for( var i = 0; i < args_values.length; i++ ) {
      args.push( args_values[ i ] ) ;
    }
    args = args.reverse( ) ;

    var all_length = 0 ;

    var arg_lengthes = new Array( ) ;
    for( i = 0; i < args.length; i++ ) {
      var length = args[ i ].length + 1 ;
      if( length & 1 )
        length++ ;
      arg_lengthes.push( length ) ;
      all_length += length ;
    }

    pdp11.regs[0].set( 0 ) ;
    pdp11.regs[1].set( 0 ) ;
    pdp11.regs[2].set( 0 ) ;
    pdp11.regs[3].set( 0 ) ;
    pdp11.regs[4].set( 0 ) ;
    pdp11.regs[5].set( 0 ) ;
    pdp11.regs[6].set( this.stack_begin_address( ) - all_length - 2 * args.length - 4 ) ;
    pdp11.regs[7].set( 0 ) ;

    this.pop( ) ;
    for( var i = 0; i < args.length; i++ )
      this.pop( ) ;
    this.pop( ) ;
    this.push( -1 ) ;
    var addr = this.stack_begin_address( ) ;
    for( var i = 0; i < args.length; i++ ) {
      addr -= arg_lengthes[ i ] ;
      this.push( addr ) ;
    }
    this.push( args.length ) ;

    var addr = this.stack_begin_address( ) ;
    for( var i = 0 ; i < args.length; i++ ) {
      addr -= arg_lengthes[ i ] ;
      for( var j = 0 ; j < arg_lengthes[ i ]; j++ ) {
        var val = args[ i ].length > j ? args[ i ].charCodeAt( j ) : 0 ;
        this.set_byte( addr + j, val ) ;
      }
    }

    this.exit_flag = false ;
    this.step = 0 ;
    while( ! this.exit_flag && pdp11.regs[7].get( ) < this.stack_begin_address( ) ) {

      var code = this.get_word( pdp11.regs[7].get( ) ) ;
      var ahead = new Array( ) ;
      var int16 = new Int16Array( 2 ) ;
      int16[0] = this.get_word( pdp11.regs[7].get( ) + 2 ) ;
      int16[1] = this.get_word( pdp11.regs[7].get( ) + 4 ) ;

      ahead.push( int16[0] ) ;
      ahead.push( int16[1] ) ;

      var result = null ;
      for( var i = 0; i < OpCode.length; i++ ) {
        if( ( code & OpCode[ i ].judge ) == OpCode[ i ].value ) {
          result = OpCode[ i ] ;
          break ;
        }
      }
      trace.append( current_name + ' : ' + pdp11.string( this ) + result.op + ' ' ) ;
      result.run( pdp11, this, code, ahead ) ;
      pdp11.nextStep( ) ;

      trace.append( "\n" ) ;

/*
      for( var key in this.symbols ) {
        if( this.symbols[ key ] == pdp11.regs[ 7 ].get( ) )
          buffer += key + "\n" ;
      }
*/

      this.step++ ;
//      if( this.step > 300000 )
//        break ;

    }

  }

} ;
