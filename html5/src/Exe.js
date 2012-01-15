// import File
// import ExeHeader
// import Executor
// import Disassembler
// import object

var Exe = {

  file: null,
  header: null,

  create: function( file ) {
    this.file = file ;
    this.header = object( ExeHeader ).create( file ) ;
    return this ;
  },

  disassemble: function( ) {
    var dis = object( Disassembler ).create( this ) ;
    return this.header.string( )
             + "\n"
             + ".text\n"
             + dis.run( ) ;
  },

  text_address: function( ) {
    return 0x10 ;
  },

  data_address: function( ) {
    return this.text_address( ) + this.header.text_size( ) ;
  },

  // when no relocations
  symbol_address: function( ) {
    return this.data_address( ) + this.header.data_size( ) ;
  },

  end_address: function( ) {
    return this.symbol_address( ) + this.header.symbol_size( ) ;
  }


} ;
