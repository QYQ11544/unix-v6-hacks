// import BinData
// import Inode
// import object

/**
 * @param {Integer} type bin->2, oct->8, degit->10, hext->16
 * @param {Integer} num
 * @param {Integer} figures
 */
function sprintf( type, num, figure ) {

  if( num == null ) {
    window.alert( 'error:srpintf. ' + type + ', ' + num + ', ' + figure ) ;
  }

  var base = '' ;
  var prefix = ''
  var minus = '' ;
/*
  if( num < 0 ) {
    minus = '-' ;
    num *= -1 ;
  }
*/
  if( type == 8 )
    prefix = '0' ;
  else if( type == 16 )
    prefix = '0x' ;

  for( var i = 0; i < figure; i++ )
    base += '0' ;

  if( num != null )
    return minus + prefix + ( base + num.toString( type ) ).substr( -1 * figure ) ;

  return minus + prefix ;

}

/**
 * get Inode
 * @param {Integer} i_number
 */
function get_inode( i_number ) {
  // bin_data must be global.
  return object( Inode ).create( i_number, bin_data ) ;
}
