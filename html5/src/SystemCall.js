var SystemCall = {

   0 : { name : 'indir',   argc : 1,
         run : function( pdp11, proc, code, ahead ) {
           var tmp = ahead.shift( ) ;
           pdp11.nextStep( ) ;
           var sys_op = proc.get_word( tmp ) ;
           var backup = pdp11.regs[ 7 ].get( ) ;
           pdp11.regs[ 7 ].set( tmp ) ;
           console.log( SystemCall[ sys_op & 0377 ].name ) ;
           trace_buffer += '{' ;
           trace_buffer += SystemCall[ sys_op & 0377 ].name ;
           for( var i = 0; i < SystemCall[ sys_op & 0377 ].argc; i++ ) {
             trace_buffer += ' ' + sprintf( 16, proc.get_word( pdp11.regs[ 7 ].get( ) + 2 + i * 2 ), 5 ) ;
           }
           SystemCall[ sys_op & 0377 ].run( pdp11, proc, code, ahead ) ;
           trace_buffer += '}' ;
           pdp11.regs[ 7 ].set( backup ) ;
       } },
   1 : { name : 'exit',    argc : 0,
         run : function( pdp11, proc, code, ahead ) {
           proc.exit_flag = true ;
       } },
   2 : { name : 'fork',    argc : 0,
         run : function( pdp11, proc, code, ahead ) {
           // not implemented yet
           ps_stack.push( pdp11.ps ) ;
           pc_stack.push( pdp11.regs[7].get( ) ) ;
           sp_stack.push( pdp11.regs[6].get( ) ) ;
           r5_stack.push( pdp11.regs[5].get( ) ) ;
           ret_stack.push( proc.get_word( pdp11.regs[6].get( ) + 2 ) ) ;
           pdp11.nextStep( ) ;
           pdp11.regs[0].set( 1 ) ; // parent
       } },
   3 : { name : 'read',    argc : 2,
         run : function( pdp11, proc, code, ahead ) {
           pdp11.nextStep( ) ;
           var opr1 = proc.get_word( pdp11.regs[ 7 ].get( ) ) ;
           pdp11.nextStep( ) ;
           var opr2 = proc.get_word( pdp11.regs[ 7 ].get( ) ) ;
           trace_buffer += '(' ;
           trace_buffer += 'buffer:' + sprintf( 16, opr1, 5 ) ;
           trace_buffer += ' length:' + sprintf( 16, opr2, 5 ) ;
           trace_buffer += ' r0:' + sprintf( 16, pdp11.regs[ 0 ].get( ), 5 ) ;
           trace_buffer += ')' ;
           var count = 0 ;
           if( pdp11.regs[ 0 ].get( ) == 0 ) { // stdin
             if( opr2 > stdin.length )
               opr2 = stdin.length ;
             for( var i = 0; i < opr2; i++ ) {
               proc.set_byte( opr1++, stdin.shift( ) ) ;
               count++ ;
             }
           } else {
             var f = proc.files[ pdp11.regs[ 0 ].get( ) ] ;
             if( opr2 > f.inode.size( ) - f.offsetr )
               opr2 = f.inode.size( ) - f.offsetr ;
             var file = object( File ).create( f.inode ) ;
             for( var i = 0; i < opr2; i++ ) {
               proc.set_byte( opr1++, file.byte_data( f.offsetr++ ) ) ;
               count++ ;
             }
           }
           pdp11.regs[ 0 ].set( count ) ;
       } },
   4 : { name : 'write',   argc : 2,
         run : function( pdp11, proc, code, ahead ) {
           var result = '' ;
           var result_hex = '' ;
           pdp11.nextStep( ) ;
           var opr1 = proc.get_word( pdp11.regs[ 7 ].get( ) );
           var opr1_org = opr1 ;
           pdp11.nextStep( ) ;
           var opr2 = proc.get_word( pdp11.regs[ 7 ].get( ) ) ;
           var opr2_org = opr2 ;
           var count = 0 ;
           if( pdp11.regs[ 0 ].get( ) == 1 ) { // stdout
             while( proc.get_byte( opr1 ) ) {
               if( pdp11.regs[ 0 ].get( ) == 1 ) {
                 result += String.fromCharCode( proc.get_byte( opr1 ) ) ;
                 result_hex = sprintf( 16, proc.get_byte( opr1 ), 2 ) ;
               }
               opr1++ ;
               count++ ;
             }
           } else {
             var f = proc.files[ pdp11.regs[ 0 ].get( ) ] ;
             var file = object( File ).create( f.inode ) ;
//             if( opr2 > f.inode.size( ) - f.offsetw )
//               expand.size( ) ;?
             for( var i = 0; i < opr2; i ++ ) {
               // to slow and heavy logic
               // it's better to place in another class
               if( ! file.inode.is_ILARG( ) ) {
                 if( ! file.inode.addr( parseInt( f.offsetw / 512 ) ) ) {
                   file.inode.set_addr( parseInt( f.offsetw / 512 ), Kernel.alloc( ) ) ;
                 }
               }
               file.set_byte_data( f.offsetw++, proc.get_byte( opr1++ ) ) ;
               count++ ;
             }
             if( f.inode.size( ) < f.offsetw ) {
               f.inode.set_size( f.offsetw ) ;
             }
           }
//           proc.result += result ;
           runview.value += result ;
           trace_buffer += ' (' ;
           trace_buffer += 'strings:\'' + result.replace( /\n/g, "\\n" ) + '\'(' + result_hex + ')' ;
           trace_buffer += ' buffer:' + sprintf( 16, opr1_org, 5 ) ;
           trace_buffer += ' length:' + sprintf( 16, opr2_org, 5 ) ;
           trace_buffer += ' r0:' + sprintf( 16, pdp11.regs[ 0 ].get( ), 5 ) ;
           trace_buffer += ')' ;
           pdp11.regs[ 0 ].set( count ) ;
       } },
   5 : { name : 'open',    argc : 2,
         run : function( pdp11, proc, code, ahead ) {
           pdp11.nextStep( ) ;
           var opr1 = proc.get_word( pdp11.regs[ 7 ].get( ) ) ;
           pdp11.nextStep( ) ;
           var opr2 = proc.get_word( pdp11.regs[ 7 ].get( ) ) ;
           var path = '' ;
           while( proc.get_byte( opr1 ) ) {
             path += String.fromCharCode( proc.get_byte( opr1 ) ) ;
             opr1++ ;
           }
           var inode = Kernel.namei( path ) ;
           if( ! inode ) {
             pdp11.regs[ 0 ].set( 0 ) ;
             pdp11.ps.c = true ;
             return ;
           }
           var num = Kernel.falloc( proc, inode ) ;
           pdp11.regs[ 0 ].set( num ) ;
       } },
   6 : { name : 'close',   argc : 0,
         run : function( pdp11, proc, code, ahead ) {
/*
           var f = proc.files[ pdp11.regs[ 0 ].value ] ;
           if( f ) {
             proc.filse[ pdp11.regs[ 0 ].value ] = null ;
           }
*/
       } },
   7 : { name : 'wait',    argc : 0,
         run : function( pdp11, proc, code, ahead ) {
           var tmp_ps = pdp11.ps ;
           var tmp_pc = pdp11.regs[ 7 ].get( ) ;
           var tmp_sp = pdp11.regs[ 6 ].get( ) ;
           var tmp_r5 = pdp11.regs[ 5 ].get( ) ;
           var tmp_ret = proc.get_word( pdp11.regs[6].get( ) + 2 ) ;
           pdp11.ps            = ps_stack.pop( ) ;
           pdp11.regs[7].set( pc_stack.pop( ) ) ;
           pdp11.regs[6].set( sp_stack.pop( ) ) ;
           pdp11.regs[5].set( r5_stack.pop( ) ) ;
           proc.set_word( pdp11.regs[ 6 ].get( ) + 2, ret_stack.pop( ) ) ;
           ps_stack.push( tmp_ps ) ;
           pc_stack.push( tmp_pc ) ;
           sp_stack.push( tmp_sp ) ;
           r5_stack.push( tmp_r5 - 2 ) ; // ?
           ret_stack.push( tmp_ret ) ;
           pdp11.regs[0].set( 0 ) ; // child
       } },
   8 : { name : 'creat',   argc : 2,
         run : function( pdp11, proc, code, ahead ) {
           pdp11.nextStep( ) ;
           var opr1 = proc.get_word( pdp11.regs[ 7 ].get( ) ) ;
           pdp11.nextStep( ) ;
           var opr2 = proc.get_word( pdp11.regs[ 7 ].get( ) ) ;
           var path = '' ;
           while( proc.get_byte( opr1 ) ) {
             path += String.fromCharCode( proc.get_byte( opr1 ) ) ;
             opr1++ ;
           }
           var inode = Kernel.namei( path ) ;
           if( ! inode )
             inode = Kernel.maknod( ) ;
           var num = Kernel.falloc( proc, inode ) ;
           pdp11.regs[ 0 ].set( num ) ;
       } },
   9 : { name : 'link',    argc : 2 },
  10 : { name : 'unlink',  argc : 1,
         run : function( pdp11, proc, code, ahead ) {
           pdp11.nextStep( ) ;
           var opr1 = proc.get_word( pdp11.regs[ 7 ].get( ) ) ;
           var path = '' ;
           while( proc.get_byte( opr1 ) ) {
             path += String.fromCharCode( proc.get_byte( opr1 ) ) ;
             opr1++ ;
           }
           var inode = Kernel.namei( path ) ;
           if( ! inode ) {
             pdp11.ps.c = true ;
             return ;
           }
           u_dir.remove_entry( inode.i_number ) ;
       } },
  11 : { name : 'exec',    argc : 2,
         run : function( pdp11, proc, code, ahead ) {
           pdp11.nextStep( ) ;
           var opr1 = proc.get_word( pdp11.regs[ 7 ].get( ) ) ;
           pdp11.nextStep( ) ;
           var opr2 = proc.get_word( pdp11.regs[ 7 ].get( ) ) ;
           var path = '' ;
           while( proc.get_byte( opr1 ) ) {
             path += String.fromCharCode( proc.get_byte( opr1 ) ) ;
             pdp11.ps.c = true ;
             opr1++ ;
           }
           var inode = Kernel.namei( path ) ;
           if( ! inode ) {
             pdp11.regs[ 0 ].set( 0 ) ;
             return ;
           }
           var args = '' ;
           var addr = 0 ;
           var str  = '' ;
           var first = true ;
           while( addr = proc.get_word( opr2 ) ) {
             while( str = proc.get_byte( addr++ ) ) {
               if( ! first )
                 args += String.fromCharCode( str ) ;
             }

             if( ! first )
               args += ' ' ;
             opr2 += 2 ;
             first = false ;
           }

           var file = object( File ).create( inode ) ;

           if( ! file.isExe( ) )
             return ;

           var old_current_name = current_name ;
           current_name = u_name ;
           var old_argview_value = argview.value ;
           argview.value = args ;

//           runview.value   += proc.result ;
           traceview.value += trace_buffer ;
           proc.result = '' ;
           trace_buffeer = '' ;
           var exe = object( Exe ).create( file ) ;
           var proc = object( Proc ).create( ) ;
           proc.load( exe ) ;
           var result = proc.run( ) ;
//           runview.innerHTML   += result.result ;
//           traceview.innerHTML += result.trace ;

           current_name = old_current_name ;
           argview.value = old_argview_value ;
           pdp11.ps              = ps_stack.pop( ) ;
           pdp11.regs[ 7 ].set( pc_stack.pop( ) ) ;
           pdp11.regs[ 6 ].set( sp_stack.pop( ) ) ;
           pdp11.regs[ 5 ].set( r5_stack.pop( ) ) ;
           pdp11.regs[ 0 ].set( 1 ) ; // ?

       } },
  12 : { name : 'chdir',   argc : 1 },
  13 : { name : 'time',    argc : 0,
         run : function( pdp11, proc, code, ahead ) {
           var now = parseInt( ( new Date( ) ).getTime( ) / 1000 ) ;
           pdp11.regs[ 0 ].set( ( now & 0xffff0000 ) >> 16 ) ;
           pdp11.regs[ 1 ].set( now & 0xffff ) ;
       } },
  14 : { name : 'mknod',   argc : 3 },
  15 : { name : 'chmod',   argc : 2,
         run : function( pdp11, proc, code, ahead ) {
           pdp11.nextStep( ) ;
           var opr1 = proc.get_word( pdp11.regs[ 7 ].get( ) ) ;
           pdp11.nextStep( ) ;
           var opr2 = proc.get_word( pdp11.regs[ 7 ].get( ) ) ;
           var path = '' ;
           while( proc.get_byte( opr1 ) ) {
             path += String.fromCharCode( proc.get_byte( opr1 ) ) ;
             opr1++ ;
           }
           var inode = Kernel.namei( path ) ;
           if( ! inode )
             return ;
           inode.set_mode( opr2 & 0xffff ) ;
       } },
  16 : { name : 'chown',   argc : 2 },
  17 : { name : 'break',   argc : 1,
         // not implemented yet
         run : function( pdp11, proc, code, ahead ) {
           pdp11.nextStep( ) ;
           var opr1 = proc.get_word( pdp11.regs[ 7 ].get( ) ) ;
       } },
  18 : { name : 'stat',    argc : 2,
         run : function( pdp11, proc, code, ahead ) {
           pdp11.nextStep( ) ;
           var opr1 = proc.get_word( pdp11.regs[ 7 ].get( ) ) ;
           pdp11.nextStep( ) ;
           var opr2 = proc.get_word( pdp11.regs[ 7 ].get( ) ) ;
           var path = '' ;
           while( proc.get_byte( opr1 ) ) {
             path += String.fromCharCode( proc.get_byte( opr1 ) ) ;
             opr1++ ;
           }
           var inode = Kernel.namei( path ) ;
           if( ! inode )
             return ;
           proc.set_word( opr2, 0 ) ; // dev : temporary
           opr2 += 2 ;
           proc.set_word( opr2, inode.i_number ) ;
           opr2 += 2 ;
           proc.set_word( opr2, inode.mode( ) ) ;
           opr2 += 2 ;
           proc.set_byte( opr2++,  inode.nlink( ) ) ;
           proc.set_byte( opr2++,  inode.uid( ) ) ;
           proc.set_byte( opr2++,  inode.gid( ) ) ;
           proc.set_byte( opr2++,  inode.size0( ) ) ;
           proc.set_word( opr2, inode.size1( ) ) ;
           opr2 += 2 ;
           for( var i = 0; i < 8; i++ ) {
             proc.set_word( opr2, inode.addr( i ) ) ;
             opr2 += 2 ;
           }
           proc.set_word( opr2, inode.atime( 0 ) ) ;
           opr2 += 2 ;
           proc.set_word( opr2, inode.atime( 1 ) ) ;
           opr2 += 2 ;
           proc.set_word( opr2, inode.mtime( 0 ) ) ;
           opr2 += 2 ;
           proc.set_word( opr2, inode.mtime( 1 ) ) ;
           opr2 += 2 ;
       } },
  19 : { name : 'seek',    argc : 2,
         run : function( pdp11, proc, code, ahead ) {
           pdp11.nextStep( ) ;
           var opr1 = proc.get_word( pdp11.regs[ 7 ].get( ) ) ;
           pdp11.nextStep( ) ;
           var opr2 = proc.get_word( pdp11.regs[ 7 ].get( ) ) ;
           // is this right?
           if( pdp11.regs[ 0 ].get( ) >= 0 && pdp11.regs[ 0 ].get( ) <= 2 )
             return ;
           var f = proc.files[ pdp11.regs[ 0 ].get( ) ] ;
           if( opr2 > 2 ) {
             opr1 *= 512 ;
             opr2 -= 3 ;
           }
           switch( opr2 ) {

             case 0:
               f.offsetr = opr1 ;
               f.offsetw = opr1 ;
               break ;

             case 1:
               f.offsetr += opr1 ;
               f.offsetw += opr1 ;
               break ;

             case 2:
               var inode = f.inode ;
               f.offsetr = inode.size( ) + opr1 ;
               f.offsetw = inode.size( ) + opr1 ;
               break ;

             default:
               break ;

           }
       } },
  20 : { name : 'getpid',  argc : 0 },
  21 : { name : 'mount',   argc : 3 },
  22 : { name : 'unmount', argc : 1 },
  23 : { name : 'setuid',  argc : 0 },
  24 : { name : 'setgid',  argc : 0 },
  25 : { name : 'stime',   argc : 0 },
  26 : { name : 'ptrace',  argc : 3 },
  28 : { name : 'fstat',   argc : 1,
         run : function( pdp11, proc, code, ahead ) {
           pdp11.nextStep( ) ;
           var opr1 = proc.get_word( pdp11.regs[ 7 ].get( ) ) ;
           var f = proc.files[ pdp11.regs[ 0 ].get( ) ] ;
           var inode = f.inode ;
           proc.set_word( opr1, 0 ) ; // dev : temporary
           opr1 += 2 ;
           proc.set_word( opr1, inode.i_number ) ;
           opr1 += 2 ;
           proc.set_word( opr1, inode.mode( ) ) ;
           opr1 += 2 ;
           proc.set_byte( opr1++,  inode.nlink( ) ) ;
           proc.set_byte( opr1++,  inode.uid( ) ) ;
           proc.set_byte( opr1++,  inode.gid( ) ) ;
           proc.set_byte( opr1++,  inode.size0( ) ) ;
           proc.set_word( opr1, inode.size1( ) ) ;
           opr1 += 2 ;
           for( var i = 0; i < 8; i++ ) {
             proc.set_word( opr1, inode.addr( i ) ) ;
             opr1 += 2 ;
           }
           proc.set_word( opr1, inode.atime( 0 ) ) ;
           opr1 += 2 ;
           proc.set_word( opr1, inode.atime( 1 ) ) ;
           opr1 += 2 ;
           proc.set_word( opr1, inode.mtime( 0 ) ) ;
           opr1 += 2 ;
           proc.set_word( opr1, inode.mtime( 1 ) ) ;
           opr1 += 2 ;
       } },
  30 : { name : 'smdate',  argc : 1 },
  31 : { name : 'stty',    argc : 1 },
  32 : { name : 'gtty',    argc : 1 },
  34 : { name : 'nice',    argc : 0 },
  35 : { name : 'sleep',   argc : 0 },
  36 : { name : 'sync',    argc : 0,
         run : function( pdp11, proc, code, ahead ) {
         // not implemented yet.
       } },
  37 : { name : 'kill',    argc : 0 },
  38 : { name : 'switch',  argc : 0 },
  41 : { name : 'dup',     argc : 0,
         run : function( pdp11, proc, code, ahead ) {
         // not implemented yet.
       } },
  42 : { name : 'pipe',    argc : 0 },
  43 : { name : 'times',   argc : 1 },
  44 : { name : 'prof',    argc : 4 },
  45 : { name : 'tiu',     argc : 0 },
  46 : { name : 'setgid',  argc : 0 },
  47 : { name : 'getgid',  argc : 0 },
  48 : { name : 'sig',     argc : 2,
         run : function( pdp11, proc, code, ahead ) {
           pdp11.nextStep( ) ;
           var opr1 = proc.get_word( pdp11.regs[ 7 ].get( ) ) ;
           pdp11.nextStep( ) ;
           var opr2 = proc.get_word( pdp11.regs[ 7 ].get( ) ) ;
         // not implemented yet.
       } }


} ;
