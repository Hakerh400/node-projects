'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../../../omikron');
const Context = require('../../context');

class JSContext extends Context{
  constructor(){
    super();

    this.strict = 0;
    this.async = 0;
    this.gen = 0;
  }

  ser(ser=new O.Serializer()){
    ser.write(this.strict);
    ser.write(this.async);
    ser.write(this.gen);
  }

  static deser(ser){
    const ctx = new JSContext();

    ctx.strict = ser.read();
    ctx.async = ser.read();
    ctx.gen = ser.read();

    return ctx;
  }
}

module.exports = JSContext;