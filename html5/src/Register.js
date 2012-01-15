var Register = {

  value: null,
  uint8: null,

  create: function( ) {
    var buffer = new ArrayBuffer( 2 ) ;
    this.value = new Int16Array( buffer ) ;
    this.uint8 = new Uint8Array( buffer ) ;
    this.value[ 0 ] = 0 ;
    return this ;
  },

  set: function( val ) {
    this.value[ 0 ] = val ;
    return this.get( ) ;
  },

  set_byte: function( val ) {
    this.uint8[ 0 ] = val ;
    this.uint8[ 1 ] = 0 ;
    return this.get_byte( ) ;
  },

  get: function( val ) {
    return this.value[ 0 ] ;
  },

  get_byte: function( val ) {
    return this.uint8[ 0 ] ;
  },

  increment: function( ) {
    this.value[ 0 ] += 2 ;
    return this.get( ) ;
  },

  decrement: function( ) {
    this.value[ 0 ] -= 2 ;
    return this.get( ) ;
  },

  invert: function( ) {
    this.value[ 0 ] *= -1 ;
    return this.get( ) ;
  }

} ;
