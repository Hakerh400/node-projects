#include "main.h"

int calc(int num){
  int count = 0;

  int i = 2;
  while(i < num){
    count = count + isPrime(i);
    i = i + 1;
  }

  return count;
}

int isPrime(int val){
  if(val < 2) return 0;
  int i = 2;
  while(i < val){
    if(!(val % i))
      return 0;
    i = i + 1;
  }
  return 1;
}