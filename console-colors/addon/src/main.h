#include <node.h>
#include <windows.h>
#include <iostream>

#include "require.h"
#include "console.h"

using namespace v8;
using namespace std;

Persistent<Object> colorConverter;

Console console;

void init(Local<Object> exports, Local<Object> module);
NODE_MODULE(NODE_GYP_MODULE_NAME, init)

void initConsole();

void getBgCol(const FunctionCallbackInfo<Value>& args);
void setBgCol(const FunctionCallbackInfo<Value>& args);
void getTextCol(const FunctionCallbackInfo<Value>& args);
void setTextCol(const FunctionCallbackInfo<Value>& args);

int parseCol(Local<Value>& c);
Local<String> stringifyCol(int col);