'use strict';

var main = () => {
  var list = new List();

  io.iter(a => {
    list.push(a);
  });

  list.iter(a => {
    io.write(a);
  });
};

var I = a => a;

class Base{};

class Bit extends Base{
  constructor(func){
    super();
    this.func = func;
  }

  not(){ return this.if(B0, B1); }
  if(f){ return this.func(f)(I)(); }
  ife(f, g){ return this.func(f)(g)(); }
  nif(f){ return this.not().if(f); }
  nife(f, g){ return this.not().ife(f, g); }
};

var B0 = new Bit(() => I);
var B1 = new Bit(a => () => a);

var loop = (cond, func) => {
  cond().if(() => {
    func();
    loop(cond, func);
  });
};

class Object extends Bit{
  constructor(){
    super(B1.func);
  }
};

class IO extends Object{
  constructor(){
    super();
    this.checkMore();
  }

  checkMore(){
    this.hasMore = B0;
    _read(() => this.hasMore = B1);
  }

  read(){
    var bit = B0;
    _read(() => bit = B1);
    this.checkMore();
    return bit;
  }

  write(bit){
    bit.ife(_write1, _write0);
  }

  iter(func){
    loop(() => this.hasMore, () => {
      func(this.read());
    });
  }
};

var io = new IO();

class Node extends Object{
  constructor(v, p, n){
    super();
    this.v = v;
    this.p = p;
    this.n = n;
  }

  unshift(e){
    var p = this.p;
    p.if(() => p.n = e);
    this.p = e;
    e.p = p;
    e.n = this;
  }

  push(e){
    var n = this.n;
    n.if(() => n.p = e);
    this.n = e;
    e.p = this;
    e.n = n;
  }

  shift(){
    var pp = this.p.p;
    pp.if(() => pp.n = this);
    this.p = pp;
  }

  pop(){
    var nn = this.n.n;
    nn.if(() => nn.p = this);
    this.n = nn;
  }

  remove(){
    var p = this.p;
    var n = this.n;
    p.if(() => p.n = n);
    n.if(() => n.p = p);
  }
};

class List extends Object{
  constructor(){
    super();
    this.first = B0;
    this.last = B0;
  }

  unshift(v){
    var first = this.first;
    var e = new Node(v, B0, first);

    first.ife(
      () => first.unshift(e),
      () => this.last = e
    );

    this.first = e;
  }

  push(v){
    var last = this.last;
    var e = new Node(v, last, B0);

    last.ife(
      () => last.push(e),
      () => this.first = e
    );

    this.last = e;
  }

  shift(){
    var v = this.first.v;
    this.first = this.first.n;
    this.first.nif(() => this.last = B0);
    return v;
  }

  pop(){
    var v = this.last.v;
    this.last = this.last.p;
    this.last.nif(() => this.first = B0);
    return v;
  }

  iter(func){
    var e = this.first;
    loop(() => e, () => {
      func(e.v);
      e = e.n;
    });
    return this;
  }

  iterRev(func){
    var e = this.last;
    loop(() => e, () => {
      func(e.v);
      e = e.p;
    });
    return this;
  }

  map(func){
    var list = new List();
    this.iter(v => list.push(func(v)));
    return list;
  }

  slice(){
    return this.map(I);
  }

  reverse(){
    var list = new List();
    this.iterRev(v => list.push(v));
    this.first = list.first;
    this.last = list.last;
    return this;
  }
};

main();