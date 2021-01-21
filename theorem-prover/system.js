'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');

const inRange = (n, min, max) => {
  assert(typeof n === 'number');
  assert(n >= min && n <= max);

  return n;
};

const getElem = (arr, index) => {
  return arr[inRange(index, 0, arr.length - 1)];
};

class System{
  constructor(axioms=[]){
    this.axioms = [];

    this.addAxioms(axioms);
  }

  addAxioms(axioms){
    for(const axiom of axioms)
      this.addAxiom(axiom);
  }

  addAxiom(axiom){
    this.axioms.push(axiom);
  }

  execProof(proof){
    assert(proof.length >= 1);

    const {axioms} = this;
    const steps = [];

    for(const stepInfo of proof){
      const stepInfoLen = stepInfo.length;
      inRange(stepInfoLen, 2, 3);

      const [axi, refs] = stepInfo;
      const ax = getElem(axioms, axi);
      assert(refs.length === ax.length);

      const args = refs.map(a => getElem(steps, a));
      const result = ax(...args);
      steps.push(result);

      if(stepInfoLen === 3){
        const expected = String(stepInfo[2]);
        const actual = String(result);

        assert.strictEqual(actual, expected);
      }
    }

    return steps;
  }

  getProofResult(proof){
    return O.last(this.execProof(proof));
  }

  checkProofResult(proof, expectedResult){
    const expected = String(expectedResult);
    const actual = String(this.getProofResult());

    return actual === expected;
  }
}

module.exports = System;