'use strict';

var regs = [
  'cr',
  'sr',
  'dr',
  'ier',
  'cnt',
  'adrs',
  'adrd',
];

class Peripheral{
  constructor(){
    this.machine = null;

    this.regs = new Uint32Array(16);
    this.active = false;
  }

  start(){
    if(this.machine === null)
      throw new TypeError(`Peripheral device "${this.constructor.name}" doesn't have attached machine`);

    this.resetRegs();
    this.active = true;

    this.run();
  }

  stop(){
    this.active = false;
  }

  resetRegs(){
    this.regs.fill(0);
  }

  getReg(addr){
    if((addr &= 15) === 2) this.clearReady();
    return this.regs[addr];
  }

  setReg(val, addr){
    this.regs[addr &= 15] = val;
    if(addr === 0 || addr === 2) this.clearReady();
  }

  isReady(){
    return (this.regs[0] & 1) && !(this.regs[1] & 1);
  }

  isInput(){
    return this.regs[0] & 2;
  }

  isEnabled(){
    return this.regs[0] & 4;
  }

  setReady(){
    this.regs[1] |= 1;

    if(this.isEnabled())
      this.machine.intReq(this.regs[3]);
  }

  clearReady(){
    this.regs[1] &= ~1;
  }

  getData(){
    return this.regs[2];
  }

  setData(val){
    this.regs[2] = val;
    this.setReady();
  }

  getCnt(){
    return this.regs[4];
  }

  setCnt(val){
    this.regs[4] = val;
  }

  getSrc(){
    return this.regs[5];
  }

  getDest(){
    return this.regs[6];
  }
};

module.exports = Peripheral;