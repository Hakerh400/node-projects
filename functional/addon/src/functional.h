#pragma once

#include "main.h"

using namespace v8;
using namespace node;
using namespace std;

namespace functional{
  class Machine : public ObjectWrap{
  public:
    static void Init(Local<Object> obj);
    static void Start(Args info);
    static void GetOutput(Args info);

    Persistent<Value> data;

  private:
    Machine(Isolate *iso, Local<Value> src, Local<Value> input);
    ~Machine();

    static void New(Args info);
    static Persistent<Function> constructor;
  };
}