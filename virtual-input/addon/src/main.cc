#include <iostream>
#include <windows.h>
#include <node.h>

#include "virtual-input.h"

using namespace v8;
using namespace std;
namespace vi = VirtualInput;

typedef const FunctionCallbackInfo<Value> &CbInfo;

#define FUNC(name) void name(CbInfo info)
#define ISO() Isolate *iso = Isolate::GetCurrent();

#define CTX() \
  ISO(); \
  Local<Context> ctx = iso->GetCurrentContext();

#define ARGS(num) \
  CTX(); \
  int args[num]; \
  for(int i = 0; i < num; i++) \
    args[i] = info[i]->Int32Value(ctx).FromMaybe(0);

#define RET(val) info.GetReturnValue().Set(Number::New(iso, val));

#define WRAP_0(func) FUNC(func){ vi::func(); }
#define WRAP_1(func) FUNC(func){ ARGS(1); vi::func(args[0]); }
#define WRAP_2(func) FUNC(func){ ARGS(2); vi::func(args[0], args[1]); }

#define WRAP_0_2(func) \
  FUNC(func){ \
    if(info.Length() == 0) vi::func(); \
    else { ARGS(2); vi::func(args[0], args[1]); } \
  }

FUNC(cx){ CTX(); RET(vi::cx()); }
FUNC(cy){ CTX(); RET(vi::cy()); }

WRAP_2(move);
WRAP_0_2(mdown);
WRAP_0_2(mup);
WRAP_0_2(click);
WRAP_1(kdown);
WRAP_1(kup);
WRAP_1(key);

FUNC(drag){
  if(info.Length() == 2){
    ARGS(2);
    vi::drag(args[0], args[1]);
  }else{
    ARGS(4);
    vi::drag(args[0], args[1], args[2], args[3]);
  }
}

void init(Local<Object> exports, Local<Object> module){
  NODE_SET_METHOD(exports, "cx", cx);
  NODE_SET_METHOD(exports, "cy", cy);

  NODE_SET_METHOD(exports, "move", move);
  NODE_SET_METHOD(exports, "mdown", mdown);
  NODE_SET_METHOD(exports, "mup", mup);
  NODE_SET_METHOD(exports, "click", click);
  NODE_SET_METHOD(exports, "drag", drag);

  NODE_SET_METHOD(exports, "kdown", kdown);
  NODE_SET_METHOD(exports, "kup", kup);
  NODE_SET_METHOD(exports, "key", key);
}

NODE_MODULE(NODE_GYP_MODULE_NAME, init)