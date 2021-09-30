'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const kws = require('./kws');

const defsPerLine = 5;
const evalCode = 1;

const cwd = __dirname;
const inpFile = path.join(cwd, 'input.js');
const outFile = path.join(cwd, 'output.js');

const identChars = O.chars('a', 'z');
const identCharsNum = identChars.length;

const tabSize = 2;
const tabStr = ' '.repeat(tabSize);

const main = () => {
  let str = O.rfs(inpFile, 1);
  let parts = O.sanll(str);

  let basePart = parts[1];
  let baseName = basePart.match(/\w+/g)[1];

  let middle = parts.slice(2).join('\n');
  let linesRaw = O.sanl(middle);
  let identsObj = O.obj();

  identsObj[baseName] = null;

  const isIdent = a => {
    return typeof a === 'string';
  };

  const isBase = a => {
    return a === null;
  };

  const isCall = a => {
    return !isIdent(a);
  };

  const getName = a => {
    return a;
  };

  const getTarget = a => {
    return a[0];
  };

  const getArg = a => {
    return a[1];
  };

  const mkIdent = name => {
    return name;
  };

  const mkCall = (target, arg) => {
    return [target, arg];
  };

  const parseExpr = str => {
    const parseExpr = function*(){
      let match = str.match(/^\w+/);
      assert(match !== null);

      let identName = match[0];
      str = str.slice(identName.length);

      let expr = mkIdent(identName);

      while(str[0] === '('){
        str = str.slice(1);

        let arg = yield [parseExpr];
        assert(str[0] === ')');

        str = str.slice(1);
        expr = mkCall(expr, arg);
      }

      return expr;
    };

    let expr = O.rec(parseExpr);
    assert(str.length === 0);

    return expr;
  };

  let lastName = null;

  for(let line of linesRaw){
    const match = line.match(/^\s*(?:const\s|,)\s*(\w+)\s*=\s*(.*)/);
    if(match === null) continue;

    let name = match[1];
    let expr = parseExpr(match[2].replace(/\s+/g, ''));

    lastName = name;

    assert(!O.has(identsObj, name));
    identsObj[name] = expr;
  }

  assert(lastName !== null);

  let namesEntriesObj = O.obj();
  namesEntriesObj[baseName] = 0;

  let callsObj = O.obj();
  let table = [null];
  
  const getEntryForName = function*(name){
    if(O.has(namesEntriesObj, name))
      return namesEntriesObj[name];

    const expr = identsObj[name];
    const entry = yield [getEntryForExpr, expr];

    assert(!O.has(namesEntriesObj, name));
    namesEntriesObj[name] = entry;

    return entry;
  };

  const getEntryForExpr = function*(expr){
    if(isIdent(expr)){
      const name = getName(expr);
      return O.tco(getEntryForName, name);
    }

    const target = getTarget(expr);
    const arg = getArg(expr);

    const targetEntry = yield [getEntryForExpr, target];
    const argEntry = yield [getEntryForExpr, arg];

    if(!O.has(callsObj, targetEntry))
      callsObj[targetEntry] = O.obj();

    const slot = callsObj[targetEntry];

    if(O.has(slot, argEntry))
      return slot[argEntry];
    
    if(table.some(elem => {
      if(elem === null) return 0;
      const [a, b] = elem;
      return a === targetEntry && b === argEntry;
    })){
      log(table);
      log(targetEntry, argEntry);
      assert.fail();
    }
    
    const entry = table.length;
    
    table.push([targetEntry, argEntry]);
    slot[argEntry] = entry;

    return entry;
  };

  O.rec(getEntryForName, lastName);

  const identsNum = table.length;
  const identsList = mkIdentsList(identsNum);

  const retrievedIdents = O.obj();
  let remainingIdents = identsNum;

  const getIdent = i => {
    if(!O.has(retrievedIdents, i)){
      retrievedIdents[i] = 1;
      remainingIdents--;
    }

    return identsList[i];
  };

  const lastPart = O.last(parts);
  const lastLine = O.last(O.sanl(lastPart));

  const header = parts[0];
  const footer = lastLine;

  basePart = basePart.replace(baseName, getIdent(0));

  const middleLines = [];
  let middleDefs = [];

  const tableLen = table.length;
  const rhsObj = O.obj();
  
  for(let i = 1; i !== tableLen; i++){
    const [t, a] = table[i];
    const target = getIdent(t);
    const arg = getIdent(a);
    const name = getIdent(i);
    const rhs = `${target}(${arg})`;
    
    if(O.has(rhsObj, rhs)){
      log(rhs);
      assert.fail();
    }
    
    rhsObj[rhs] = 1;
    
    const defStr = `, ${name} = ${rhs}`;
    middleDefs.push(defStr);

    if(middleDefs.length === defsPerLine || i === tableLen - 1){
      middleLines.push(tabn(3, middleDefs.join('')));
      middleDefs.length = 0;
    }
  }

  let fstLine = middleLines[0];
  let prefix = tab('const');

  fstLine = setPrefix(prefix, fstLine);
  middleLines[0] = fstLine;

  middleLines.push(footer);
  const middlePart = middleLines.join('\n');

  const code = [
    header,
    basePart,
    middlePart,
  ].join('\n\n');

  assert(remainingIdents === 0);
  
  if(evalCode){
    const func = new Function(code);
    func();
  }

  O.wfs(outFile, code);
};

const mkIdentsList = identsNumOrig => {
  let identsNum = identsNumOrig;

  while(1){
    const identLen = calcIdentLen(identsNum);

    const getIdent = n => {
      let name = '';

      for(let i = 0; i !== identLen; i++){
        const k = n % identCharsNum;
        const c = identChars[k];

        name = c + name
        n = n / identCharsNum | 0;
      }

      return name;
    };

    const identsList = O.ca(identsNum, i => getIdent(i)).
      filter(a => !O.has(kws, a));

    const dif = identsNumOrig - identsList.length;

    if(dif === 0)
      return identsList;

    identsNum += dif;
  }
};

const calcIdentLen = identsNum => {
  let len = 0;
  let maxNum = 1;

  while(maxNum <= identsNum){
    len++;
    maxNum *= identCharsNum;
  }

  return len;
};

const setPrefix = (prefix, str) => {
  return prefix + str.slice(prefix.length);
};

const tabn = (n, a) => {
  return tabStr.repeat(n) + a;
};

const tab = a => {
  return tabStr + a;
};

main();