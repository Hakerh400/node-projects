#include "main.h"
using namespace v8;

void init(Local<Object> exports, Local<Object> module){
  Isolate *isolate = Isolate::GetCurrent();
  Local<Context> context = Context::New(isolate);

  colorConverter.Reset(isolate, Local<Object>::Cast(require(module, "../color-converter")));

  Local<String> str = String::NewFromUtf8(isolate, "bgCol");
  Local<Function> funcGetBgCol = Function::New(context, getBgCol).ToLocalChecked();
  Local<Function> funcSetBgCol = Function::New(context, setBgCol).ToLocalChecked();
  exports->SetAccessorProperty(str, funcGetBgCol, funcSetBgCol);

  str = String::NewFromUtf8(isolate, "textCol");
  Local<Function> funcGetTextCol = Function::New(context, getTextCol).ToLocalChecked();
  Local<Function> funcSetTextCol = Function::New(context, setTextCol).ToLocalChecked();
  exports->SetAccessorProperty(str, funcGetTextCol, funcSetTextCol);
}

void getBgCol(const FunctionCallbackInfo<Value>& args){
  Isolate *isolate = Isolate::GetCurrent();

  int col = console.getBgCol();
  Local<String> strCol = stringifyCol(col);

  args.GetReturnValue().Set(strCol);
}

void setBgCol(const FunctionCallbackInfo<Value>& args){
  Isolate *isolate = Isolate::GetCurrent();

  int col = parseCol(args[0]);
  console.setBgCol(col);
}

void getTextCol(const FunctionCallbackInfo<Value>& args){
  Isolate *isolate = Isolate::GetCurrent();

  int col = console.getTextCol();
  Local<String> strCol = stringifyCol(col);

  args.GetReturnValue().Set(strCol);
}

void setTextCol(const FunctionCallbackInfo<Value>& args){
  Isolate *isolate = Isolate::GetCurrent();
  
  int col = parseCol(args[0]);
  console.setTextCol(col);
}

int parseCol(Local<Value>& c){
  Isolate *isolate = Isolate::GetCurrent();
  Local<Context> context = Context::New(isolate);

  Local<Value> args1[] = { c };
  Local<Object> converter = colorConverter.Get(isolate);
  Local<Function> col2rgb = Local<Function>::Cast(converter->Get(String::NewFromUtf8(isolate, "col2rgb")));
  Local<Array> rgb = Local<Array>::Cast(col2rgb->Call(context, converter, 1, args1).ToLocalChecked());

  int red = rgb->Get(0)->Int32Value();
  int green = rgb->Get(1)->Int32Value();
  int blue = rgb->Get(2)->Int32Value();

  int col = 0;
  int minDiff = -1;

  for(int i = 0; i < 16; i++){
    int val = i & 8 ? 255 : 80;

    int diffRed = abs((i & 1 ? val : 0) - red);
    int diffGreen = abs((i & 2 ? val : 0) - green);
    int diffBlue = abs((i & 4 ? val : 0) - blue);

    int diff = diffRed * diffRed + diffGreen * diffGreen + diffBlue * diffBlue;

    if(minDiff == -1 || diff < minDiff){
      col = i;
      minDiff = diff;

      if(!minDiff) break;
    }
  }

  return col;
}

Local<String> stringifyCol(int col){
  Isolate *isolate = Isolate::GetCurrent();

  int val = col & 8;
  char str[8] = {'#'};

  for(int i = 0; i < 3; i++){
    int index = 1 + (i << 1);

    if(!(col & (1 << i))){
      str[index] = '0';
      str[index + 1] = '0';
    }else if(!val){
      str[index] = '8';
      str[index + 1] = '0';
    }else{
      str[index] = 'f';
      str[index + 1] = 'f';
    }
  }

  Local<String> strCol = String::NewFromUtf8(isolate, str);

  return strCol;
}