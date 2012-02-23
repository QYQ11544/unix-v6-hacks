// import PS
// import Register
// import Util
// import object

var PDP11 = {

  ps: null,
  regs: null,
  exe: null,

  create: function( ) {
    this.ps = object( PS ).create( ) ;
    this.regs = new Array( ) ;
    for( var i = 0; i < 8; i++ )
      this.regs.push( object( Register ).create( ) ) ;
    return this ;
  },

  nextStep: function( ) {
    this.regs[ 7 ].increment( ) ;
  },

  setFlag: function( val ) {
    this.ps.c = val > 0xffff || val < -0x10000 ? true : false ;
    this.ps.v = false ;
    this.ps.n = val < 0 ? true : false ;
    this.ps.z = val ? false : true ;
  },

  string: function( proc ) {
    var buffer = '' ;
    buffer += this.ps.string( ) + ' ' ;
    for( var i = 0; i < 6; i++ ) {
      buffer += 'r' + i + ':' + sprintf( 16, this.regs[ i ].get( ), 5 ) + ', ' ;
    }
    buffer += 'r6:' + sprintf( 16, this.regs[ 6 ].get( ), 5 ) + ' ' ;
    buffer += '{' ;
    for( var i = 0; i < 8; i += 2 ) {
      if( i != 0 )
        buffer += ', ' ;
      buffer += sprintf( 16, proc.get_word( this.regs[ 6 ].get( ) + i ), 5 ) ;
    }
    buffer += '}, ' ;
    buffer += 'r7:' + sprintf( 16, this.regs[ 7 ].get( ), 5 ) + ' ' ;

    return buffer ;
  },

  getRegsAsArray: function( ) {
    var array = new Array( ) ;
    for( var i = 0; i < this.regs.length; i++ ) {
      array.push( this.regs[ i ].get( ) ) ;
    }
    return array ;
  },

  getPSAsHashArray: function( ) {
    return { 'c' : this.ps.c, 'v' : this.ps.v, 'n' : this.ps.n, 'z' : this.ps.z } ;
  },

  loadRegs: function( array ) {
    for( var i = 0; i < this.regs.length; i++ ) {
      this.regs[ i ].set( array[ i ] ) ;
    }
  },

  loadPS: function( array ) {
    this.ps.c = array.c ;
    this.ps.v = array.v ;
    this.ps.n = array.n ;
    this.ps.z = array.z ;
  }

} ;
