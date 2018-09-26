#include "require.h"

using namespace v8;

Local<Value> require(Local<Object> module, const char* path){
  Isolate *isolate = Isolate::GetCurrent();
  Local<Context> context = Context::New(isolate);

  Local<String> strRequire = String::NewFromUtf8(isolate, "require");
  Local<Function> funcRequire = Local<Function>::Cast(module->Get(strRequire));

  Local<String> strDir = String::NewFromUtf8(isolate, "../../../");
  Local<String> strPath = String::Concat(strDir, String::NewFromUtf8(isolate, path));

  Local<Value> args[] = { strPath };
  Local<Value> loadedModule = funcRequire->Call(context, module, 1, args).ToLocalChecked();

  return loadedModule;
}