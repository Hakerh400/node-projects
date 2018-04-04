#include <windows.h>

class Console{
  HANDLE hConsoleOutput;

public:
  Console();
  ~Console();

  int getBgCol();
  void setBgCol(int col);
  int getTextCol();
  void setTextCol(int col);

private:
  int colPrev;

  int getCol();
  int getCol(bool text);
  void setCol(int col);

  int muxCol(int c, bool text);
  int demuxCol(int c, bool text);
};