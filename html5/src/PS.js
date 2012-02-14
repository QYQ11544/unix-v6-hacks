var PS = {

  current_mode: null,
  previous_mode: null,
  priority: null,
  trap: null,
  n: false,
  z: false,
  v: false,
  c: false,

  create: function( ) {
    return this ;
  },

  string: function( ) {
    var buffer = '' ;
    buffer += this.n ? 'n' : '-' ;
    buffer += this.z ? 'z' : '-' ;
    buffer += this.v ? 'v' : '-' ;
    buffer += this.c ? 'c' : '-' ;
    return buffer ;
  }

} ;
