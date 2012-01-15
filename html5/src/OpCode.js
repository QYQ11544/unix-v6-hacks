// import OpType
// import Processor

var OpCode = [

  { judge : 0177777, value : 0170011, op : 'setd',  type : OpType.I_OTHER,
    run : function( pdp11, proc, code, ahead ) { } },
  { judge : 0170000, value : 0010000, op : 'mov',   type : OpType.I_DOUBLE,
    run : function( pdp11, proc, code, ahead ) {
      OpHandler.mov( pdp11, proc, code, ahead, Processor.WORD ) ;
  } },
  { judge : 0170000, value : 0110000, op : 'movb',  type : OpType.I_DOUBLE,
    run : function( pdp11, proc, code, ahead ) {
      OpHandler.mov( pdp11, proc, code, ahead, Processor.BYTE ) ;
  } },
  { judge : 0170000, value : 0020000, op : 'cmp',   type : OpType.I_DOUBLE,
    run : function( pdp11, proc, code, ahead ) {
      OpHandler.cmp( pdp11, proc, code, ahead, Processor.WORD ) ;
  } },
  { judge : 0170000, value : 0120000, op : 'cmpb',  type : OpType.I_DOUBLE,
    run : function( pdp11, proc, code, ahead ) {
      OpHandler.cmp( pdp11, proc, code, ahead, Processor.BYTE ) ;
  } },
  { judge : 0170000, value : 0030000, op : 'bit',   type : OpType.I_DOUBLE,
    run : function( pdp11, proc, code, ahead ) {
      OpHandler.bit( pdp11, proc, code, ahead, Processor.WORD ) ;
  } },
  { judge : 0170000, value : 0130000, op : 'bitb',  type : OpType.I_DOUBLE,
    run : function( pdp11, proc, code, ahead ) {
      OpHandler.bit( pdp11, proc, code, ahead, Processor.BYTE ) ;
  } },
  { judge : 0170000, value : 0040000, op : 'bic',   type : OpType.I_DOUBLE,
    run : function( pdp11, proc, code, ahead ) {
      OpHandler.bic( pdp11, proc, code, ahead, Processor.WORD ) ;
  } },
  { judge : 0170000, value : 0140000, op : 'bicb',  type : OpType.I_DOUBLE,
    run : function( pdp11, proc, code, ahead ) {
      OpHandler.bic( pdp11, proc, code, ahead, Processor.BYTE ) ;
  } },
  { judge : 0170000, value : 0050000, op : 'bis',   type : OpType.I_DOUBLE,
    run : function( pdp11, proc, code, ahead ) {
      OpHandler.bis( pdp11, proc, code, ahead, Processor.WORD ) ;
  } },
  { judge : 0170000, value : 0150000, op : 'bisb',  type : OpType.I_DOUBLE,
    run : function( pdp11, proc, code, ahead ) {
      OpHandler.bis( pdp11, proc, code, ahead, Processor.BYTE ) ;
  } },
  { judge : 0170000, value : 0060000, op : 'add',   type : OpType.I_DOUBLE,
    run : function( pdp11, proc, code, ahead ) {
      OpHandler.add( pdp11, proc, code, ahead, Processor.WORD ) ;
  } },
  { judge : 0170000, value : 0160000, op : 'sub',   type : OpType.I_DOUBLE,
    run : function( pdp11, proc, code, ahead ) {
      OpHandler.sub( pdp11, proc, code, ahead, Processor.WORD ) ;
  } },
  { judge : 0177000, value : 0070000, op : 'mul',   type : OpType.I_ONEHALF,
    run : function( pdp11, proc, code, ahead ) {
      var reg = ( code & 0000700 ) >> 6 ;
      var src = Processor.getReg( code & 0000077, pdp11, proc, ahead, Processor.WORD ) ;
      var num = pdp11.regs[ reg ].get( ) * src ;

      if( reg & 1 == 0 ) {
        pdp11.regs[ reg + 0 ].set( ( num & 0xffff0000 ) >> 8 ) ;
        pdp11.regs[ reg + 1 ].set( num & 0xffff ) ;
      } else {
        pdp11.regs[ reg + 0 ].set( num & 0xffff ) ;
      }
      pdp11.setFlag( num ) ;
      pdp11.ps.c = num > 0xffffffff | num < -0x100000000 ? true : false ;
  } },
  { judge : 0177000, value : 0071000, op : 'div',   type : OpType.I_ONEHALF,
    run : function( pdp11, proc, code, ahead ) {
      var reg = ( code & 0000700 ) >> 6 ;
      var addr = Processor.getReg( reg, pdp11, proc, ahead, Processor.WORD ) ;
      var src = Processor.getReg( code & 0000077, pdp11, proc, ahead, Processor.WORD ) ;
      var num = ( ( pdp11.regs[ reg + 0 ].get( ) & 0xffff ) << 16 )
                  | ( pdp11.regs[ reg + 1 ].get( ) & 0xffff ) ;

      pdp11.regs[ reg ].set( parseInt( num / src ) & 0xffff ) ;
      pdp11.regs[ reg + 1 ].set( ( num % src ) & 0xffff ) ;
      pdp11.ps.c = ! src ? true : false ;
      pdp11.ps.v = ! src ? true : false ;
  } },
  { judge : 0177000, value : 0072000, op : 'ash',   type : OpType.I_ONEHALF,
    run : function( pdp11, proc, code, ahead ) {
      var reg = ( code & 0000700 ) >> 6 ;
      var src = Processor.getReg( code & 0000077, pdp11, proc, ahead, Processor.WORD ) ;

      if( src > 0 )
        pdp11.regs[ reg ].set( pdp11.regs[ reg ].get( ) << src ) ;
      else
        pdp11.regs[ reg ].set( pdp11.regs[ reg ].get( ) >> ( src * -1 ) ) ;

      pdp11.setFlag( pdp11.regs[ reg ].get( ) ) ;
  } },
  { judge : 0177000, value : 0073000, op : 'ashc',  type : OpType.I_ONEHALF,
    run : function( pdp11, proc, code, ahead ) {
      var reg = ( code & 0000700 ) >> 6 ;
      var addr = Processor.getAddr( ( code & 0000700 ) >> 6, pdp11, proc, ahead, Processor.WORD ) ;
      var src = Processor.getReg( code & 0000077, pdp11, proc, ahead, Processor.WORD ) ;
      var val = ( pdp11.regs[ reg ].get( ) << 16 ) | ( pdp11.regs[ reg + 1 ].get( ) & 0xffff ) ;
      var c ;

      if( src & 040 ) {
        src = ~( src - 1 ) * - 1 ;
      }

      if( src == 0 ) {
        c = false ;
      } else if( src > 0 ) {
        c = val & 0x80000000 ? true : false ;
        val <<= src ;
      } else {
        c = val & 0x1 ? true : false ;
        val >>= ( src * -1 ) ;
      }
      pdp11.regs[ reg ].set( ( val & 0xffff0000 ) >> 16 ) ;
      pdp11.regs[ reg + 1 ].set( val & 0xffff ) ;

      pdp11.setFlag( pdp11.regs[ reg ].get( ) ) ;
      pdp11.ps.c = c ;
  } },
  { judge : 0177000, value : 0074000, op : 'xor',   type : OpType.I_ONEHALF,
    run : function( pdp11, proc, code, ahead ) {
      var reg = Processor.getAddr( ( code & 0000700 ) >> 6, pdp11, proc, ahead, Processor.WORD ) ;
      var addr = Processor.getAddr( code & 0000077, pdp11, proc, ahead, Processor.WORD ) ;
      proc.set_word( addr, pdp11.regs[ reg ].get( ) ^ proc.get_word( addr ) ) ;
      pdp11.setFlag( proc.get_word( addr ) ) ;
  } },
  { judge : 0177000, value : 0075000, op : 'xxx',   type : OpType.I_ONEHALF },
  { judge : 0177000, value : 0076000, op : 'xxx',   type : OpType.I_ONEHALF },
  { judge : 0177000, value : 0077000, op : 'sob',   type : OpType.I_ONEHALF,
    run : function( pdp11, proc, code, ahead ) {
      var reg_no = ( code & 0000700 ) >> 6 ;
      var addr = Processor.getAddr( reg_no, pdp11, proc, ahead, Processor.WORD ) ;
      var reg = pdp11.regs[ reg_no ] ;
      var pc  = pdp11.regs[ 7 ] ;
      var des = code & 0000077 ;
      reg.set( reg.get( ) - 1 ) ;
      if( reg.get( ) ) {
        pc.set( pc.get( ) - ( des * 2 ) ) ;
      }
      pdp11.setFlag( reg.get( ) ) ;
  } },
  { judge : 0177700, value : 0000300, op : 'swab',  type : OpType.I_SINGLE },
  { judge : 0177700, value : 0100300, op : 'bpl',   type : OpType.I_SINGLE },
  { judge : 0177700, value : 0005000, op : 'clr',   type : OpType.I_SINGLE,
    run : function( pdp11, proc, code, ahead ) {
      OpHandler.clr( pdp11, proc, code, ahead, Processor.WORD ) ;
  } },
  { judge : 0177700, value : 0105000, op : 'clrb',  type : OpType.I_SINGLE,
    run : function( pdp11, proc, code, ahead ) {
      OpHandler.clr( pdp11, proc, code, ahead, Processor.BYTE ) ;
  } },
  { judge : 0177700, value : 0005100, op : 'com',   type : OpType.I_SINGLE,
    run : function( pdp11, proc, code, ahead ) {
      OpHandler.com( pdp11, proc, code, ahead, Processor.WORD ) ;
  } },
  { judge : 0177700, value : 0105100, op : 'comb',  type : OpType.I_SINGLE,
    run : function( pdp11, proc, code, ahead ) {
      OpHandler.com( pdp11, proc, code, ahead, Processor.BYTE ) ;
  } },
  { judge : 0177700, value : 0005200, op : 'inc',   type : OpType.I_SINGLE,
    run : function( pdp11, proc, code, ahead ) {
      OpHandler.inc( pdp11, proc, code, ahead, Processor.WORD ) ;
  } },
  { judge : 0177700, value : 0105200, op : 'incb',  type : OpType.I_SINGLE,
    run : function( pdp11, proc, code, ahead ) {
      OpHandler.inc( pdp11, proc, code, ahead, Processor.BYTE ) ;
  } },
  { judge : 0177700, value : 0005300, op : 'dec',   type : OpType.I_SINGLE,
    run : function( pdp11, proc, code, ahead ) {
      OpHandler.dec( pdp11, proc, code, ahead, Processor.WORD ) ;
  } },
  { judge : 0177700, value : 0105300, op : 'decb',  type : OpType.I_SINGLE,
    run : function( pdp11, proc, code, ahead ) {
      OpHandler.dec( pdp11, proc, code, ahead, Processor.BYTE ) ;
  } },
  { judge : 0177700, value : 0005400, op : 'neg',   type : OpType.I_SINGLE,
    run : function( pdp11, proc, code, ahead ) {
      OpHandler.neg( pdp11, proc, code, ahead, Processor.WORD ) ;
  } },
  { judge : 0177700, value : 0105400, op : 'negb',  type : OpType.I_SINGLE,
    run : function( pdp11, proc, code, ahead ) {
      OpHandler.neg( pdp11, proc, code, ahead, Processor.BYTE ) ;
  } },
  { judge : 0177700, value : 0005500, op : 'adc',   type : OpType.I_SINGLE,
    run : function( pdp11, proc, code, ahead ) {
      OpHandler.adc( pdp11, proc, code, ahead, Processor.WORD ) ;
  } },
  { judge : 0177700, value : 0105500, op : 'adcb',  type : OpType.I_SINGLE,
    run : function( pdp11, proc, code, ahead ) {
      OpHandler.adc( pdp11, proc, code, ahead, Processor.BYTE ) ;
  } },
  { judge : 0177700, value : 0005600, op : 'sbc',   type : OpType.I_SINGLE,
    run : function( pdp11, proc, code, ahead ) {
      OpHandler.sbc( pdp11, proc, code, ahead, Processor.WORD ) ;
  } },
  { judge : 0177700, value : 0105600, op : 'sbcb',  type : OpType.I_SINGLE,
    run : function( pdp11, proc, code, ahead ) {
      OpHandler.sbc( pdp11, proc, code, ahead, Processor.BYTE ) ;
  } },
  { judge : 0177700, value : 0005700, op : 'tst',   type : OpType.I_SINGLE,
    run : function( pdp11, proc, code, ahead ) {
      OpHandler.tst( pdp11, proc, code, ahead, Processor.WORD ) ;
  } },
  { judge : 0177700, value : 0105700, op : 'tstb',  type : OpType.I_SINGLE,
    run : function( pdp11, proc, code, ahead ) {
      OpHandler.tst( pdp11, proc, code, ahead, Processor.BYTE ) ;
  } },
  { judge : 0177700, value : 0006000, op : 'ror',   type : OpType.I_SINGLE,
    run : function( pdp11, proc, code, ahead ) {
      OpHandler.ror( pdp11, proc, code, ahead, Processor.WORD ) ;
  } },
  { judge : 0177700, value : 0106000, op : 'rorb',  type : OpType.I_SINGLE },
  { judge : 0177700, value : 0006100, op : 'rol',   type : OpType.I_SINGLE,
    run : function( pdp11, proc, code, ahead ) {
      OpHandler.rol( pdp11, proc, code, ahead, Processor.WORD ) ;
  } },
  { judge : 0177700, value : 0106100, op : 'rolb',  type : OpType.I_SINGLE },
  { judge : 0177700, value : 0006200, op : 'asr',   type : OpType.I_SINGLE,
    run : function( pdp11, proc, code, ahead ) {
      OpHandler.asr( pdp11, proc, code, ahead, Processor.WORD ) ;
  } },
  { judge : 0177700, value : 0106200, op : 'asrb',  type : OpType.I_SINGLE },
  { judge : 0177700, value : 0006300, op : 'asl',   type : OpType.I_SINGLE,
    run : function( pdp11, proc, code, ahead ) {
      OpHandler.asl( pdp11, proc, code, ahead, Processor.WORD ) ;
  } },
  { judge : 0177700, value : 0106300, op : 'aslb',  type : OpType.I_SINGLE },
  { judge : 0177700, value : 0006400, op : 'mark',  type : OpType.I_SINGLE },
  { judge : 0177700, value : 0106400, op : 'mtps',  type : OpType.I_SINGLE },
  { judge : 0177700, value : 0006500, op : 'mfpi',  type : OpType.I_SINGLE },
  { judge : 0177700, value : 0106500, op : 'mfpd',  type : OpType.I_SINGLE },
  { judge : 0177700, value : 0006700, op : 'mtpi',  type : OpType.I_SINGLE,
    run : function( pdp11, proc, code, ahead ) {
      var src = Processor.getReg( code & 0000077, pdp11, proc, ahead, Processor.WORD ) ;
//      pdp11.regs[6].increment( ) ;
      if( ( code & 070 ) == 000 ) {
        pdp11.regs[ code & 07 ].set( 0 ) ;
      } else {
      }
     // how to transfer the data to previous mode area?
  } },
  { judge : 0177700, value : 0106700, op : 'mtpd',  type : OpType.I_SINGLE },
  { judge : 0177700, value : 0006700, op : 'sxt',   type : OpType.I_SINGLE,
    run : function( pdp11, proc, code, ahead ) {
      var val = pdp11.ps.n ? 0xffff : 0x0000 ;
      Processor.setReg( code & 0000077, pdp11, proc, ahead, width, val ) ;
      pdp11.ps.z = val ? false : true ;
  } },
  { judge : 0177700, value : 0106700, op : 'mfps',  type : OpType.I_SINGLE },
  { judge : 0177400, value : 0000400, op : 'br',    type : OpType.I_BRANCH,
    run : function( pdp11, proc, code, ahead ) {
      OpHandler.br( pdp11, proc, code, ahead, Processor.WORD ) ;
  } },
  { judge : 0177400, value : 0001000, op : 'bne',   type : OpType.I_BRANCH,
    run : function( pdp11, proc, code, ahead ) {
      if( ! pdp11.ps.z )
        OpHandler.br( pdp11, proc, code, ahead, Processor.WORD ) ;
  } },
  { judge : 0177400, value : 0001400, op : 'beq',   type : OpType.I_BRANCH,
    run : function( pdp11, proc, code, ahead ) {
      if( pdp11.ps.z )
        OpHandler.br( pdp11, proc, code, ahead, Processor.WORD ) ;
  } },
  { judge : 0177400, value : 0002000, op : 'bge',   type : OpType.I_BRANCH,
    run : function( pdp11, proc, code, ahead ) {
      if( ( pdp11.ps.n ^ pdp11.ps.v ) == 0 )
        OpHandler.br( pdp11, proc, code, ahead, Processor.WORD ) ;
  } },
  { judge : 0177400, value : 0002400, op : 'blt',   type : OpType.I_BRANCH,
    run : function( pdp11, proc, code, ahead ) {
      if( pdp11.ps.n ^ pdp11.ps.v )
        OpHandler.br( pdp11, proc, code, ahead, Processor.WORD ) ;
  } },
  { judge : 0177400, value : 0003000, op : 'bgt',   type : OpType.I_BRANCH,
    run : function( pdp11, proc, code, ahead ) {
      if( ! ( pdp11.ps.z | ( pdp11.ps.n ^ pdp11.ps.v ) ) )
        OpHandler.br( pdp11, proc, code, ahead, Processor.WORD ) ;
  } },
  { judge : 0177400, value : 0003400, op : 'ble',   type : OpType.I_BRANCH,
    run : function( pdp11, proc, code, ahead ) {
      if( ( pdp11.ps.z | ( pdp11.ps.n ^ pdp11.ps.v ) ) )
        OpHandler.br( pdp11, proc, code, ahead, Processor.WORD ) ;
  } },
  { judge : 0177400, value : 0100000, op : 'bpl',   type : OpType.I_BRANCH,
    run : function( pdp11, proc, code, ahead ) {
      if( ! pdp11.ps.n )
        OpHandler.br( pdp11, proc, code, ahead, Processor.WORD ) ;
  } },
  { judge : 0177400, value : 0100400, op : 'bmi',   type : OpType.I_BRANCH,
    run : function( pdp11, proc, code, ahead ) {
      if( pdp11.ps.n )
        OpHandler.br( pdp11, proc, code, ahead, Processor.WORD ) ;
  } },
  { judge : 0177400, value : 0101000, op : 'bhi',   type : OpType.I_BRANCH,
    run : function( pdp11, proc, code, ahead ) {
      if( ! ( pdp11.ps.c | pdp11.ps.z ) )
        OpHandler.br( pdp11, proc, code, ahead, Processor.WORD ) ;
  } },
  { judge : 0177400, value : 0101400, op : 'blos',  type : OpType.I_BRANCH,
    run : function( pdp11, proc, code, ahead ) {
      if( pdp11.ps.c ^ pdp11.ps.z )
        OpHandler.br( pdp11, proc, code, ahead, Processor.WORD ) ;
  } },
  { judge : 0177400, value : 0102000, op : 'bvc',   type : OpType.I_BRANCH },
  { judge : 0177400, value : 0102400, op : 'bvs',   type : OpType.I_BRANCH },
  { judge : 0177400, value : 0103000, op : 'bcc',   type : OpType.I_BRANCH,
    run : function( pdp11, proc, code, ahead ) {
      if( ! pdp11.ps.c )
        OpHandler.br( pdp11, proc, code, ahead, Processor.WORD ) ;
  } },
  { judge : 0177400, value : 0103400, op : 'bcs',   type : OpType.I_BRANCH,
    run : function( pdp11, proc, code, ahead ) {
      if( pdp11.ps.c )
        OpHandler.br( pdp11, proc, code, ahead, Processor.WORD ) ;
  } },
  { judge : 0177777, value : 0000241, op : 'clc',   type : OpType.I_CONDITION },
  { judge : 0177777, value : 0000261, op : 'sec',   type : OpType.I_CONDITION },
  { judge : 0177777, value : 0000242, op : 'clv',   type : OpType.I_CONDITION },
  { judge : 0177777, value : 0000262, op : 'sev',   type : OpType.I_CONDITION },
  { judge : 0177777, value : 0000244, op : 'clz',   type : OpType.I_CONDITION },
  { judge : 0177777, value : 0000264, op : 'sez',   type : OpType.I_CONDITION },
  { judge : 0177777, value : 0000254, op : 'cln',   type : OpType.I_CONDITION },
  { judge : 0177777, value : 0000274, op : 'sen',   type : OpType.I_CONDITION },
  { judge : 0177777, value : 0000257, op : 'ccc',   type : OpType.I_CONDITION },
  { judge : 0177777, value : 0000277, op : 'scc',   type : OpType.I_CONDITION },
  { judge : 0177000, value : 0004000, op : 'jsr',   type : OpType.I_JSR,
    run : function( pdp11, proc, code, ahead ) {
      var reg  = Processor.getAddr( ( code & 0000700 ) >> 6, pdp11, proc, ahead, Processor.WORD ) ;
      var addr = Processor.getAddr( code & 0000077, pdp11, proc, ahead, Processor.WORD ) ;
      if( ( code & 077 ) != 037 ) // is this necessary?
        addr -= 2 ;
      pdp11.regs[ 6 ].decrement( ) ;
      proc.set_word( pdp11.regs[ 6 ].get( ), pdp11.regs[ ( code & 0000700 ) >> 6 ].get( ) ) ;
      pdp11.regs[ ( code & 0000700 ) >> 6 ].set( pdp11.regs[ 7 ].get( ) + 2 ) ;
      pdp11.regs[ 7 ].set( addr ) ;
  } },
  { judge : 0177770, value : 0000200, op : 'rts',   type : OpType.I_RTS,
    run : function( pdp11, proc, code, ahead ) {
      var reg = Processor.getAddr( code & 0000007, pdp11, proc, ahead, Processor.WORD ) ;
      var reg = code & 07 ;
      pdp11.regs[ 7 ].set( pdp11.regs[ reg ].get( ) - 2 ) ;
      pdp11.regs[ reg ].set( proc.get_word( pdp11.regs[ 6 ].get( ) ) ) ;
      pdp11.regs[ 6 ].increment( ) ;
  } },
  { judge : 0177700, value : 0000100, op : 'jmp',   type : OpType.I_JMP,
    run : function( pdp11, proc, code, ahead ) {
      var addr = Processor.getAddr( code & 0000077, pdp11, proc, ahead, Processor.WORD ) ;
      if( ( code & 077 ) != 037 ) // is this necessary?
        addr -= 2 ;
      pdp11.regs[ 7 ].set( addr ) ;
  } },
  { judge : 0177777, value : 0000240, op : 'nop',   type : OpType.I_OTHER },
  { judge : 0177777, value : 0000000, op : 'halt',  type : OpType.I_OTHER },
  { judge : 0177777, value : 0000001, op : 'wait',  type : OpType.I_OTHER },
  { judge : 0177777, value : 0000002, op : 'rti',   type : OpType.I_OTHER },
  { judge : 0177777, value : 0000004, op : 'bpt',   type : OpType.I_OTHER },
  { judge : 0177777, value : 0000005, op : 'reset', type : OpType.I_OTHER },
  { judge : 0177400, value : 0104400, op : 'sys',   type : OpType.I_SYSTEM,
    run : function( pdp11, proc, code, ahead ) {
      var sys = SystemCall[ code & 0377 ] ;
      console.log( sys.name ) ;
      trace_buffer += sys.name + ' ' ;
      for( var i = 0; i < sys.argc; i++ ) {
        trace_buffer += sprintf( 16, proc.get_word( pdp11.regs[ 7 ].get( ) + 2 + i * 2 ), 5 ) + ' ' ;
      }
      sys.run( pdp11, proc, code, ahead ) ;
  } },
  { judge : 0000000, value : 0000000, op : '??',    type : OpType.I_OTHER } // general

] ;
