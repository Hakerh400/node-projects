#include "main.h"

int b1 = 8;

int main(){
  b1 = (5, 7, 11, (b1 + 4));
  return b1;
}