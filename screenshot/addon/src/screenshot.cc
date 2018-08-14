#include <iostream>
#include <windows.h>
#include <node.h>
#include <node_buffer.h>

#include "screenshot.h"

using namespace std;
using namespace v8;
namespace scs = Screenshot;

typedef unsigned char Byte;

Local<Object> scs::take(int x, int y, int w, int h){
  Isolate *iso = Isolate::GetCurrent();

  HDC hScreenDC = GetDC(0);
  HDC hLocalDC = CreateCompatibleDC(hScreenDC);

  int iScreenWidth = GetSystemMetrics(SM_CXSCREEN);
  int iScreenHeight = GetSystemMetrics(SM_CYSCREEN);
  int iBpi = GetDeviceCaps(hScreenDC, BITSPIXEL);

  BITMAPINFO info;
  info.bmiHeader.biSize = sizeof(BITMAPINFOHEADER);
  info.bmiHeader.biWidth = iScreenWidth;
  info.bmiHeader.biHeight = iScreenHeight;
  info.bmiHeader.biPlanes = 1;
  info.bmiHeader.biBitCount = iBpi;
  info.bmiHeader.biCompression = BI_RGB;

  Byte *img;
  HBITMAP hBitmap = CreateDIBSection(hLocalDC, &info, DIB_RGB_COLORS, (void**)&img, 0, 0);
  SelectObject(hLocalDC, hBitmap);

  BitBlt(hLocalDC, 0, 0, iScreenWidth, iScreenHeight, hScreenDC, 0, 0, SRCCOPY);

  int len = w * h << 2;
  Byte *data = (Byte*)malloc(len);

  for(int y = 0, i = 0; y != h; y++){
    for(int x = 0; x != w; x++, i += 4){
      int j = (x + (h - y - 1) * w) << 2;

      data[i] = img[j + 2];
      data[i + 1] = img[j + 1];
      data[i + 2] = img[j + 0];
      data[i + 3] = 255;
    }
  }

  DeleteObject(hBitmap);
  DeleteDC(hLocalDC);
  DeleteDC(hScreenDC);

  Local<Object> buff = node::Buffer::New(iso, (char*)data, len).ToLocalChecked();

  return buff;
}