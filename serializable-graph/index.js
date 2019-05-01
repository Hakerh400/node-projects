'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const format = require('../format');

const PTR_SIZE = 8;

class SerializableGraph extends O.Serializable{
  #ctors; #ctorsNum; #ctorsMap;
  #refs; #refsNum; #refsMap;
  #nodes;
  #persts;

  dsr = 0;
  #size = 0;

  constructor(ctors, refs=[], maxSize=null){
    super();

    this.#ctors = ctors;
    this.#ctorsNum = ctors.length;
    this.#ctorsMap = new global.Map();
    ctors.forEach((ctor, index) => {
      this.#ctorsMap.set(ctor, index);
    });

    this.#refs = refs;
    this.#refsNum = refs.length;
    this.#refsMap = new global.Map();
    refs.forEach((ref, index) => {
      this.#refsMap.set(ref, index);
    });

    this.maxSize = maxSize;
    this.#nodes = new global.Set();
    this.#persts = new global.Set();
  }

  ser(ser=new O.Serializer()){
    const lastCtorIndex = this.#ctorsNum - 1;
    const lastRefIndex = this.#refsNum - 1;

    const all = new global.Set(this.#nodes);
    const done = new global.Map();
    const queue = [];

    const lastNodeIndex = all.size - 1;
    ser.writeUint(all.size);

    while(all.size !== 0){
      let first = 1;

      queue.push(O.first(all));

      while(queue.length !== 0){
        const node = queue.shift();

        if(node === null){
          ser.write(0);
          continue;
        }else if(!first){
          ser.write(1);
        }

        if(!(node instanceof Node)){
          if(!this.#refsMap.has(node))
            throw new TypeError(`[SER] ${getName(node, 1)} is not a valid graph node or external reference`);
          ser.write(1).write(this.#refsMap.get(node), lastRefIndex);
          continue;
        }
        ser.write(0);

        const seen = done.has(node);
        const index = seen ? done.get(node) : done.size;

        if(first) first = 0;
        else ser.write(index, Math.min(done.size, lastNodeIndex));
        if(seen) continue;

        all.delete(node);
        done.set(node, index);

        ser.write(this.#ctorsMap.get(node.constructor), lastCtorIndex);
        ser.write(node.persistent);
        node.ser(ser);

        const {ptrsNum} = node;
        ser.writeUint(ptrsNum);
        for(let i = 0; i !== ptrsNum; i++)
          queue.push(node[i]);
      }
    }

    return ser;
  }

  deser(ser){
    this.dsr = 1;

    const lastCtorIndex = this.#ctorsNum - 1;
    const lastRefIndex = this.#refsNum - 1;

    const nodes = this.#nodes = new global.Set();
    const persts = this.#persts = new global.Set();
    this.size = 0;

    const nodesNum = ser.readUint();
    const lastNodeIndex = nodesNum - 1;

    const done = [];
    const queue = [];

    while(nodes.size !== nodesNum){
      let first = 1;

      while(queue.length !== 0 || first){
        const isNull = first ? 0 : !ser.read();

        if(!isNull && ser.read()){
          const elem = queue[0];
          elem[0][elem[1]++] = this.#refs[ser.read(lastRefIndex)];
          if(elem[1] === elem[0].ptrsNum) queue.shift();
          continue;
        }

        const index = first ? nodes.size : isNull ? -1 : ser.read(Math.min(nodes.size, lastNodeIndex));
        const seen = isNull || index !== nodes.size;
        const node = seen ? isNull ? null : done[index] : new this.#ctors[ser.read(lastCtorIndex)](this);

        if(first){
          first = 0;
        }else{
          const elem = queue[0];
          elem[0][elem[1]++] = node;
          if(elem[1] === elem[0].ptrsNum) queue.shift();
        }

        if(seen) continue;

        done.push(node);
        if(node.persistent = ser.read()) persts.add(node);
        node.deser(ser);

        const ptrsNum = ser.readUint();
        node.ptrsNum = ptrsNum;
        if(ptrsNum !== 0)
          queue.push([node, 0]);
      }
    }

    this.dsr = 0;
    return this;
  }

  get refs(){ return this.#refs; }
  get nodes(){ return this.#nodes; }
  get persts(){ return this.#persts; }

  get size(){ return this.#size; }

  set size(size){
    const {maxSize} = this;

    if(maxSize !== null && size > maxSize)
      throw new RangeError('Maximum graph size exceeded');

    this.#size = size;
  }

  get main(){ return O.first(this.#persts); }

  addNode(node){
    const {maxSize} = this;
    const {size} = node;

    this.#nodes.add(node);
    this.size += size;

    return this;
  }

  addPersistentNode(node){
    this.addNode(node);
    return this.persist(node);
  }

  persist(node){
    node.persistent = 1;
    return this.#persts.add(node);
  }

  unpersist(node){
    node.persistent = 0;
    return this.#persts.delete(node);
  }

  gc(){
    const sizePrev = this.#size;

    const nodes = new global.Set();
    const queue = global.Array.from(this.#persts);
    let size = 0;

    while(queue.length !== 0){
      const node = queue.shift();

      if(typeof node !== 'object')
        throw new TypeError(`[GC] ${getName(node, 1)} is not an object`);

      if(node instanceof Node){
        if(!this.#nodes.has(node))
          throw new TypeError(`[GC] ${getName(node, 1)} is not in the graph`);
      }else{
        if(!this.#refsMap.has(node))
          throw new TypeError(`[GC] ${getName(node, 1)} is not a valid graph node or external reference`);
        continue;
      }

      if(nodes.has(node)) continue;

      nodes.add(node);
      size += node.size;

      const {ptrsNum} = node;
      for(let i = 0; i !== ptrsNum; i++){
        const next = node[i];
        if(next === null || nodes.has(next)) continue;
        queue.push(next);
      }
    }

    for(const node of this.#persts){
      if(nodes.has(node)) continue;
      nodes.add(node);
      size += node.size;
    }

    this.#nodes = nodes;
    this.#size = size;

    let ss = 0;
    for(const n of this.#nodes)
      ss += n.size;

    if(size > sizePrev){
      const difStr = `${format.num(sizePrev)} ---> ${format.num(size)}`;
      throw new TypeError(`[GC] Graph size after GC is larger than before (${difStr})`);
    }

    return this;
  }

  refresh(){
    this.gc();
    this.reser();
    return this;
  }

  ca(len, func){
    const arr = new Array(this);

    for(let i = 0; i !== len; i++)
      arr.push(func(i));

    return arr;
  }

  log(nodes=this.#nodes){
    log();
    log(nodes.size);
    log(global.Array.from(nodes).map(node => {
      return `${`${getName(node, 0)}.${node.id}`.padEnd(20)} ${node.size}`;
    }).join('\n'));
    return this;
  }
};

class Node extends O.Serializable{
  // TODO: delete this
  static id = 0;
  id = Node.id++;

  static ptrsNum = 0;

  persistent = 0;
  #ptrsNum = this.constructor.ptrsNum;
  #size = (this.#ptrsNum + 1) * PTR_SIZE;
  #graph;

  constructor(graph){
    super();

    this.#graph = graph;
    graph.addNode(this);
  }

  ser(ser=new O.Serializer()){ return ser; }
  deser(ser){ return this; }

  get graph(){ return this.#graph; }
  get ptrsNum(){ return this.#ptrsNum; }
  set ptrsNum(num){ this.size -= (this.#ptrsNum - (this.#ptrsNum = num)) * PTR_SIZE | 0; }

  get size(){ return this.#size; }
  set size(size){
    if(!this.graph.nodes.has(this)) throw new Error(`The graph does not contain "${getName(this, 0)}.${this.id}"`);
    this.graph.size -= this.#size - (this.#size = size) | 0;
  }

  persist(){ this.graph.persist(this); return this; }
  unpersist(){ this.graph.unpersist(this); return this; }
};

class String extends Node{
  #str = '';

  constructor(graph, str=''){
    super(graph);
    if(graph.dsr) return;

    this.str = str;
  }

  ser(ser=new O.Serializer()){ return ser.writeStr(this.#str); }
  deser(ser){ this.str = ser.readStr(); return this; }

  get str(){ return this.#str; }
  set str(str){ this.size -= this.#str.length - (this.#str = str).length | 0; }

  get length(){ return this.#str.length; }

  toString(){ return this.#str; }
};

class Array extends Node{
  constructor(graph, arr=null){
    super(graph);
    if(graph.dsr) return;

    if(arr !== null)
      for(const val of arr)
        this.push(val);
  }

  get length(){ return this.ptrsNum; }

  set length(len){
    const prev = this.ptrsNum;
    const dif = Math.abs(len - prev);

    if(len > prev){
      const {graph} = this;
      for(let i = 0; i !== dif; i++)
        this.push(Undefined.get(graph));
    }else{
      for(let i = 0; i !== dif; i++)
        this.pop();
    }
  }

  unshift(val){
    if(typeof val !== 'object')
      throw new TypeError(`[UNSHIFT] ${getName(val, 1)} is not an object`);

    const len = this.ptrsNum;
    for(let i = 0; i !== len; i++)
      this[i + 1] = this[i];
    this[0] = val;
    return ++this.ptrsNum;
  }

  push(val){
    if(typeof val !== 'object')
      throw new TypeError(`[PUSH] ${getName(val, 1)} is not an object`);

    this[this.ptrsNum] = val;
    return ++this.ptrsNum;
  }

  shift(){
    const len = this.ptrsNum - 1;
    const val = this[0];
    for(let i = 0; i !== len; i++)
      this[i] = this[i + 1];
    delete this[len];
    this.ptrsNum--;
    return val;
  }

  pop(){
    const len = this.ptrsNum;
    const val = this[len];
    delete this[len];
    this.ptrsNum--;
    return val;
  }

  reverse(){
    const len = this.ptrsNum;
    for(let i = 0, j = len - 1; i < j; i++, j--){
      const temp = this[i];
      this[i] = this[j];
      this[j] = temp;
    }
    return this;
  }

  forEach(func){
    const len = this.ptrsNum;
    for(let i = 0; i !== len; i++)
      func(this[i], i, this);
  }

  map(func){
    const len = this.ptrsNum;
    const arr = new Array(this.graph);
    for(let i = 0; i !== len; i++)
      arr[i] = func(this[i], i, this);
    return arr;
  }

  reduce(func, val){
    const len = this.ptrsNum;
    for(let i = 0; i !== len; i++)
      val = func(val, this[i], i, this);
    return val;
  }

  some(func){
    const len = this.ptrsNum;
    for(let i = 0; i !== len; i++)
      if(func(this[i], i, this)) return true;
    return false;
  }

  every(func){
    const len = this.ptrsNum;
    for(let i = 0; i !== len; i++)
      if(!func(this[i], i, this)) return false;
    return true;
  }

  findIndex(func){
    const len = this.ptrsNum;
    for(let i = 0; i !== len; i++)
      if(func(this[i], i, this)) return i;
    return -1;
  }

  find(func){
    const len = this.ptrsNum;
    for(let i = 0; i !== len; i++)
      if(func(this[i], i, this)) return this[i];
  }

  indexOf(val){
    const len = this.ptrsNum;
    for(let i = 0; i !== len; i++)
      if(this[i] === val) return i;
    return -1;
  }

  lastIndexOf(val){
    const len = this.ptrsNum;
    for(let i = len - 1; i !== -1; i--)
      if(this[i] === val) return i;
    return -1;
  }

  includes(val){
    const len = this.ptrsNum;
    for(let i = len - 1; i !== -1; i--)
      if(this[i] === val) return true;
    return false;
  }

  *[Symbol.iterator](){
    const len = this.ptrsNum;
    for(let i = 0; i !== len; i++)
      yield this[i];
  }
};

class Set extends Node{
  static ptrsNum = 1;

  constructor(graph){
    super(graph);
    if(graph.dsr) return;

    this.arr = new Array(graph);
  }

  get arr(){ return this[0]; } set arr(a){ this[0] = a; }

  has(val){
    return this.arr.includes(val);
  }

  add(val){
    for(const elem of this.arr)
      if(elem === val) return this;
    this.arr.push(val);
    return this;
  }

  delete(val){
    const {arr} = this;
    const len = arr.length;

    for(let i = 0; i !== len; i++){
      const elem = arr[i];
      if(elem !== val) continue;

      if(len !== 1) arr[i] = arr[len - 1];
      arr.length = len - 1;

      return true;
    }

    return false;
  }

  [Symbol.iterator](){ return this.arr[Symbol.iterator](); }
};

class Map extends Node{
  static ptrsNum = 1;

  constructor(graph){
    super(graph);
    if(graph.dsr) return;

    this.arr = new Array(graph);
  }

  get arr(){ return this[0]; } set arr(a){ this[0] = a; }

  has(key){
    for(const elem of this.arr)
      if(elem[0] === key) return true;
    return false;
  }

  get(key, val){
    for(const elem of this.arr)
      if(elem[0] === key) return elem[1];
  }

  set(key, val){
    for(const elem of this.arr){
      if(elem[0] === key){
        elem[1] = val;
        return this;
      }
    }
    this.arr.push(new Array(this.graph, [key, val]));
    return this;
  }

  delete(key){
    const {arr} = this;
    const len = arr.length;

    for(let i = 0; i !== len; i++){
      const elem = arr[i];
      if(elem[0] !== key) continue;

      if(len !== 1) arr[i] = arr[len - 1];
      arr.length = len - 1;

      return true;
    }

    return false;
  }

  [Symbol.iterator](){ return this.arr[Symbol.iterator](); }
};

Object.assign(SerializableGraph, {
  Node,
  String,
  Array,
  Set,
  Map,
});

module.exports = SerializableGraph;

function getName(val, sf=0){
  let str;

  if(val === null){
    str = 'null';
  }else if(typeof val === 'object'){
    const ctor = val.constructor;
    if(ctor) str = ctor.name;
    else str = global.String(val);
  }else{
    str = global.String(typeof val);
  }

  if(sf) str = O.sf(str);
  return str;
}