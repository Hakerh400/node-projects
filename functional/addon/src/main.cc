#include "main.h"
#include "functional.h"

using namespace v8;
using namespace std;

NODE_MODULE(NODE_GYP_MODULE_NAME, init)

void init(Local<Object> exports, Local<Object> module){
  functional::Machine::Init(exports);
}

void err(Isolate *iso, const char *msg){
  iso->ThrowException(Exception::TypeError(String::NewFromUtf8(iso, msg)));
}