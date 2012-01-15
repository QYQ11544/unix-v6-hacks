var PS = {

  current_mode: null,
  previous_mode: null,
  priority: null,
  trap: null,
  n: null,
  z: null,
  v: null,
  c: null,

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
