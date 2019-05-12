'use strict';

var main = () => {
  var list = new List();

  loop(() => io.hasMore(), () => {
    var byte = new Byte(() => io.read());
    list.push(byte);
  });

  list.iter(byte => {
    byte.iter(bit => io.write(bit));
  });
}

var I = a => a;

class Base{};

class Bit extends Base{
  constructor(){ super(); }

  choose(f, g){}

  if(f){ return this.ife(f, I); }
  ife(f, g){ return this.choose(f, g)(); }
  nif(f){ return this.not().if(f); }
  nife(f, g){ return this.ife(g, f); }
  not(){ return this.choose(B0, B1); }
}

class Bit0 extends Bit{
  constructor(){ super(); }
  choose(f, g){ return g; }
}

class Bit1 extends Bit{
  constructor(){ super(); }
  choose(f, g){ return f; }
}

var B0 = new Bit0();
var B1 = new Bit1();

var loop = (cond, func) => {
  cond().if(() => {
    func();
    loop(cond, func);
  });
}

class Primitive extends Bit{
  constructor(){ super(); }

  toBit(){}
  copy(){}

  ife(f, g){ return this.toBit().ife(f, g); }
}

class Object extends Bit1{
  constructor(){ super(); }
}

class IO extends Object{
  constructor(){
    super();

    this.more = B0;
    this.checkMore();
  }

  hasMore(){
    return this.more;
  }

  checkMore(){
    this.more = B0;
    _read(() => this.more = B1);
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
    loop(() => this.hasMore(), () => {
      func(this.read());
    });
  }
}

var io = new IO();

class Reference extends Object{
  constructor(v){
    super();
    this.v = v;
  }
}

class NodeBase extends Object{
  constructor(p, n){
    super();
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
}

class Node extends NodeBase{
  constructor(v, p, n){
    super(p, n);
    this.v = v;
  }
}

class List extends Object{
  constructor(){
    super();
    this.first = B0;
    this.last = B0;
  }

  hasMore(){
    return this.first;
  }

  unshift(v){
    var first = this.first;
    var e = new Node(v, B0, first);

    first.ife(
      () => first.unshift(e),
      () => this.last = e
    );

    this.first = e;
    return this;
  }

  push(v){
    var last = this.last;
    var e = new Node(v, last, B0);

    last.ife(
      () => last.push(e),
      () => this.first = e
    );

    this.last = e;
    return this;
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
}

class TinyUint extends Primitive{
  constructor(){
    super();
    this.v = B0;
  }

  toBit(){
    return this.v;
  }

  copy(){
    var uint = new TinyUint();
    uint.v = this.v;
    return uint;
  }

  inc(){
    this.v = new Reference(this.v);
    return this;
  }

  dec(){
    this.v = this.v.v;
    return this;
  }

  iter(func){
    var v = this.v;

    loop(() => v, () => {
      func();
      v = v.v;
    });

    return this;
  }
}

class SmallUint extends Primitive{
  constructor(){
    super();
    this.bits = new List();
  }

  toBit(){
    var isZero = B1;
    this.iter(bit => bit.if(() => isZero = B0));
    return isZero;
  }

  copy(){
    var uint = new SmallUint();
    uint.bits = this.bits.slice();
    return uint;
  }

  hasMore(){
    return this.bits.hasMore();
  }

  push(bit){
    this.bits.push(bit);
    return this;
  }

  shift(){
    return this.bits.shift();
  }

  iter(func){
    return this.bits.iter(func);
  }
}

class CompleteTree extends Object{
  constructor(depth, func){
    super();

    var val = depth;
    var left = B0;
    var right = B0;

    depth.ife(() => {
      depth = depth.copy().dec();
      left = new CompleteTree(depth, func);
      right = new CompleteTree(depth, func);
    }, () => {
      val = func();
    });

    this.root = new Node(val, left, right);
  }

  isLeaf(){
    return this.root.p.not();
  }

  get(i, node){
    var root = this.root;

    return i.hasMore().ife(() => {
      i = i.copy();

      return i.shift().ife(
        () => root.n.get(i, node),
        () => root.p.get(i, node)
      );
    }, () => {
      return node.choose(
        root,
        root.v
      );
    });
  }

  set(i, v, node){
    var root = this.root;

    i.hasMore().ife(() => {
      i = i.copy();

      i.shift().ife(
        () => root.n.set(i, v, node),
        () => root.p.set(i, v, node)
      );
    }, () => {
      node.ife(
        () => this.root = v,
        () => root.v = v
      );
    });

    return this;
  }

  iter(func){
    var root = this.root;

    root.p.ife(() => {
      root.p.iter(func);
      root.n.iter(func);
    }, () => {
      func(root.v);
    });

    return this;
  }
}

class Integer extends CompleteTree{
  constructor(depth, func){
    super(depth, func);
  }
}

class SignedInteger extends Integer{
  constructor(depth, func){
    super(depth, func);
  }
}

class UnsignedInteger extends Integer{
  constructor(depth, func){
    super(depth, func);
  }
}

var tinyUint3 = new TinyUint().inc().inc().inc();

class Byte extends UnsignedInteger{
  constructor(func){
    super(tinyUint3, func);
  }
}

main();