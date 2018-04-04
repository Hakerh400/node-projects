#include <node.h>

using namespace v8;

Local<Value> require(Local<Object> module, const char* path);