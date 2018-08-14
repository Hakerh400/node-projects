#pragma once

#include <iostream>
#include <windows.h>
#include <node.h>

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

  void drag(int x, int y);
  void drag(int x1, int y1, int x2, int y2);

  void kdown(int code);
  void kup(int code);
  void key(int code);
}