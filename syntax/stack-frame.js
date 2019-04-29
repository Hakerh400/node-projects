'use strict';

class StackFrame{
  constructor(prev){
    this.prev = prev;
    this.val = null;
    this.i = 0;
    this.j = 0;
  }

  ret(val){
    const {prev} = this;
    if(prev !== null) prev.val = val;
    else this.val = val;
  }
};

class Parse extends StackFrame{
  constructor(prev, index, ref){
    super(prev);

    this.index = index;
    this.ref = ref;

    this.node = null;
  }
};

class ParseDef extends Parse{
  constructor(prev, index, ref){
    super(prev, index, ref);

    this.nodePrev = null;
  }
};

class ParsePat extends Parse{
  constructor(prev, index, ref){
    super(prev, index, ref);
  }
};

class ParseElem extends Parse{
  constructor(prev, index, ref){
    super(prev, index, ref);
  }
};

class Compile extends StackFrame{
  constructor(prev, elem){
    super(prev);

    this.elem = elem;
  }
};

class CompileDef extends Compile{
  constructor(prev, elem){
    super(prev, elem);
  }
};

class CompileArr extends Compile{
  constructor(prev, elem){
    super(prev, elem);
  }
};

StackFrame.Parse = Parse;
StackFrame.ParseDef = ParseDef;
StackFrame.ParsePat = ParsePat;
StackFrame.ParseElem = ParseElem;

StackFrame.Compile = Compile;
StackFrame.CompileDef = CompileDef;
StackFrame.CompileArr = CompileArr;

module.exports = StackFrame;