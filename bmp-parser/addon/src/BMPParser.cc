#include "BMPParser.h"

using namespace std;
using namespace BMPParser;

#define DEBUG 1

#define E(cond, msg) if(cond) return setErr(msg)
#define EU(cond, msg) if(cond) return setErrUnsupported(msg)
#define EX(cond, msg) if(cond) return setErrUnknown(msg)

#define I1() get<char>()
#define U1() get<byte>()
#define I2() get<int16_t>()
#define U2() get<uint16_t>()
#define I4() get<int32_t>()
#define U4() get<uint32_t>()

#define CALC_MASK(col) \
  col##Mask = U4(); \
  if(col##Mask == 0xffu) col##Mask = 0; \
  else if(col##Mask == 0xff00u) col##Mask = 8; \
  else if(col##Mask == 0xff0000u) col##Mask = 16; \
  else if(col##Mask == 0xff000000u) col##Mask = 24; \
  else EU(1, #col " mask");

void log(char a){ if(DEBUG) cout << a << endl; }
void log(int16_t a){ if(DEBUG) cout << (int32_t)a << endl; }
void log(uint16_t a){ if(DEBUG) cout << (uint32_t)a << endl; }
void log(int32_t a){ if(DEBUG) cout << a << endl; }
void log(uint32_t a){ if(DEBUG) cout << a << endl; }
void log(void *a){ if(DEBUG) cout << a << endl; }
void log(string a){ if(DEBUG) cout << a << endl; }

Parser::Parser(){
  status = Status::EMPTY;

  w = 0;
  h = 0;

  data = nullptr;
  ptr = nullptr;
  imgd = nullptr;

  op = ""s;
  err = ""s;
}

Parser::~Parser(){
  data = nullptr;
  ptr = nullptr;
}

void Parser::parse(byte *data, int len){
  assert(status == Status::EMPTY);

  this->data = ptr = data;
  this->len = len;

  // Start parsing file header
  setOp("file header");

  // File header signature
  string fhSig = getStr(2);
  string temp = "file header signature"s;
  EU(fhSig == "BA"s, temp + " \"BA\"");
  EU(fhSig == "CI"s, temp + " \"CI\"");
  EU(fhSig == "CP"s, temp + " \"CP\"");
  EU(fhSig == "IC"s, temp + " \"IC\"");
  EU(fhSig == "PT"s, temp + " \"PT\"");
  EX(fhSig != "BM"s, temp); // BM

  // Length of the file should be equal to `len`
  E(U4() != len, "inconsistent file size");

  // Skip unused values
  skip(4);

  // Offset where the pixel array (bitmap data) can be found
  auto imgdOffset = U4();

  // Start parsing DIB header
  setOp("DIB header");

  /**
   * Type of the DIB (device-independent bitmap) header
   * is determined by its size. Most BMP files use BITMAPINFOHEADER.
   */
  auto dibSize = U4();
  temp = "DIB header"s;
  EU(dibSize == 12, temp + " \"BITMAPCOREHEADER\""s);
  EU(dibSize == 64, temp + " \"OS22XBITMAPHEADER\""s);
  EU(dibSize == 16, temp + " \"OS22XBITMAPHEADER\""s);
  EU(dibSize == 52, temp + " \"BITMAPV2INFOHEADER\""s);
  EU(dibSize == 56, temp + " \"BITMAPV3INFOHEADER\""s);
  EU(dibSize == 124, temp + " \"BITMAPV5HEADER\""s);

  // BITMAPINFOHEADER and BITMAPV4HEADER
  auto isDibValid = dibSize == 40 || dibSize == 108;
  EX(!isDibValid, temp);

  // Image width (specification allows non-positive values)
  w = I4();
  EU(w <= 0, "non-positive image width");

  // Image height (specification allows non-positive values)
  h = I4();
  EU(h <= 0, "non-positive image height");

  // Number of color planes (must be 1)
  E(U2() != 1, "number of color planes must be 1");

  // Bits per pixel (color depth)
  auto bpp = U2();
  auto isBppValid = bpp == 24 || bpp == 32;
  EU(!isBppValid, "color depth");
  
  // Compression type
  auto compr = U4();
  temp = "compression type"s;
  EU(compr == 1, temp + " \"BI_RLE8\""s);
  EU(compr == 2, temp + " \"BI_RLE4\""s);
  EU(compr == 4, temp + " \"BI_JPEG\""s);
  EU(compr == 5, temp + " \"BI_PNG\""s);
  EU(compr == 6, temp + " \"BI_ALPHABITFIELDS\""s);
  EU(compr == 11, temp + " \"BI_CMYK\""s);
  EU(compr == 12, temp + " \"BI_CMYKRLE8\""s);
  EU(compr == 13, temp + " \"BI_CMYKRLE4\""s);

  // BI_RGB and BI_BITFIELDS
  auto isComprValid = compr == 0 || compr == 3;
  EX(!isComprValid, temp);
  
  // Also ensure that BI_BITFIELDS appears only with BITMAPV4HEADER
  E(compr == 3 && dibSize != 108, "compression BI_BITFIELDS can be used only with BITMAPV4HEADER");

  // Calculate image data size and padding
  uint32_t expectedImgdSize = (((w * bpp + 31) >> 5) << 2) * h;
  uint32_t rowPadding = (-w * bpp & 31) >> 3;

  // Size of the image data
  auto imgdSize = U4();
  if(!imgdSize)
    // Value 0 is allowed for BI_RGB compression type
    imgdSize = expectedImgdSize;
  else
    E(imgdSize != expectedImgdSize, "inconsistent image data size");

  // Horizontal and vertical resolution (ignored)
  skip(8);

  // Number of colors in the palette or 0 if no palette is present
  auto palColNum = U4();
  EU(palColNum, "non-empty color palette");

  // Number of important colors used or 0 if all colors are important
  auto impCols = U4();
  EU(impCols, "non-zero important colors");

  // Prepare masks in case they are needed
  uint32_t redMask = 0, greenMask = 0, blueMask = 0, alphaMask = 0;

  // BITMAPV4HEADER has additional properties
  if(dibSize == 108){
    // If BI_BITFIELDS are used, calculate masks, otherwise ignore them
    if(compr == 3){
      // Convert each mask to bit offset for faster shifting
      CALC_MASK(red);
      CALC_MASK(green);
      CALC_MASK(blue);
      CALC_MASK(alpha);
    }else{
      skip(16);
    }

    // Encure that the color space is LCS_WINDOWS_COLOR_SPACE
    string colSpace = getStr(4, 1);
    EU(colSpace != "Win "s, "color space \""s + colSpace + "\"");

    // The rest 48 bytes are ignored for LCS_WINDOWS_COLOR_SPACE
    skip(48);
  }

  // Start parsing image data
  setOp("image data");

  // Allocate RGBA image data array
  int buffLen = w * h << 2;
  imgd = new byte[buffLen];

  // Prepare color valus
  byte red = 0, green = 0, blue = 0, alpha = 0;

  // Bitmap data starts at the lower left corner
  for(int y = h - 1; y != -1; y--){
    for(int x = 0; x != w; x++){
      // Index in the RGBa image data
      int i = (x + y * w) << 2;

      switch(compr){
        case 0: // BI_RGB
          blue = U1();
          green = U1();
          red = U1();
          alpha = 255;
          break;

        case 3: // BI_BITFIELDS
          auto col = U4();
          red = col >> redMask;
          green = col >> greenMask;
          blue = col >> blueMask;
          alpha = col >> alphaMask;
          break;
      }

      // BGRA pixel format
      imgd[i] = red;
      imgd[i + 1] = green;
      imgd[i + 2] = blue;
      imgd[i + 3] = alpha;
    }

    // Skip unused bytes in the current row
    skip(rowPadding);
  }

  E(ptr - data != len, "extra data found at the end of file");
  status = Status::OK;
};

int32_t Parser::getWidth() const{ return w; }
int32_t Parser::getHeight() const{ return h; }
byte *Parser::getImgd() const{ return imgd; }

string Parser::getErrMsg() const{
  return "Error while processing "s + getOp() + " - "s + err;
}

template <typename T> T Parser::get(){
  if(ptr + sizeof(T) - data > len){
    setErr("unexpected end of file");
    return T();
  }

  T val = *(T*)ptr;
  ptr += sizeof(T);

  return val;
}

string Parser::getStr(int len, bool reverse){
  string val = ""s;
  while(len--) val += (char)*ptr++;
  if(reverse) std::reverse(val.begin(), val.end());
  return val;
}

void Parser::skip(int len){
  ptr += len;
}

void Parser::setOp(string op){
  if(status != Status::EMPTY) return;
  this->op = op;
}

string Parser::getOp() const{
  return op;
}

void Parser::setErrUnsupported(string msg){
  setErr("unsupported "s + msg);
}

void Parser::setErrUnknown(string msg){
  setErr("unknown "s + msg);
}

void Parser::setErr(string msg){
  if(status != Status::EMPTY) return;

  err = msg;
  status = Status::ERROR;

  cout << getErrMsg() << endl;
  exit(1);
}

string Parser::getErr() const{
  return err;
}