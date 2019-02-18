'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const Element = require('./element');
const StackFrame = require('./stack-frame');

class Stack{
  constructor(syntax){
    this.syntax = syntax;
    this.ctxCtor = syntax.ctxCtor;

    this.frames = [];
    this.elems = new Map();
  }

  size(){ return this.frames.length; }
  len(){ return this.size(); }
  isEmpty(){ return this.size() === 0; }

  push(frame){
    if(frame instanceof Element)
      frame = new StackFrame(frame);

    this.elems.set(frame.elem, this.size());
    this.frames.push(frame);
  }

  pop(){
    const frame = this.frames.pop();
    this.elems.delete(frame.elem);
    return frame;
  }

  top(){
    return O.last(this.frames);
  }
};

module.exports = Stack;