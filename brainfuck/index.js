'use strict';

module.exports = {
  compile,
};

function compile(src, input){
  return new Program(src, input);
}

class Program{
  constructor(src, input = ''){
    this.src = Buffer.from(src);
    this.srcIndex = 0;

    this.mem = Object.create(null);
    this.memIndex = 0;

    this.input = Buffer.from(input);
    this.inputIndex = 0;

    this.output = [];
    this.finished = this.src.length === 0 ? true : false;
  }

  execute(){
    while(this.tick());
    return this.getOutput();
  }

  tick(){
    switch(this.src[this.srcIndex]){
      case 0x3E:
        this.memIndex = -~this.memIndex;
        break;

      case 0x3C:
        this.memIndex = ~-this.memIndex;
        break;

      case 0x2B:
        this.mem[this.memIndex] = -~this.mem[this.memIndex] & 0xFF;
        break;

      case 0x2D:
        this.mem[this.memIndex] = ~-this.mem[this.memIndex] & 0xFF;
        break;

      case 0x2E:
        this.output.push(this.mem[this.memIndex] & 0xFF);
        break;

      case 0x2C:
        this.mem[this.memIndex] = this.input[this.inputIndex] & 0xFF;
        this.inputIndex = -~this.inputIndex;
        break;

      case 0x5B:
        if((this.mem[this.memIndex] & 0xFF) === 0){
          var nestedLevel = 1;

          do{
            this.srcIndex = -~this.srcIndex;
            var val = this.src[this.srcIndex] & 0xFF;

            if(val === 0x5B) nestedLevel++;
            else if(val === 0x5D) nestedLevel--;
          }while(nestedLevel !== 0);
        }
        break;

      case 0x5D:
        var nestedLevel = 1;

        do{
          this.srcIndex = ~-this.srcIndex;
          var val = this.src[this.srcIndex] & 0xFF;

          if(val === 0x5B) nestedLevel--;
          else if(val === 0x5D) nestedLevel++;
        }while(nestedLevel !== 0);

        this.srcIndex = ~-this.srcIndex;
        break;
    }

    this.srcIndex = -~this.srcIndex;
    if(this.srcIndex === this.src.length) this.finished = true;

    return !this.finished;
  }

  getOutput(){
    return Buffer.from(this.output);
  }
};