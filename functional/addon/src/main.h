#pragma once

#include <iostream>
#include <node.h>
#include <node_object_wrap.h>
#include <node_buffer.h>

using namespace v8;
using namespace std;

typedef unsigned char Byte;
typedef const FunctionCallbackInfo<Value> &Args;

void init(Local<Object> exports, Local<Object> module);
void err(Isolate *iso, const char *msg);