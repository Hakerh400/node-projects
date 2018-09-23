#include "functional.h"

using namespace v8;
using namespace node;
using namespace std;

using namespace functional;

Persistent<Function> Machine::constructor;

void Machine::Init(Local<Object> obj){
  Isolate *iso = obj->GetIsolate();

  Local<FunctionTemplate> tpl = FunctionTemplate::New(iso, New);
  tpl->SetClassName(String::NewFromUtf8(iso, "Machine"));
  tpl->InstanceTemplate()->SetInternalFieldCount(1);

  NODE_SET_PROTOTYPE_METHOD(tpl, "start", Start);
  NODE_SET_PROTOTYPE_METHOD(tpl, "getOutput", GetOutput);

  constructor.Reset(iso, tpl->GetFunction());
  obj->Set(String::NewFromUtf8(iso, "Machine"), tpl->GetFunction());
}

void Machine::New(Args info){
  Isolate *iso = info.GetIsolate();

  if(!info.IsConstructCall()) return err(iso, "Constructor Machine requires 'new'");
  if(info.Length() != 2) return err(iso, "Expected 2 arguments");
  if(!Buffer::HasInstance(info[0])) return err(iso, "First argument must be a Buffer instance");
  if(!Buffer::HasInstance(info[1])) return err(iso, "Second argument must be a Buffer instance");

  Machine *machine = new Machine(iso, info[0], info[1]);
  machine->Wrap(info.This());

  info.GetReturnValue().Set(info.This());
}

Machine::Machine(Isolate *iso, Local<Value> src, Local<Value> input){
  int len = 2;
  Byte *data = new Byte[2];

  data[0] = 'A';
  data[1] = 'B';

  this->data.Reset(iso, Buffer::New(iso, (char*)data, len).ToLocalChecked());
}

Machine::~Machine(){
  data.Reset();
}

void Machine::Start(Args info){
  Isolate *iso = info.GetIsolate();

  Local<Value> args[] = {String::NewFromUtf8(iso, "halt")};
  info.This()->Get(String::NewFromUtf8(iso, "emit")).As<Function>()->Call(info.This(), 1, args);
}

void Machine::GetOutput(Args info){
  Isolate *iso = info.GetIsolate();

  Machine *machine = Unwrap<Machine>(info.This());
  info.GetReturnValue().Set(machine->data);
}