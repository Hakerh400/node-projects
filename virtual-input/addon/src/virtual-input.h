#pragma once

#include <windows.h>
#include <iostream>

using namespace std;

namespace VirtualInput{
  extern int sleep;

  int cx();
  int cy();

  void move(int x, int y);

  void mdown();
  void mdown(int x, int y);

  void mup();
  void mup(int x, int y);

  void click();
  void click(int x, int y);

  void kdown(int code);
  void kup(int code);
  void key(int code);
}