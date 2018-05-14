#include "main.h"

void printf(int val){
  int n = 0x0A;
  int a = 0x30303030;
  int i = 0;

  int m = 1;
  for(i = 0; i < 4; i = i + 1) m = m * 10;
  val = val % m;
  i = 0;

  while(val){
    a = a | (val % 10 << (3 - i << 3));
    val = val / 10;
    i = i + 1;
  }

  asm{
    pushEbp 8 sub 0x35 out
    5 0x34 out
    1 0x30 out
    printf1:
      dispatch
      0x31 in 1 and
      :printf1 jz
    0 0x30 out
  }

  return;
}