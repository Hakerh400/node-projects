#pragma once

#include <iostream>
#include <string>
#include <cassert>

using namespace std;

namespace BMPParser{
  typedef unsigned char byte;

  enum Status{
    EMPTY,
    OK,
    ERROR,
  };

  class Parser{
  public:
    Parser();
    ~Parser();
    void parse(byte *data, int len);
    int32_t getWidth() const;
    int32_t getHeight() const;
    byte *getImgd() const;
    string getErrMsg() const;

  private:
    Status status;

    byte *data;
    byte *ptr;
    int len;

    int32_t w;
    int32_t h;
    byte *imgd;

    string err;
    string op;

    template <typename T> T get();
    string getStr(int len, bool reverse=false);
    void skip(int len);

    void setOp(string op);
    string getOp() const;

    void setErrUnsupported(string msg);
    void setErrUnknown(string msg);
    void setErr(string msg);
    string getErr() const;
  };
}