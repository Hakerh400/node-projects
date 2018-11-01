#include "main.h"
#include "BMPParser.h"

using namespace v8;
using namespace std;

NODE_MODULE(NODE_GYP_MODULE_NAME, init)

void init(Local<Object> exports, Local<Object> module){
  Isolate *iso = Isolate::GetCurrent();
  exports->Set(String::NewFromUtf8(iso, "parse"), Function::New(iso, parse));
}

void parse(const FunctionCallbackInfo<Value> &info){
  Isolate *iso = Isolate::GetCurrent();
  Local<Context> ctx = iso->GetCurrentContext();

  Local<Object> buff = info[0]->ToObject(ctx).ToLocalChecked();
  unsigned char *data = (unsigned char*)node::Buffer::Data(buff);
  int32_t len = node::Buffer::Length(buff);

  BMPParser::Parser parser;
  parser.parse(data, len);

  int32_t w = parser.getWidth();
  int32_t h = parser.getHeight();
  unsigned char *imgd = parser.getImgd();

  int arrLen = w * h << 2;
  Local<ArrayBuffer> ab = ArrayBuffer::New(iso, (void*)imgd, arrLen);
  Local<Uint8Array> arr = Uint8Array::New(ab, 0, arrLen);

  Local<Object> img = Object::New(iso);
  img->Set(String::NewFromUtf8(iso, "width"), Number::New(iso, w));
  img->Set(String::NewFromUtf8(iso, "height"), Number::New(iso, h));
  img->Set(String::NewFromUtf8(iso, "data"), arr);

  info.GetReturnValue().Set(img);
}