'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const SG = require('../serializable-graph');
const Thread = require('./thread');

class Interpreter extends SG.Node{
  static ptrsNum = this.keys(['threads']);

  constructor(g, script=null){
    super(g);
    if(g.dsr) return;

    this.threads = new SG.Array(g);
    this.threadIndex = -1;

    if(script !== null){
      const str = new SG.String(g, script);
      const parser = new this.constructor.Parser(g, str);
      this.createThread(parser);
    }
  }

  ser(s){ s.writeInt(this.threadIndex); }
  deser(s){ this.threadIndex = s.readInt(); }

  get len(){ return this.threads.length; }
  get active(){ return this.len !== 0; }
  get done(){ return this.len === 0; }

  tick(){
    this.threads[this.threadIndex].tick(this);
    if(this.active) this.threadIndex = (this.threadIndex + 1) % this.len;
  }

  createThread(sf){
    this.addThread(new Thread(this.g, sf));
  }

  addThread(th){
    this.threads.push(th);
    th.index = this.len - 1;
    if(this.threadIndex === -1) this.threadIndex = 0;
  }

  removeThread(th){
    const {threads} = this;
    const {index} = th;
    const last = threads.pop();

    if(index === -1) throw new TypeError('Cannot remove thread with index -1');
    if(index <= this.threadIndex) this.threadIndex--;

    if(last !== th){
      last.index = index;
      threads[index] = last;
    }
  }
};

module.exports = Interpreter;