'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');

const cwd = __dirname;
const inpFile = path.join(cwd, 'input.txt');
const outFile = path.join(cwd, 'outut.txt');

const main = () => {
  const str = O.rfs(inpFile, 1);
  const entries = O.sanll(str);
  const data = O.obj();
  
  let indexMin = null;
  let indexMax = null;
  
  for(const entry of entries){
    const lines = O.sanl(entry);
    assert(lines.length === 3);
    
    const dateStr = lines[0];
    assert(dateStr.endsWith('.'));
    
    const date = dateStr.slice(0, -1).split('.').map(a => {
      const n = a | 0;
      assert(String(n).padStart(2, '0') === a);
      return n;
    });
    
    assert(date.length === 3);
    assert(date[0] === 1);
    
    const month = date[1];
    assert(month >= 1 && month <= 12);
    
    const year = date[2];
    const index = year * 12 + month - 2;
    
    const [vt, nt] = lines.slice(1).map(a => {
      const n = a | 0;
      assert(String(n) === a);
      return n;
    });
    
    assert(!O.has(data, index));
    data[index] = [vt, nt];
    
    if(indexMin === null || index < indexMin)
      indexMin = index;
    
    if(indexMax === null || index > indexMax)
      indexMax = index;
  }
  
  assert(indexMin !== null);
  assert(indexMax !== null);
  assert(indexMin <= indexMax);
  
  const arr = [];
  
  for(let i = indexMin; i <= indexMax; i++){
    assert(O.has(data, i));
    
    const year = i / 12 | 0;
    const month = i % 12 + 1;
    const [vt, nt] = data[i];
    
    arr.push([year, month, vt, nt]);
  }
  
  const difs = [];
  
  for(let i = 1; i < arr.length; i++){
    const prev = arr[i - 1];
    const [year, month, vt, nt] = arr[i];
    
    const vtDif = vt - prev[2];
    const ntDif = nt - prev[3];
    
    assert(vtDif >= 0);
    assert(ntDif >= 0);
    
    difs.push(`${String(month).padStart(2, '0')}.${year} - ${vtDif} ${ntDif}`);
  }
  
  O.wfs(outFile, difs.join('\n'));
};

main();