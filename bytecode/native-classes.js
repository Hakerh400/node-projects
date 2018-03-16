'use strict';

class Object{
  constructor(){}
};

class Number extends Object{
  constructor(val){
    super();
    this.val = val;
  }

  toString(){
    return new String(`${this.val}`);
  }

  add(val){ this.val += val; return this.val; }
  sub(val){ this.val -= val; return this.val; }
  mul(val){ this.val *= val; return this.val; }
  div(val){ this.val /= val; return this.val; }
};

class Integer extends Number{
  constructor(val){
    super(val);
    this.val |= 0;
  }

  add(val){ super.add(val); return this.val |= 0; }
  sub(val){ super.sub(val); return this.val |= 0; }
  mul(val){ super.mul(val); return this.val |= 0; }
  div(val){ super.div(val); return this.val |= 0; }
};

class Double extends Number{
  constructor(val){
    super(val);
  }
};

class String extends Object{
  constructor(val){
    this.val = val;
  }
};

module.exports = [
  Object,
];