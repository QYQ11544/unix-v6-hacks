#include <stdio.h>
#include "v6.h"

int main( int argc, char **argv ) {

  FILE *fp ;
  int c ;
  unsigned int i ;
  filsys superblock ;

  fp = fopen( "v6root", "rb" ) ;

  fseek( fp, 0x200, SEEK_SET ) ;
  fread( &superblock, sizeof( superblock ), 1, fp ) ;
  printf( "s_isize %X\n", superblock.s_isize ) ;
  printf( "s_fsize %X\n", superblock.s_fsize ) ;
  printf( "s_nfree %X\n", superblock.s_nfree ) ;
  for( i = 0; i < 100; i++ )
    printf( "s_free[%d] %X\n", i, superblock.s_free[i] ) ;
  printf( "s_ninode %X\n", superblock.s_ninode ) ;
  for( i = 0; i < 100; i++ )
    printf( "s_inode[%d] %X\n", i, superblock.s_inode[i] ) ;
  printf( "s_flock %X\n", superblock.s_flock ) ;
  printf( "s_ilock %X\n", superblock.s_ilock ) ;
  printf( "s_fmod %X\n", superblock.s_fmod ) ;
  printf( "s_ronly %X\n", superblock.s_ronly ) ;
  for( i = 0; i < 2; i++ )
    printf( "s_time[%d] %X\n", i, superblock.s_time[i] ) ;
  fclose( fp ) ;    

  return 0 ;

}

