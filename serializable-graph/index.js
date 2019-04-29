'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

class SerializableGraph extends O.Serializable{
  #ctors;
  #ctorsNum;
  #ctorsMap;
  #ctorsKeys;
  #nodes;
  #persts;

  constructor(ctors, maxSize=null){
    super();

    this.#ctors = ctors;
    this.#ctorsNum = ctors.length;
    this.maxSize = maxSize;
    this.#nodes = new Set();

    {
      const ctorsMap = new Map();
      const ctorsKeys = new Map();

      ctors.forEach((ctor, index) => {
        ctorsMap.set(ctor, index);
        ctorsKeys.set(ctor, ctor.keys);
      });

      this.#ctorsMap = ctorsMap;
      this.#ctorsKeys = ctorsKeys;
    }

    this.#persts = new Set();
    this.size = 0;
  }

  get nodes(){ return this.#nodes; }

  addNode(node){
    const {maxSize} = this;
    const {size} = node;

    if(maxSize !== null && this.size + size > maxSize)
      this.gc();

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
    return this;
  }

  unpersist(node){
    node.persistent = 0;
    return this.#persts.delete(node);
    return this;
  }

  changeSize(diff){
    const {maxSize} = this;

    this.size += diff;
    if(maxSize !== null && this.size > this.maxSize)
      this.gc();

    return this;
  }

  gc(){
    const nodes = new Set();
    const queue = Array.from(this.#persts);
    let size = 0;

    while(queue.length !== 0){
      const node = queue.shift();

      nodes.add(node);
      size += node.size;

      for(const key of this.#ctorsKeys.get(node.constructor)){
        const next = node[key];
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
    this.size = size;

    if(this.size >= this.maxSize)
      throw new RangeError('Maximum graph size exceeded');

    return this;
  }

  ser(ser=new O.Serializer()){
    const lastCtorIndex = this.#ctorsNum - 1;

    const all = new Set(this.#nodes);
    const done = new Map();
    const queue = [];

    const lastNodeIndex = all.size - 1;
    ser.writeInt(all.size);

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

        const ctor = node.constructor;
        const seen = done.has(node);
        const index = seen ? done.get(node) : done.size;

        if(first) first = 0;
        else ser.write(index, Math.min(done.size, lastNodeIndex));
        if(seen) continue;

        all.delete(node);
        done.set(node, index);

        ser.write(this.#ctorsMap.get(ctor), lastCtorIndex);
        ser.write(node.persistent);
        node.ser(ser);

        for(const key of this.#ctorsKeys.get(ctor))
          queue.push(node[key]);
      }
    }

    return ser;
  }

  deser(ser){
    const lastCtorIndex = this.#ctorsNum - 1;

    const nodes = this.#nodes = new Set();
    const persts = this.#persts = new Set();
    this.size = 0;

    const nodesNum = ser.readInt();
    const lastNodeIndex = nodesNum - 1;

    const done = [];
    const queue = [];

    while(nodes.size !== nodesNum){
      let first = 1;

      while(queue.length !== 0 || first){
        const isNull = first ? 0 : !ser.read();
        const index = first ? nodes.size : isNull ? -1 : ser.read(Math.min(nodes.size, lastNodeIndex));
        const seen = isNull || index !== nodes.size;
        const node = seen ? isNull ? null : done[index] : new this.#ctors[ser.read(lastCtorIndex)](this);

        if(first){
          first = 0;
        }else{
          const elem = queue[0];
          const keys = this.#ctorsKeys.get(elem[0].constructor);
          elem[0][keys[elem[1]++]] = node;
          if(elem[1] === keys.length) queue.shift();
        }

        if(seen) continue;

        done.push(node);
        if(node.persistent = ser.read()) persts.add(node);
        node.deser(ser);

        if(this.#ctorsKeys.get(node.constructor).length !== 0)
          queue.push([node, 0]);
      }
    }

    return this;
  }
};

class Node extends O.Serializable{
  static keys = null;
  persistent = 0;
  #size;

  constructor(graph){
    super();

    const {keys} = this.constructor;
    this.#size = (keys !== null ? keys.length + 1 : 1) << 3;

    this.graph = graph;
    graph.addNode(this);
  }

  get size(){ return this.#size; }

  set size(size){
    const diff = size - this.#size;
    this.#size = size;
    this.graph.changeSize(diff);
  }
};

class GraphArrayElem extends Node{
  static keys = ['node', 'next'];

  constructor(graph, node=null, next=null){
    super(graph);
    this.node = node;
    this.next = next;
  }
};

class GraphArray extends Node{
  static keys = ['first'];
  #len = 0;

  constructor(graph){
    super(graph);
    this.first = null;
  }

  get length(){ return this.#len; }

  set length(len){
    O.noimpl('length');
  }

  ser(ser=new O.Serializer()){ return ser.writeUint(this.#len); }
  deser(ser){ this.#len = ser.readUint(); return this; }
};

Object.assign(SerializableGraph, {
  Node,
  GraphArrayElem,
  GraphArray,
});

module.exports = SerializableGraph;