// trace must be global.

// this class is static.
var Processor = {

  WORD : 0x01,
  BYTE : 0x02,

  // return 16bits value because it's address
  getAddr: function( num, pdp11, proc, ahead, width ) {

    var reg_num = num & 07 ;
    var reg     = pdp11.regs[ reg_num ] ;
    var type    = ( num & 070 ) >> 3 ;

    switch( type ) {

      case 0: // illegal?
        trace.append( 'r' + reg_num + ':' + sprintf( 16, reg.get( ), 5 ) + ' ' ) ;
        return reg_num ;

      case 1:
        trace.append( '(r' + reg_num + '):' + sprintf( 16, proc.get_word( reg.get( ) ), 5 ) + ' ' ) ;
        if( reg_num == 7 )
          return reg.get( ) + 2 ;
        return reg.get( ) ;

      case 2:
        if( reg_num == 7 ) {
          pdp11.nextStep( ) ;
          var val = ahead.shift( ) ;
          trace.append( '$' + sprintf( 16, val, 5 ) + ' ' ) ;
          return val ;
        }
        var value = reg.get( ) ;
        if( reg_num == 7 )
          value += 2 ;
        if( width == Processor.WORD || reg_num == 6 ) {
          reg.increment( ) ;
        } else {
          reg.set( reg.get( ) + 1 ) ;
        }
        trace.append( '(r' + reg_num + ')+:' + sprintf( 16, proc.get_word( value ), 5 ) + ' ' ) ;
        return value ;

      case 3:
        if( reg_num == 7 ) {
          pdp11.nextStep( ) ;
          var val = ahead.shift( ) - 2 ;
          trace.append( '*$' + sprintf( 16, val, 5 ) + ' ' ) ;
          return val ;
        }
        var value = proc.get_word( reg.get( ) ) ;
        if( reg_num == 7 )
          value += 2 ;
        if( width == Processor.WORD || reg_num == 6 ) {
          reg.increment( ) ;
        } else {
          reg.set( reg.get( ) + 1 ) ;
        }
        trace.append( '*(r' + reg_num + ')+:' + sprintf( 16, proc.get_word( value ), 5 ) + ' ' ) ;
        return value ;

      // is this logic right if width != Processor.WORD ?
      case 4:
        if( width == Processor.WORD || reg_num == 6 )
          reg.decrement( ) ;
        else
          reg.set( reg.get( ) - 1 ) ;
        trace.append( '-(r' + reg_num + '):' + sprintf( 16, proc.get_word( reg.get( ) ), 5 ) + ' ' ) ;
        return reg.get( ) ;

      // is this logic right if width != Processor.WORD ?
      case 5:
        if( width == Processor.WORD || reg_num == 6 )
          reg.decrement( ) ;
        else
          reg.set( reg.get( ) - 1 ) ;
        var val = proc.get_word( reg.get( ) ) ;
        trace.append( '*-(r' + reg_num + '):' + sprintf( 16, proc.get_word( val ), 5 ) + ' ' ) ;
        return val ;

      case 6:
        pdp11.nextStep( ) ;
        if( reg_num == 7 ) {
          var val = pdp11.regs[ 7 ].get( ) + ahead.shift( ) + 2 ;
          trace.append( sprintf( 16, val, 5 ) + ':' + sprintf( 16, proc.get_word( val ), 5 ) + ' ' ) ;
          return val ;
        }
        var val = ahead.shift( ) ;
        trace.append( sprintf( 16, val, 5 )
                      + '(r' + reg_num + '):'
                      + sprintf( 16, proc.get_word( reg.get( ) + val ), 5 ) + ' ' ) ;
        return reg.get( ) + val ;

      case 7:
        pdp11.nextStep( ) ;
        if( reg_num == 7 ) {
          var val = pdp11.regs[ 7 ].get( ) + ahead.shift( ) + 2 ;
          trace.append( '$' + sprintf( 16, val, 5 ) + ' ' ) ;
          return proc.get_word( val ) ;
        }
        var val = proc.get_word( reg.get( ) + ahead.shift( ) ) ;
        trace.append( sprintf( 16, val, 5 )
                      +  '(r' + reg_num + '):' + sprintf( 16, proc.get_word( val ), 5 ) + ' ' ) ;
        return val ;

      default:
        break ;

    }

  },

  getReg: function( num, pdp11, proc, ahead, width ) {

    var reg_num = num & 07 ;
    var reg     = pdp11.regs[ reg_num ] ;
    var type    = ( num & 070 ) >> 3 ;

    switch( type ) {

      case 0:
        var addr = this.getAddr( num, pdp11, proc, ahead, width ) ;
        if( width == Processor.WORD )
          return reg.get( ) ;
        return reg.get_byte( ) ;

      case 2:
      case 3:
        if( reg_num == 7 ) {
          return this.getAddr( num, pdp11, proc, ahead, width ) ;
        }

      case 1:
      case 4:
      case 5:
      case 6:
      case 7:
        var addr = this.getAddr( num, pdp11, proc, ahead, width ) ;
        if( width == Processor.WORD )
          return proc.get_word( addr ) ;
        return proc.get_byte( addr ) ;

      default:
        break ;

    }

  },

  setReg: function( num, pdp11, proc, ahead, width, value ) {

    var reg_num = num & 07 ;
    var reg     = pdp11.regs[ reg_num ] ;
    var type    = ( num & 070 ) >> 3 ;

    switch( type ) {

      case 0:
        var addr = this.getAddr( num, pdp11, proc, ahead, width ) ;
        if( width == Processor.WORD )
          reg.set( value ) ;
        else
          reg.set_byte( value ) ;
        break ;

      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
      case 6:
      case 7:
        var addr = this.getAddr( num, pdp11, proc, ahead, width ) ;
        if( width == Processor.WORD )
          proc.set_word( addr, value ) ;
        else
          proc.set_byte( addr, value ) ;
        break ;

      default:
        break ;

    }

  },

  // return result
  setRel: function( num, pdp11, proc, ahead, width, value, func ) {
    var addr = this.getAddr( num, pdp11, proc, ahead, width ) ;
    var val ;
    if( ( num & 070 ) == 000 ) {
      val = pdp11.regs[ num ].get( ) ;
      val = func( val, value ) ;
      pdp11.regs[ num ].set( val ) ;
    } else {
      if( width == Processor.WORD ) {
        val = func( proc.get_word( addr ), value ) ;
        proc.set_word( addr, val ) ;
      } else {
        val = func( proc.get_byte( addr ), value ) ;
        proc.set_byte( addr, val ) ;
      }
    }
    return val ;
  },

} ;
