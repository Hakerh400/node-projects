#include <iostream>
#include <windows.h>
#include <node.h>

#include "virtual-input.h"

using namespace v8;
using namespace std;
namespace vi = VirtualInput;

/*
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
*/

typedef const FunctionCallbackInfo<Value> &CbInfo;

#define FUNC(name) void name(CbInfo info)
#define ISO() Isolate::GetCurrent()

#define ARGS(num) \
  int args[num]; \
  for(int i = 0; i < num; i++) \
    args[i] = info[i]->Int32Value();

#define RET(val) info.GetReturnValue().Set(Number::New(ISO(), val));

#define WRAP_0(func) FUNC(func){ vi::func(); }
#define WRAP_1(func) FUNC(func){ ARGS(1); vi::func(args[0]); }
#define WRAP_2(func) FUNC(func){ ARGS(2); vi::func(args[0], args[1]); }

#define WRAP_0_2(func) \
  FUNC(func){ \
    if(info.Length() == 0) vi::func(); \
    else { ARGS(2); vi::func(args[0], args[1]); } \
  }

FUNC(cx){ RET(vi::cx()); }
FUNC(cy){ RET(vi::cy()); }

WRAP_2(move);
WRAP_0_2(mdown);
WRAP_0_2(mup);
WRAP_0_2(click);
WRAP_1(kdown);
WRAP_1(kup);
WRAP_1(key);

void init(Local<Object> exports, Local<Object> module){
  NODE_SET_METHOD(exports, "cx", cx);
  NODE_SET_METHOD(exports, "cy", cy);

  NODE_SET_METHOD(exports, "move", move);
  NODE_SET_METHOD(exports, "mdown", mdown);
  NODE_SET_METHOD(exports, "mup", mup);
  NODE_SET_METHOD(exports, "click", click);
  NODE_SET_METHOD(exports, "kdown", kdown);
  NODE_SET_METHOD(exports, "kup", kup);
  NODE_SET_METHOD(exports, "key", key);
}

NODE_MODULE(NODE_GYP_MODULE_NAME, init)