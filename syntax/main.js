'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const Syntax = require('.');

const TEST = 1;

const cwd = __dirname;
const examplesDir = path.join(cwd, 'examples');
const exampleDir = path.join(examplesDir, 'javascript');
const ctxFile = path.join(exampleDir, 'context.js');

const testDir = path.join(cwd, 'test');
const srcFile = path.join(testDir, 'src.txt');
const inputFile = path.join(testDir, 'input.txt');
const outputFile = path.join(testDir, 'output.txt');

setTimeout(main);

function main(){
  {
    class A extends O.GraphNode{
      static keys = ['p1', 'p2'];

      constructor(graph, a){
        super(graph);
        this.a = a;
        this.p1 = null;
        this.p2 = null;
      }

      ser(ser=new O.Serializer()){
        ser.writeInt(this.a);
        return ser;
      }

      deser(ser){
        this.a = ser.readInt();
      }
    };

    class B extends O.GraphNode{
      static keys = ['p1'];

      constructor(graph, a){
        super(graph);
        this.a = a;
        this.p1 = null;
      }

      ser(ser=new O.Serializer()){
        ser.writeInt(this.a);
        return ser;
      }

      deser(ser){
        this.a = ser.readInt();
      }
    };

    const graph = new O.Graph([A, B], 2);

    let a1 = new A(graph, 5);
    graph.persist(a1);

    let b1 = new B(graph, 7);
    //a1.p1 = b1;
    b1.p1 = a1;

    let b2 = new B(graph, 11);
    a1.p2 = b2;
    b2.p1 = a1;

    graph.reser();
    log(graph.nodes);

    return;
  }

  const src = TEST ? O.rfs(srcFile, 1) : null;
  const ctxCtor = require(ctxFile);

  const input = O.rfs(inputFile, 1);

  const syntax = TEST ?
    Syntax.fromStr(src, ctxCtor) :
    Syntax.fromDir(exampleDir, ctxCtor);

  const ast = syntax.parse(input, 'script');

  const graph = ast.compile({
    script: d => ['num', d.fst.fst],
    expr: d => d.fst.fst,
    op: d => d.fst.fst,
    add: d => d.elems[0].fst + d.elems[2].fst,
    mul: d => d.elems[0].fst * d.elems[2].fst,
    num: d => d.str | 0,
  });

  let output;

  {
    const mem = [];
    let i = 0;

    const input = [];
    output = [];

    const exec = inst => {
      const type = inst[0];
      const args = inst.slice(1);

      switch(type){
        case 'num': return args[0]; break;
      }
    };

    output = String(exec(graph));
    log(output);
  }

  O.wfs(outputFile, output);
}