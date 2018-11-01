#pragma once

#include <iostream>
#include <node.h>
#include <node_object_wrap.h>
#include <node_buffer.h>

using namespace v8;
using namespace std;

void init(Local<Object> exports, Local<Object> module);
void parse(const FunctionCallbackInfo<Value> &info);