'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

const DEFAULT_TOKEN = Symbol('defaultToken');
const PROBABILITIES = Symbol('probabilities');

class Sequence{
  constructor(memSize){
    this.memSize = memSize;
    this.mem = O.ca(memSize, () => DEFAULT_TOKEN);
    this.data = O.obj();
    this.finalized = 0;
  }

  static updateMem(mem, token){
    mem.pop();
    mem.unshift(token);
  }

  add(token){
    var {mem, data} = this;

    var obj = data;

    mem.forEach(token => {
      if(!(token in obj)) obj[token] = O.obj();
      obj = obj[token];
    });

    if(!(token in obj)) obj[token] = 1;
    else obj[token]++;

    if(PROBABILITIES in obj)
      delete obj[PROBABILITIES];

    Sequence.updateMem(mem, token);
  }

  finalize(){
    this.add(DEFAULT_TOKEN);
    this.finalized = 1;
  }

  sample(bin=0){
    if(!this.finalized)
      this.finalize();

    var sampler = this.createSampler();
    var output = bin ? [] : '';

    while(1){
      var next = sampler.next();
      if(next.done) break;
      var token = next.value;

      if(bin) output.push(token);
      else output += token;
    }

    if(bin)
      output = Buffer.from(output);

    return output;
  }

  createSampler(activateGenerator=1){
    var {memSize, mem, data} = this;

    var generator = function*(){
      var mem = O.ca(memSize, () => DEFAULT_TOKEN);

      while(1){
        var obj = data;

        mem.forEach(token => {
          obj = obj[token];
        });

        if(!(PROBABILITIES in obj)){
          var probs = O.keys(obj);
          var sum = 0;

          probs.forEach(token => {
            sum += obj[token];
          });

          var tempSum = 0;

          probs = probs.map(token => {
            tempSum += obj[token];

            return [
              tempSum / sum,
              token,
            ];
          });

          obj[PROBABILITIES] = probs;
        }

        var samples = obj[PROBABILITIES];
        var sampleFloat = O.randf(1);
        var index = 0;

        while(sampleFloat > samples[index][0])
          index++;

        var token = samples[index][1];
        if(token === DEFAULT_TOKEN) return;

        Sequence.updateMem(mem, token);

        yield token;
      }
    };

    if(activateGenerator)
      generator = generator();

    return generator;
  }
};

module.exports = Sequence;