#include <stdint.h>

typedef struct filsys {
  int16_t s_isize ;
  int16_t s_fsize ;
  int16_t s_nfree ;
  int16_t s_free[100] ;
  int16_t s_ninode ;
  int16_t s_inode[100] ;
  uint8_t s_flock ;
  uint8_t s_ilock ;
  uint8_t s_fmod ;
  uint8_t s_ronly ;
  int16_t s_time[2] ;
  int16_t s_pad[48] ;
} filsys ;

