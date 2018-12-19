#include <iostream>
#include <windows.h>
#include <node.h>

#include "screenshot.h"

using namespace v8;
using namespace std;
namespace scs = Screenshot;

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
    args[i] = info[i + 1]->Int32Value(ctx).FromMaybe(0);

#define RET(val) info.GetReturnValue().Set(val);

FUNC(take){
  ARGS(4);
  Local<Uint8ClampedArray> uintArr = info[0].As<Uint8ClampedArray>();
  uint8_t *data = (uint8_t*)uintArr->Buffer()->GetContents().Data();
  scs::take(data, args[0], args[1], args[2], args[3]);
}

void init(Local<Object> exports, Local<Object> module){
  NODE_SET_METHOD(exports, "take", take);
}

NODE_MODULE(NODE_GYP_MODULE_NAME, init)