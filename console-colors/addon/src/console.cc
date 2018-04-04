#include "console.h"

#include <iostream>
using namespace std;

Console::Console(){
  hConsoleOutput = GetStdHandle(STD_OUTPUT_HANDLE);
  colPrev = getCol();
}

Console::~Console(){
  setCol(colPrev);
}

int Console::getBgCol(){
  return demuxCol(getCol(), false);
}

void Console::setBgCol(int col){
  setCol(muxCol(col, false));
}

int Console::getTextCol(){
  return demuxCol(getCol(), true);
}

void Console::setTextCol(int col){
  setCol(muxCol(col, true));
}

int Console::getCol(){
  CONSOLE_SCREEN_BUFFER_INFO csbInfo;
  GetConsoleScreenBufferInfo(hConsoleOutput, &csbInfo);
  return csbInfo.wAttributes;
}

int Console::getCol(bool text){
  int col = getCol();

  if(text) col &= BACKGROUND_RED | BACKGROUND_GREEN | BACKGROUND_BLUE | BACKGROUND_INTENSITY;
  else col &= FOREGROUND_RED | FOREGROUND_GREEN | FOREGROUND_BLUE | FOREGROUND_INTENSITY;

  return col;
}

void Console::setCol(int col){
  SetConsoleTextAttribute(hConsoleOutput, col);
}

int Console::muxCol(int c, bool text){
  int col = getCol(text);

  if(c & 1) col |= text ? FOREGROUND_RED : BACKGROUND_RED;
  if(c & 2) col |= text ? FOREGROUND_GREEN : BACKGROUND_GREEN;
  if(c & 4) col |= text ? FOREGROUND_BLUE : BACKGROUND_BLUE;
  if(c & 8) col |= text ? FOREGROUND_INTENSITY : BACKGROUND_INTENSITY;

  return col;
}

int Console::demuxCol(int c, bool text){
  int col = 0;

  if(c & (text ? FOREGROUND_RED : BACKGROUND_RED)) col |= 1;
  if(c & (text ? FOREGROUND_GREEN : BACKGROUND_GREEN)) col |= 2;
  if(c & (text ? FOREGROUND_BLUE : BACKGROUND_BLUE)) col |= 4;
  if(c & (text ? FOREGROUND_INTENSITY : BACKGROUND_INTENSITY)) col |= 8;

  return col;
}