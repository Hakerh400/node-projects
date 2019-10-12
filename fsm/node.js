'use strict';

class Node{
  constructor(name='', ptr0=null, ptr1=null, epsilons=[], final=0){
    this.name = name;

    this[0] = ptr0;
    this[1] = ptr1;
    
    this.epsilons = epsilons;
    this.final = final;
  }

  set(ptr0=null, ptr1=null){
    this[0] = ptr0;
    this[1] = ptr1;
    return this;
  }
}

module.exports = Node;