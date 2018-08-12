'use strict';

const O = require('../framework');

const DEFAULT_TOKEN = Symbol('defaultToken');

class Sequence{
  constructor(memSize){
    this.memSize = memSize;
    this.mem = O.ca(memSize, () => DEFAULT_TOKEN);
    this.data = O.obj();
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

    mem.shift();
    mem.push(token);
  }

  sample(){
    var sampler = this.createSampler();
    var str = '';

    while(1){
      var next = sampler.next();
      if(next.done) break;
      var token = next.value;

      str += token;
    }

    return str;
  }

  createSampler(activateGenerator=1){
    var {memSize, mem, data} = this;

    var tokensObj = O.obj();

    var queue = O.keys(data).map(token => {
      return [
        [token],
        data[token],
      ];
    });

    while(queue.length !== 0){
      var elem = queue.shift();
      var [tokens, obj] = elem;

      if(tokens.length !== memSize){
        O.keys(obj).forEach(token => {
          queue.push([
            [...tokens, token],
            obj[token],
          ]);
        });
      }else{
        var tokensArr = O.keys(obj);
        var sum = 0;

        tokensArr.forEach(token => {
          sum += obj[token];
        });

        var tempSum = 0;

        tokensArr = tokensArr.map(token => {
          tempSum += obj[token];

          return [
            tempSum / sum,
            token,
          ];
        });

        var obj = tokensObj;

        tokens.forEach((token, index) => {
          if(index === memSize - 1) return;

          if(!(token in obj)) obj[token] = O.obj();
          obj = obj[token];
        });

        obj[tokens[memSize - 1]] = tokensArr;
      }
    }

    var obj = tokensObj;

    mem.forEach((token, index) => {
      if(index === memSize - 1) return;

      if(!(token in obj)) obj[token] = O.obj();
      obj = obj[token];
    });

    obj[mem[memSize - 1]] = [[1, DEFAULT_TOKEN]];

    var generator = function*(){
      var mem = O.ca(memSize, () => DEFAULT_TOKEN);

      while(1){
        var obj = tokensObj;

        mem.forEach(token => {
          if(!(token in obj)) obj[token] = O.obj();
          obj = obj[token];
        });

        var samples = obj;
        var sampleFloat = O.randf(1);
        var index = 0;

        while(sampleFloat > samples[index][0])
          index++;

        var token = samples[index][1];
        if(token === DEFAULT_TOKEN) return;

        mem.shift();
        mem.push(token);

        yield token;
      }
    };

    if(activateGenerator)
      generator = generator();

    return generator;
  }
};

module.exports = Sequence;