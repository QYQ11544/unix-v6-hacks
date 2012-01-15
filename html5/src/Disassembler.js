// import Exe

var Disassembler = {

  pos: 0,
  exe: null,

  create: function( exe ) {
    this.exe = exe ;
    return this ;
  },

  get_opr: function( num, ahead ) {

    var buffer = '' ;
    var code = '' ;
    var pos  = 0 ;
    var reg  = ( num & 07 ) ;
    var mode = ( num >> 3 ) & 07 ;

    switch( mode ) {

      case 01:
        buffer += '(' ;
        break ;

      case 02:
        buffer += ( reg == 07 ) ? '$' : '(' ;
        break ;

      case 03:
        buffer += '*' ;
        buffer += ( reg == 07 ) ? '$' : '(' ;
        break ;

      case 04:
        buffer += '-(' ;
        break ;

      case 05:
        buffer += '*-(' ;
        break ;

      case 06:
        break ;

      case 07:
        buffer += '*' ;
        break ;

      default:
        break ;

    }

    if( ( mode == 06 || mode == 07 ) ||
        ( ( reg == 07 ) && ( mode == 02 || mode == 03 ) ) ) {
      pos = 2 ;
      var val = ahead.shift( ) ;
      buffer += sprintf( 16, val, 5 ) ;
      code    = sprintf(  8, val, 6 ) + ' ' ;
    }

    if( ( mode == 06 || mode == 07 ) && reg != 07 ) {
      buffer += '(' ;
    }

    if( reg != 07 || ( mode != 02 && mode != 03 && mode != 06 && mode != 07 ) ) {
      buffer += 'r' + ( num & 07 ) ;
    }

    switch( mode ) {

      case 01:
        buffer += ')' ;
        break ;

      case 02:
        if( reg != 07 )
          buffer += ')+' ;
        break ;

      case 03:
        if( reg != 07 )
          buffer += ')+' ;
        break ;

      case 04:
        buffer += ')' ;
        break ;

      case 05:
        buffer += ')' ;
        break ;

      case 06:
        if( reg != 07 )
          buffer += ')' ;
        break ;

      case 07:
        if( reg != 07 )
          buffer += ')' ;
        break ;

      default:
        break ;

    }

    return { 'buffer' : buffer, 'pos' : pos, 'code' : code } ;

  },

  analysis_symbol: function( ) {

    var symbols = { } ;

    for( var i = this.exe.symbol_address( ); i < this.exe.end_address( ); i += 12 ) {

      var name = '' ;
      for( var j = 0; j < 12; j++ ) {
        var tmp = this.exe.file.byte_data( i + j ) ;
        if( tmp == 0 )
          break ;
        name += String.fromCharCode( tmp ) ;
      }

      var type = this.exe.file.word_data( i + 8 ) ;
      var address = this.exe.file.word_data( i + 10 ) ;
      symbols[ name ] = address ;

    }

    return symbols ;

  },

  run: function( ) {

    var buffer = '' ;
    var opr1, opr2 ;
    var symbols = this.analysis_symbol( ) ;

    for( var i = this.exe.text_address( ); i < this.exe.data_address( ); i += 2 ) {

      var code = this.exe.file.word_data( i ) ;
      var ahead = new Array( ) ;
      ahead.push( this.exe.file.word_data( i + 2 ) ) ;
      ahead.push( this.exe.file.word_data( i + 4 ) ) ;

      buffer += '[' + sprintf( 16, i, 5 ) + '] '
             +  sprintf( 16, i - 0x10, 5 ) + ' '
             +  sprintf( 8, code, 6 ) + ' ' ;

      var result = null ;
      for( var j = 0; j < OpCode.length; j++ ) {
        if( ( code & OpCode[ j ].judge ) == OpCode[ j ].value ) {
          result = OpCode[ j ] ;
          break ;
        }
      }

      switch ( result.type ) {

        case OpType.I_DOUBLE:
          opr1 = this.get_opr( ( code & 0007700 ) >> 6, ahead ) ;
          opr2 = this.get_opr( code & 0000077, ahead ) ;
          buffer += ( opr1.code + opr2.code + '                  ' ).substr( 0, 14 ) ;
          buffer += result.op + ' ' + opr1.buffer + ', ' + opr2.buffer ;
          i += opr1.pos + opr2.pos ;
          break ;

        case OpType.I_SINGLE:
          opr1 = this.get_opr( code & 0000077, ahead ) ;
          buffer += ( opr1.code + '                  ' ).substr( 0, 14 ) ;
          buffer += result.op + ' ' + opr1.buffer ;
          i += opr1.pos ;
          break ;

        case OpType.I_BRANCH:
          var opr1 = code & 0177 ;
          if( code & 0200 )
            opr1 *= -1 ;
          buffer += '              ' + result.op + ' ' + opr1 ;
          break ;

        case OpType.I_CONDITION:
          buffer += '              ' + result.op ;
          break ;

        case OpType.I_JSR:
          opr1 = this.get_opr( ( code & 0000700 ) >> 6, ahead ) ;
          opr2 = this.get_opr( code & 0000077, ahead ) ;
          buffer += ( opr1.code + opr2.code + '                  ' ).substr( 0, 14 ) ;
          buffer += result.op + ' ' + opr1.buffer + ', ' + opr2.buffer ;
          i += opr1.pos + opr2.pos ;
          break ;

        case OpType.I_RTS:
          opr1 = this.get_opr( code & 0000007, ahead ) ;
          buffer += ( opr1.code + '                  ' ).substr( 0, 14 ) ;
          buffer += result.op + ' ' + opr1.buffer ;
          i += opr1.pos ;
          break ;

        case OpType.I_JMP:
          opr1 = this.get_opr( code & 0000077, ahead ) ;
          buffer += ( opr1.code + '                  ' ).substr( 0, 14 ) ;
          buffer += result.op + ' ' + opr1.buffer ;
          i += opr1.pos ;
          break ;

        case OpType.I_OTHER:
          buffer += '              ' + result.op ;
          break ;

        case OpType.I_ONEHALF:
          opr1 = this.get_opr( ( code & 0000700 ) >> 6, ahead ) ;
          opr2 = this.get_opr( ( code & 0000077 ), ahead ) ;
          buffer += ( opr1.code + opr2.code + '                  ' ).substr( 0, 14 ) ;
          buffer += result.op + ' ' + opr1.buffer + ', ' + opr2.buffer ;
          i += opr1.pos + opr2.pos ;
          break ;

        case OpType.I_SYSTEM:

          var tmp = '', tmp2 = '' ;
          var sys_call = SystemCall[ code & 0377 ] ;
          for( var j = 0; j < sys_call.argc; j++ ) {
            var a = this.exe.file.word_data( i + ( j + 1 ) * 2 ) ;
            tmp  += sprintf( 8, a, 6 ) + ' ' ;
            tmp2 += '; ' + sprintf( 16, a, 5 ) ;
          }
          i += 2 * sys_call.argc ;
          buffer += ( tmp + '                  ' ).substr( 0, 14 ) ;
          buffer += result.op + ' ' + sys_call.name + tmp2 ;
          break ;

        default:
          break ;

      }

      buffer += "\n" ;

    }

    var tmp = this.exe.data_address( ) ;
    var padding = 0 ;
    if( this.exe.header.magic_number( ) == 0410 ) {
      padding = 0x10 ;
      while( tmp != 0x2000 ) {
        padding++ ;
        tmp++ ;
      }
    }


    buffer += "\n"
           +  ".data\n" ;

    for( this.pos = this.exe.data_address( );
         this.pos < this.exe.symbol_address( );
         this.pos += 2 ) {

      code = this.exe.file.word_data( this.pos ) ;

      buffer += '[' + sprintf( 16, this.pos, 5 ) + '] '
             +  sprintf( 16, this.pos - 0x10 + padding, 5 ) + ' '
             +  sprintf( 8, code, 6 ) + '\n' ;

    }

/*
    buffer += "\n"
           +  ".bss\n" ;
           +  "[xxxxx] "
           +  sprintf( 16, 0x10 + this.exe.header.text_size( )
                                + this.
*/

    buffer += "\n"
           +  ".symbol\n" ;
    for( this.pos = this.exe.symbol_address( );
         this.pos < this.exe.end_address( );
         this.pos += 12 ) {

      var name = '' ;
      for( var i = 0; i < 12; i++ ) {
        var tmp = this.exe.file.byte_data( this.pos + i ) ;
        if( tmp == 0 )
          break ;
        name += String.fromCharCode( tmp ) ;
      }

      var type = sprintf( 16, this.exe.file.word_data( this.pos + 8 ), 4 ) ;
      var address = sprintf( 16, this.exe.file.word_data( this.pos + 10 ), 4 ) ;
/*
      buffer += '[' + sprintf( 16, this.pos, 5 ) + '] '
             +  sprintf( 16, this.pos - 0x10, 5 ) + ' '
             +  sprintf( 8, code, 5 ) + '\n' ;
*/
      buffer += ( name + '            ' ).substr( 0, 12 )
             +  ' ' + type + ' ' + address + "\n" ;

    }

    return buffer ;

  }

} ;
