'use strict';

var fs = require('fs');

const SECTOR_SIZE = 512;

class Handle{
  constructor(file){
    this.fd = fs.openSync(file, 'r');
  }

  read(sector, size = 1){
    size *= SECTOR_SIZE;
    var buff = Buffer.alloc(size);
    fs.readSync(this.fd, buff, 0, size, sector * SECTOR_SIZE);
    return buff;
  }

  close(){
    fs.closeSync(this.fd);
  }
};

module.exports = {
  Handle,
  open,
};

function open(diskLetter){
  diskLetter = diskLetter[0].toUpperCase();
  return new Handle(`\\\\.\\${diskLetter}:`);
}