#include <windows.h>
#include <iostream>

#include "virtual-input.h"

using namespace std;
namespace vi = VirtualInput;

int sleep = 5;

void send(INPUT &i);

void vi::move(int x, int y){
  SetCursorPos(x, y);
}

void vi::mdown(){
  INPUT i = {0};

  i.type = INPUT_MOUSE;
  i.mi.dwFlags = MOUSEEVENTF_LEFTDOWN;

  send(i);
}

void vi::mdown(int x, int y){
  vi::move(x, y);
  vi::mdown();
}

void vi::mup(){
  INPUT i = {0};

  i.type = INPUT_MOUSE;
  i.mi.dwFlags = MOUSEEVENTF_LEFTUP;

  send(i);
}

void vi::mup(int x, int y){
  vi::move(x, y);
  vi::mup();
}

void vi::click(){
  vi::mdown();
  vi::mup();
}

void vi::click(int x, int y){
  vi::move(x, y);
  vi::click();
}

int vi::cx(){
  POINT p;
  GetCursorPos(&p);
  return p.x;
}

void vi::kdown(int code){
  INPUT i = {0};

  i.type = INPUT_KEYBOARD;
  i.ki.wVk = code;

  send(i);
}

void vi::kup(int code){
  INPUT i = {0};

  i.type = INPUT_KEYBOARD;
  i.ki.wVk = code;
  i.ki.dwFlags = KEYEVENTF_KEYUP;
  
  send(i);
}

void vi::key(int code){
  vi::kdown(code);
  vi::kup(code);
}

int vi::cy(){
  POINT p;
  GetCursorPos(&p);
  return p.y;
}

void send(INPUT &i){
  SendInput(1, &i, sizeof(INPUT));
  Sleep(sleep);
}