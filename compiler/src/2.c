#include "main.h"

int calc(int a, int b){
  int x = a + b * 2;
  int y = (x - 1) * 3;
  int z = x + y;

  return z - 3;
}