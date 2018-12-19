#pragma once

#include <iostream>
#include <windows.h>
#include <node.h>

using namespace std;
using namespace v8;

namespace Screenshot{
  void take(uint8_t *data, int x, int y, int w, int h);
}