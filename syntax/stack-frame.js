'use strict';

class StackFrame{
  constructor(prev, index, ref){
    this.prev = prev;
    this.index = index;
    this.ref = ref;

    this.node = null;
    this.val = null;
    this.i = 0;
  }

  ret(val){
    const {prev} = this;
    if(prev !== null) prev.val = val;
    else this.val = val;
  }
};

class StackFrameDef extends StackFrame{
  constructor(prev, index, ref){
    super(prev, index, ref);

    this.nodePrev = null;
  }
};

class StackFramePat extends StackFrame{
  constructor(prev, index, ref){
    super(prev, index, ref);
  }
};

class StackFrameElem extends StackFrame{
  constructor(prev, index, ref){
    super(prev, index, ref);
  }
};

StackFrame.StackFrameDef = StackFrameDef;
StackFrame.StackFramePat = StackFramePat;
StackFrame.StackFrameElem = StackFrameElem;

module.exports = StackFrame;