var OpHandler = {

  mov: function( pdp11, proc, code, ahead, width ) {
    var val = Processor.getReg( ( code & 0007700 ) >> 6, pdp11, proc, ahead, width ) ;
    Processor.setReg( code & 0000077, pdp11, proc, ahead, width, val ) ;
    pdp11.setFlag( val ) ;
  },

  cmp: function( pdp11, proc, code, ahead, width ) {
    var src = Processor.getReg( ( code & 0007700 ) >> 6, pdp11, proc, ahead, width ) ;
    var des = Processor.getReg( code & 0000077,          pdp11, proc, ahead, width ) ;
    pdp11.setFlag( src - des ) ;
    pdp11.ps.c = src - des < 0 ? true : false ;
  },

  bit: function( pdp11, proc, code, ahead, width ) {
    var src = Processor.getReg( ( code & 0007700 ) >> 6, pdp11, proc, ahead, width ) ;
    var des = Processor.getReg( code & 0000077,          pdp11, proc, ahead, width ) ;
    pdp11.setFlag( src & des ) ;
  },

  bic: function( pdp11, proc, code, ahead, width ) {
    var src = Processor.getReg( ( code & 0007700 ) >> 6, pdp11, proc, ahead, width ) ;
    var val = Processor.setRel( code & 0000077, pdp11, proc, ahead, width, src,
      function( arg1, arg2 ) { return arg1 & ~arg2 ; } ) ;
    pdp11.setFlag( val ) ;
  },

  bis: function( pdp11, proc, code, ahead, width ) {
    var src = Processor.getReg( ( code & 0007700 ) >> 6, pdp11, proc, ahead, width ) ;
    var val = Processor.setRel( code & 0000077, pdp11, proc, ahead, width, src,
      function( arg1, arg2 ) { return arg1 | arg2 ; } ) ;
    pdp11.setFlag( val ) ;
  },

  add: function( pdp11, proc, code, ahead, width ) {
    var src = Processor.getReg( ( code & 0007700 ) >> 6, pdp11, proc, ahead, width ) ;
    var val = Processor.setRel( code & 0000077, pdp11, proc, ahead, width, src,
      function( arg1, arg2 ) { return arg1 + arg2 ; } ) ;
    pdp11.setFlag( val ) ;
  },

  sub: function( pdp11, proc, code, ahead, width ) {
    var src = Processor.getReg( ( code & 0007700 ) >> 6, pdp11, proc, ahead, width ) ;
    var val = Processor.setRel( code & 0000077, pdp11, proc, ahead, width, src,
      function( arg1, arg2 ) { return arg1 - arg2 ; } ) ;
    pdp11.setFlag( val ) ;
  },

  clr: function( pdp11, proc, code, ahead, width ) {
    Processor.setReg( code & 0000077, pdp11, proc, ahead, width, 0 ) ;
    pdp11.setFlag( 0 ) ;
  },

  com: function( pdp11, proc, code, ahead, width ) {
    var val = Processor.setRel( code & 0000077, pdp11, proc, ahead, width, 0,
      function( arg1, arg2 ) { return ~arg1 ; } ) ;
    pdp11.setFlag( val ) ;
    pdp11.ps.c = true ;
  },

  inc: function( pdp11, proc, code, ahead, width ) {
    var val = Processor.setRel( code & 0000077, pdp11, proc, ahead, width, 1,
      function( arg1, arg2 ) { return arg1 + arg2 ; } ) ;
    pdp11.setFlag( val ) ;
  },

  dec: function( pdp11, proc, code, ahead, width ) {
    var val = Processor.setRel( code & 0000077, pdp11, proc, ahead, width, 1,
      function( arg1, arg2 ) { return arg1 - arg2 ; } ) ;
    pdp11.setFlag( val ) ;
  },

  neg: function( pdp11, proc, code, ahead, width ) {
    var val = Processor.setRel( code & 0000077, pdp11, proc, ahead, width, -1,
      function( arg1, arg2 ) { return arg1 * arg2 ; } ) ;
    pdp11.setFlag( val ) ;
    pdp11.ps.c = val ? true : false ;
  },

  adc: function( pdp11, proc, code, ahead, width ) {
    if( ! pdp11.ps.c )
      return ;

    var val = Processor.setRel( code & 0000077, pdp11, proc, ahead, width, 1,
      function( arg1, arg2 ) { return arg1 + arg2 ; } ) ;
    pdp11.setFlag( val ) ;
  },

  sbc: function( pdp11, proc, code, ahead, width ) {
    if( pdp11.ps.c )
      return ;

    var val = Processor.setRel( code & 0000077, pdp11, proc, ahead, width, 1,
      function( arg1, arg2 ) { return arg1 - arg2 ; } ) ;
    pdp11.setFlag( val ) ;
  },

  tst: function( pdp11, proc, code, ahead, width ) {
    var val = Processor.getReg( code & 0000077, pdp11, proc, ahead, width ) ;
    pdp11.setFlag( val ) ;
  },

  br: function( pdp11, proc, code, ahead, width ) {
    var des  = code & 0177 ;
    var sign = code & 0200 ;
    if( sign )
      des = ( ( ( code & 0377 ) - 1 ) ^ 0377 ) * -1 ;
    pdp11.regs[ 7 ].set( pdp11.regs[ 7 ].get( ) + ( des * 2 ) ) ;
    trace_buffer += sprintf( 16, pdp11.regs[ 7 ].get( ) + 2, 5 ) + ' ' ;
  },

  rol: function( pdp11, proc, code, ahead, width ) {
    var val = Processor.setRel( code & 0000077, pdp11, proc, ahead, width, -1,
      function( arg1, arg2 ) {
        return ( ( arg1 << 1 ) | ( ( arg1 & 0x8000 ) >> 15 ) ) & 0xffff ;
      } ) ;
    pdp11.setFlag( val ) ;
    pdp11.ps.c = val & 1 ;
    pdp11.ps.v = pdp11.ps.n ^ pdp11.ps.c ;
  },

  ror: function( pdp11, proc, code, ahead, width ) {
    var val = Processor.setRel( code & 0000077, pdp11, proc, ahead, width, -1,
      function( arg1, arg2 ) {
        return ( ( arg1 >> 1 ) | ( ( arg1 & 1 ) << 15 ) ) & 0xffff ;
      } ) ;
    pdp11.setFlag( val ) ;
    pdp11.ps.c = val & 0x8000 ;
    pdp11.ps.v = pdp11.ps.n ^ pdp11.ps.c ;
  },

  asr: function( pdp11, proc, code, ahead, width ) {
    var val = Processor.setRel( code & 0000077, pdp11, proc, ahead, width, 1,
      function( arg1, arg2 ) {
       return arg1 >> arg2 ;
      } ) ;
    pdp11.setFlag( val ) ;
    pdp11.ps.c = val & 1 ; // this isn't right
    pdp11.ps.v = pdp11.ps.n ^ pdp11.ps.c ;
  },

  asl: function( pdp11, proc, code, ahead, width ) {
    var val = Processor.setRel( code & 0000077, pdp11, proc, ahead, width, 1,
      function( arg1, arg2 ) {
       return arg1 << arg2 ;
      } ) ;
    pdp11.setFlag( val ) ;
    pdp11.ps.c = val & 0x8000 ; // this isn't right.
    pdp11.ps.v = pdp11.ps.n ^ pdp11.ps.c ;
  }

} ;
