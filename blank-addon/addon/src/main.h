#include <node.h>
#include <iostream>

using namespace v8;
using namespace std;

void init(Local<Object> exports, Local<Object> module);
NODE_MODULE(NODE_GYP_MODULE_NAME, init)