'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('./assert');
const O = require('../omikron');
const System = require('./system');
const Display = require('./display');
const Theory = require('./theory');
const parser = require('./parser');
const Expr = require('./expr');
const Context = require('./context');
const Subgoal = require('./subgoal');
const Editor = require('./editor');
const LineData = require('./line-data');
const config = require('./config');
const specialChars = require('./special-chars');
const util = require('./util');
const su = require('./str-util');

const {min, max, floor, ceil, round} = Math;
const {project} = O;
const {Ident, Call, Lambda} = Expr;
const {ws, hs, ofs, tabW, tabH} = config;

const displayLineProcess = 0;
const lineProcessSpeed = 50;
const loadLogic = 0;

const {g} = O.ceCanvas(1);

const smallNatMax = 1e3;
const mediumNatMax = 2 ** 30 - 1;

const system = new System();
const display = new Display(system);

const linesData = [];

let dataPrev = null;

let iw, ih;
let w, h;

const cwd = __dirname;
const logicFile = path.join(cwd, './logic/1.txt');
const logicStr = loadLogic ? O.rfs(logicFile, 1) : null;

const main = () => {
  display.newTab();

  // mainEditor.selected = 1;
  // outputEditor.wrap = 1;
  //
  // load();
  //
  // mainEditor.updateLine(0);

  initCanvas();
  aels();

  onResize();
  O.raf(updateDisplay);
};

const initCanvas = () => {
  g.textBaseline = 'middle';
  g.textAlign = 'center';

  g.fontFamily = 'monospace';
  g.font((ws + hs) / 2);
};

const aels = () => {
  O.ael('keydown', onKeyDown);
  O.ael('keypress', onKeyPress);
  O.ael('resize', onResize);
};

const updateDisplay = () => {
  // const {lines, updatedLine} = mainEditor;
  //
  // if(updatedLine !== null && linesData.length > updatedLine){
  //   linesData.length = updatedLine;
  //   mainEditor.updatedLine = null;
  // }
  //
  // for(let i = 0; i !== lineProcessSpeed; i++){
  //   if(hasErr() || linesData.length === lines.length) break;
  //
  //   updateNextLine();
  //
  //   if(displayLineProcess){
  //     if(hasErr() || linesData.length === lines.length) break;
  //
  //     const index = linesData.length;
  //     const line = lines[index];
  //
  //     if(displayLineProcess && line.trim())
  //       mainEditor.markedLine = [index, '#f80'];
  //   }
  // }
  //
  // updateOutput();
  render();

  O.raf(updateDisplay);
};

const render = () => {
  g.clearCanvas('white');
  display.render(g, iw, ih, w, h);
};

const updateNextLine = () => {
  const {lines} = mainEditor;
  const index = linesData.length;

  mainEditor.markedLine = null;

  const dataPrev = getLastData();
  const {ctx} = dataPrev;
  const data = O.rec(processLine, index, ctx);

  if(data === null){
    linesData.push(dataPrev);
    return;
  }

  linesData.push(data);

  if(data.err){
    mainEditor.markedLine = [index, '#faa'];
    return;
  }
};

const updateOutput = () => {
  const linesDataNum = linesData.length;
  let lineIndex = mainEditor.cy;

  if(hasErr() && lineIndex >= linesDataNum)
    lineIndex = linesDataNum - 1;

  if(lineIndex >= linesDataNum){
    // if(dataPrev === null) return;

    const percent = round(
      (linesDataNum + 1) /
      (mainEditor.lines.length + 1) * 100);

    dataPrev = null;
    outputEditor.setText(`${percent}%`);

    return;
  }

  const data = linesData[min(lineIndex, linesDataNum - 1)];
  if(data === dataPrev) return;

  dataPrev = data;
  outputEditor.setText(data.str);
};

const getLastData = () => {
  const data = O.last(linesData);
  if(data === null) return mkInitialLineData();

  return data;
};

const mkInitialLineData = () => {
  return new LineData(0, new Context());
};

const processLine = function*(lineIndex, ctx){
  const ctxPrev = ctx;

  const mkLineDataStr = function*(str){
    const hadProof = ctxPrev.hasProof;

    if(!hadProof)
      return str;

    const {proof} = ctxPrev;
    const {name, prop} = ctxPrev;
    const {hasProof} = ctx;

    if(!hasProof)
      return `lemma ${
        proof.name}: ${
        yield [[proof.prop, 'toStr'], ctx]}`;

    assert(proof.name === ctx.proof.name);

    return `${
      yield [[proof, 'toStr'], ctxPrev]}\n\n${
      '-'.repeat(50)}\n\n${str}`;
  };

  const mkLineData = function*(str, err){
    const strNew = yield [mkLineDataStr, str];
    return new LineData(lineIndex, ctx, strNew, err);
  };

  const processResult = function*(result){
    if(!result) return result;

    if(result[0] === 0){
      const err = result[1];

      if(!util.isStr(err))
        throw err;

      // const msg = typeof err === 'string' ?
      //   err : su.tab(err.pos, `^ ${err.msg}`);

      return O.breakRec(yield [mkLineData, err, 1]);
    }

    return result[1];
  };

  const ret = function*(str){
    return yield [mkLineData, str];
  };

  const err = function*(msg){
    return O.tco(processResult, [0, msg]);
  };

  const syntErr = () => {
    throw `Syntax error near ${O.sf(line.trim())}`;
  };

  const {lines} = mainEditor;
  let line = lines[lineIndex];

  line = line.trimLeft();

  const eol = () => {
    return line.length === 0;
  };

  const neol = () => {
    return line.length !== 0;
  };

  const name2str = name => {
    return ctx.name2str(name, 2);
  };

  if(eol() || line.trim() === '-'){
    if(!ctx.hasProof)
      return null;

    return O.tco(mkLineData, '');
  }

  const stack = [];

  const push = function*(str){
    stack.push(line);
    line = str;
  };

  const pop = function*(assertEmpty=1){
    assert(stack.length !== 0);

    if(assertEmpty)
      yield [assertEol];

    const str = line;
    line = stack.pop();

    return str;
  };

  const assertEol = function*(){
    if(neol())
      throw `Extra tokens found at the end: ${O.sf(line.trim())}`;

    return [1];
  };

  const assertFreeFact = function*(name){
    if(ctx.hasFact(name))
      throw `Fact ${O.sf(name)} already exists`;

    return [1];
  };

  const assertFree = function*(name){
    if(ctx.hasName(name))
      throw `Identifier ${name2str(name)} already exists`;

    return [1];
  };

  const assertDefined = function*(name){
    if(!ctx.hasName(name))
      throw `Undefined identifier ${name2str(name)}`;

    return [1];
  };

  const assertEq = function*(actual, str){
    const {isType} = actual;

    const expr = yield [parser.parse, ctx, str, isType];
    const expected = yield [[expr, 'simplify'], ctx];

    if(yield [[actual, 'eqAlpha'], expected])
      return [1];

    const str1 = yield [[expected, 'toStr'], ctx];
    const str2 = yield [[actual, 'toStr'], ctx];

    if(str2 !== str1)
      throw `${isType ? 'Types' : 'Values'} do not match\n${
        su.tab(1, `Expected: ${str1}`)}\n${
        su.tab(1, `Actual:${' '.repeat(2)} ${str2}`)}`;
  };

  const trimLine = (trim=1) => {
    if(!trim) return;
    line = line.trimLeft();
  };

  const advance = function*(str, trim){
    line = line.slice(str.length);
    trimLine(trim);

    return str;
  };

  const getToken = function*(parens=0, trim){
    let match = line.match(/^[^\s\(\)\[\]\,\.\:]+/);

    if(match !== null)
      return O.tco(advance, match[0], trim);

    if(!parens) return null;

    match = line.match(/^\(\s*([^\s\(\)\[\]\,\.\:]+)\s*\)/);
    if(match === null) return null;

    yield [advance, match[0], trim];

    return match[1];
  };

  const getIdent = function*(){
    const name = yield [getToken, 1];

    if(name === null)
      throw `Missing identifier`;

    return name;
  };

  const getExact = function*(str){
    if(!line.startsWith(str))
      throw `Expected ${O.sf(str)} near ${O.sf(line.trim())}`;

    return O.tco(advance, str);
  };

  const getSomeParens = function*(c1, c2, trim){
    const end = line.indexOf(c2);

    if(!line.startsWith(c1) || end === -1)
      throw `Invalid parenthesis near ${O.sf(line.trim())}`;

    let str = line.slice(1, end);
    line = line.slice(end + 1);
    trimLine(trim);

    str = str.trim();

    if(str.length === 0)
      return [];

    return str.split(',').map(a => a.trim());
  };

  const getParens = function*(trim){
    return O.tco(getSomeParens, '(', ')', trim);
  };

  const getBrackets = function*(trim){
    return O.tco(getSomeParens, '[', ']', trim);
  };

  const getBraces = function*(trim){
    return O.tco(getSomeParens, '{', '}', trim);
  };

  const getInt = function*(min=null, max=null){
    if(min !== null) min = BigInt(min);
    if(max !== null) max = BigInt(max);

    if(min !== null && max !== null)
      assert(min <= max);

    const tk = yield [getToken];

    if(tk === null)
      throw `Missing number`;

    if(!su.isInt(tk))
      throw `Invalid number ${O.sf(tk)}`;

    const n = BigInt(tk);

    if(min !== null && n < min)
      throw `Number ${n} is too small (must be at least ${min})`;

    if(max !== null && n > max)
      throw `Number ${n} is too big (must be at most ${max})`;

    return n;
  };

  const getNat = function*(max){
    return O.tco(getInt, 0, max);
  };

  const getSmallNat = function*(max=smallNatMax){
    assert(max <= smallNatMax);

    const n = yield [getNat, max];
    return Number(n);
  };

  const getMediumNat = function*(){
    const n = yield [getNat, mediumNatMax];
    return Number(n);
  };

  const getArity = function*(){
    return O.tco(getMediumNat);
  };

  const getPrec = function*(){
    return O.tco(getMediumNat);
  };

  const getIdentInfo = function*(){
    const elems = yield [getBrackets];

    if(elems.length !== 1)
      throw `Expected exactly one element in [${elems.join(', ')}]`;

    yield [push, elems[0]];

    const sort = yield [getToken];

    if(sort === null)
      throw `Missing identifier sort`;

    if(!O.has(parseIdentSortFuncs, sort))
      throw `Unknown identifier sort ${O.sf(sort)}`;

    const info = yield [parseIdentSortFuncs[sort]];
    yield [pop];

    return info;
  };

  const getMeta = function*(name, addParens=0){
    let sym = ctx.getMeta(name);

    if(addParens)
      sym = su.addParens(sym);

    return sym;
  };

  const getExpr = function*(isType){
    const exprRaw = yield [parser.parse, ctx, line, isType];
    const expr = yield [[exprRaw, 'simplify'], ctx];

    line = '';

    return expr;
  };

  const getProp = function*(){
    const prop = yield [getExpr];
    const boolSym = yield [getMeta, 'bool', 1];

    yield [assertEq, prop.type, boolSym];

    return prop;
  };

  const getFactName = function*(factType){
    const name = yield [getToken];

    if(name === null)
      throw `Missing ${factType} name`;

    yield [assertFreeFact, name];
    yield [getExact, ':'];

    return name;
  };

  const getPremiseIndex = function*(){
    const premisesNum = ctx.proof.subgoal.length;
    const n = Number(yield [getInt, 1, premisesNum]);

    return n - 1;
  };

  const parseIdentSortFuncs = {
    *prefix(){
      const prec = yield [getPrec];
      return ['operator', [prec, [prec]]];
    },

    *infixl(){
      const prec = yield [getPrec];
      return ['operator', [prec, [prec, prec + .5]]];
    },

    *infixr(){
      const prec = yield [getPrec];
      return ['operator', [prec, [prec + .5, prec]]];
    },

    *binder(){
      return ['binder', [0, [0]]];
    },
  };

  const insertIdentSortFuncs = {
    *identifier(name, info){
      ctx.idents = util.copyObj(ctx.idents)
      ctx.idents[name] = info;
    },

    *operator(name, info){
      ctx.ops = util.copyObj(ctx.ops)
      ctx.ops[name] = info;
    },

    *binder(name, info){
      ctx.binders = util.copyObj(ctx.binders)
      ctx.binders[name] = info;
    },
  };

  const metaSymbolFuncs = {
    *bool(name){
      yield [assertDefined, name];

      const arity = ctx.getTypeArity(name);

      if(arity !== 0)
        throw `Bool type cannot have arguments`;
    },

    *arrow(name){
      yield [assertDefined, name];

      const arity = ctx.getTypeArity(name);

      if(arity !== 2)
        throw `Arrow must be a binary type`;

      ctx.meta.arrow = name;
    },

    *lambda(name){
      yield [assertFree, name];
    },

    *uni(name){
      yield [assertDefined, name];

      if(ctx.hasType(name))
        throw `Universal quantifier cannot be a type`;

      const type = ctx.getType(name);
      assert(type !== null);

      const boolSym = yield [getMeta, 'bool', 1];
      const arrowSym = yield [getMeta, 'arrow', 1];

      yield [assertEq, type, `${arrowSym} (${arrowSym} 'a ${boolSym}) ${boolSym}`];
    },

    *imp(name){
      yield [assertDefined, name];

      if(ctx.hasType(name))
        throw `Implication cannot be a type`;

      const type = ctx.getType(name);
      assert(type !== null);

      const boolSym = yield [getMeta, 'bool', 1];
      const arrowSym = yield [getMeta, 'arrow', 1];

      yield [assertEq, type, `${arrowSym} ${boolSym} (${arrowSym} ${boolSym} ${boolSym})`];
    },

    *eq(name){
      yield [assertDefined, name];

      if(ctx.hasType(name))
        throw `Equality cannot be a type`;

      const type = ctx.getType(name);
      assert(type !== null);

      const boolSym = yield [getMeta, 'bool', 1];
      const arrowSym = yield [getMeta, 'arrow', 1];

      yield [assertEq, type, `${arrowSym} 'a (${arrowSym} 'a ${boolSym})`];
    },
  };

  const directiveFuncs = {
    *spacing(){
      const name = yield [getIdent];
      const before = yield [getSmallNat];
      const after = yield [getSmallNat];
      const inParens = yield [getSmallNat, 1];

      if(ctx.hasSpacingInfo(name))
        throw `Spacing has already been defined for ${name2str(name)}`;

      ctx = ctx.copy();
      ctx.spacing = util.copyObj(ctx.spacing);

      ctx.setSpacingInfo(name, [before, after, inParens]);

      return O.tco(ret, `spacing ${name2str(name)} ${before} ${after} ${inParens}`);
    },

    *type(){
      const name = yield [getIdent];
      yield [assertFree, name];

      const arity = yield [getArity];

      let sort = 'identifier';
      let info = [0, []];

      if(line.startsWith('[')){
        [sort, info] = yield [getIdentInfo];

        if(sort !== 'operator')
          throw `Type identifier ${
            name2str(name)} cannot be defined as \`${
            sort}\``;
      }

      ctx = ctx.copy();

      assert(O.has(insertIdentSortFuncs, sort));
      yield [insertIdentSortFuncs[sort], name, [arity, info]];

      return O.tco(ret, `type ${name2str(name)} ${arity}`);
    },

    *const(){
      const name = yield [getIdent];
      yield [assertFree, name];

      let sort = 'identifier';
      let info = [0, []];

      if(line.startsWith('['))
        [sort, info] = yield [getIdentInfo];

      yield [getExact, '::'];
      const type = yield [getExpr, 1];

      ctx = ctx.copy();

      assert(O.has(insertIdentSortFuncs, sort));
      yield [insertIdentSortFuncs[sort], name, [type, info]];

      return O.tco(ret, `const ${name2str(name)} :: ${yield [[type, 'toStr'], ctx]}`);
    },

    *meta(){
      const name = yield [getToken];

      if(name === null)
        throw `Missing meta symbol name`;

      if(!O.has(metaSymbolFuncs, name))
        throw `Unknown meta symbol ${O.sf(name)}`;

      if(ctx.hasMeta(name))
        throw `Meta symbol ${O.sf(name)} has already been defined`;

      const ident = yield [getIdent, 0];

      ctx = ctx.copy();
      ctx.meta = util.copyObj(ctx.meta);

      yield [metaSymbolFuncs[name], ident];
      ctx.meta[name] = ident;

      return O.tco(ret, `meta ${name} ${name2str(ident)}`);
    },

    *axiom(){
      const name = yield [getFactName, 'axiom'];
      const prop = yield [getProp];

      ctx = ctx.copy();
      ctx.facts = util.copyObj(ctx.facts);
      ctx.facts[name] = prop;

      return O.tco(ret, `axiom ${name}: ${yield [[prop, 'toStr'], ctx]}`);
    },

    *lemma(){
      const name = yield [getFactName, 'lemma'];
      const prop = yield [getProp];

      ctx = ctx.copy();

      const subgoal = new Subgoal();
      yield [[subgoal, 'addGoal'], ctx, prop];

      ctx.createProof(name, prop);
      ctx.proof.addSubgoal(subgoal);

      return O.tco(ret, yield [[ctx.proof, 'toStr'], ctx]);
    },

    *def(){
      const name = yield [getIdent];
      yield [assertFree, name];

      let sort = 'identifier';
      let info = [0, []];

      if(line.startsWith('['))
        [sort, info] = yield [getIdentInfo];

      yield [getExact, ':'];

      const val = yield [getExpr];
      const type = val.type;

      ctx = ctx.copy();

      assert(O.has(insertIdentSortFuncs, sort));
      yield [insertIdentSortFuncs[sort], name, [type, info]];

      const eqSym = yield [getMeta, 'eq'];
      const factName = `${name}_def`;
      const fact = yield [[Expr.mkBinOp(eqSym, new Ident(name), val), 'simplify'], ctx];

      ctx.facts = util.copyObj(ctx.facts);
      const {facts} = ctx;

      if(O.has(facts, factName))
        throw `Fact ${O.sf(factName)} already exists`;

      facts[factName] = fact;

      // if(name === '¬'){
      //   for(const name of O.keys(ctx.ops))
      //     log(`${name2str(name)} ---> ${JSON.stringify(ctx.ops[name][1]).replace(/\,/g, ', ')}`);
      // }

      return O.tco(ret, `def ${name2str(name)}: ${yield [[val, 'toStr'], ctx]}`);
    },
  };

  const applySpecsAndMPs = function*(proof){
    line = line.trimRight();

    const matchGoal = line.endsWith(' %');
    if(matchGoal) line = line.slice(0, -2);

    const {subgoal} = proof;
    const {premises, goal} = subgoal;
    const premisesNum = premises.length;

    const premisesStatus = O.obj();

    let prop = null;
    let insertionIndex = null;
    let offsetIndex = 0;

    const setPremiseStatus = function*(index, keep){
      if(O.has(premisesStatus, index) && premisesStatus[index] ^ keep)
        throw `Status mismatch for premise ${index + 1}`;

      premisesStatus[index] = keep;
    };

    const setInsIndex = function*(index){
      if(insertionIndex !== null)
        throw `Multiple appearances of \`*\` premise attribute`;

      insertionIndex = index;
    };

    const processPremiseAttribs = function*(index, attribs){
      const attribsNum = attribs.length;
      const keep = attribs.includes('+');
      const ins = attribs.includes('*');

      if(keep + ins !== attribsNum)
        throw `Invalid premise attributes ${O.sf(attribs)}`;

      yield [setPremiseStatus, index, keep];
      if(!ins) return;

      yield [setInsIndex, index + !attribs.startsWith('+')];
    };

    const parsePremiseIndex = function*(tk){
      if(!/^\d/.test(tk)) return null;

      const match = tk.match(/^(\d+)(.*)$/);
      assert(match !== null);

      const indexStr = match[1]
      const attribs = match[2];

      if(!su.isInt(indexStr))
        throw `Invalid premise index ${O.sf(indexStr)}`;

      const index = Number(indexStr) - 1;

      if(!(index >= 0 && index < premisesNum))
        throw `There is no premise with index ${tk}`;

      yield [processPremiseAttribs, index, attribs];

      return index;
    };

    while(!eol()){
      let propNew = null;
      let specs = null;
      let unisNum = null;

      if(line.startsWith('{')){
        const elems = yield [getBraces, 0];

        if(elems.length !== 1)
          throw `Expected exactly one element in the braces, but got ${
            elems.length}`;

        const str = elems[0];

        if(!su.isInt(str))
          throw `Invalid parameter {${str}}`;

        unisNum = Number(str);

        if(unisNum < 0)
          throw `Universal quantifier number must be a positive integer`;

        if(/^\s/.test(line))
          throw `Missing an expression after the universal quantifier number`;
      }

      if(!line.startsWith('[')){
        const tk = yield [getToken, 0, 0];

        if(tk === null)
          return syntErr();

        const premiseIndex = yield [parsePremiseIndex, tk];

        if(premiseIndex !== null){
          // Premise

          propNew = premises[premiseIndex];
        }else{
          // Other fact

          const fact = ctx.getFact(tk);

          if(fact === null)
            throw `Undefined fact ${O.sf(tk)}`;

          propNew = fact;
        }
      }

      if(line.startsWith('[')){
        const exprStrs = yield [getBrackets, 0];

        if(exprStrs.length === 0)
          throw `Empty specification parameters`;

        specs = [];

        for(const str of exprStrs)
          specs.push(yield [parser.parse, ctx, str]);
      }

      if(neol() && !line.startsWith(' '))
        return syntErr();

      trimLine();

      if(propNew === null){
        assert(specs !== null);
        assert(specs.length !== 0);

        if(unisNum !== null)
          throw `Universal quantifier number cannot be defined for pure specification`;

        if(prop === null)
          throw `Pure specification cannot be the first transformation`;

        prop = yield [[prop, 'specArr'], ctx, specs];
        continue;
      }

      if(specs !== null)
        propNew = yield [[propNew, 'specArr'], ctx, specs];

      if(prop === null){
        prop = propNew;
        continue;
      }

      prop = yield [[prop, 'mpDir'], ctx, propNew, unisNum];
    }

    if(prop === null)
      throw `This proof directive requires at least one proposition`;

    prop = yield [[prop, 'simplify'], ctx];

    const premisesNew = premises.filter((p, i) => {
      if(!O.has(premisesStatus, i)) return 1;
      if(premisesStatus[i]) return 1;

      if(insertionIndex !== null && i < insertionIndex)
        insertionIndex--;

      return 0;
    });

    return {
      prop,
      offsetIndex,
      insertionIndex,
      premisesNew,
      matchGoal,
    };
  };

  const proofDirectiveFuncs = {
    *'-'(proof){
      // O.z=-~O.z;

      const {subgoal} = proof;
      const {goal} = subgoal;

      const {
        prop,
        offsetIndex,
        insertionIndex,
        premisesNew,
        matchGoal,
      } = yield [applySpecsAndMPs, proof];

      const proofNew = proof.copy();

      if(!matchGoal){
        const subgoalNew = subgoal.copy();

        subgoalNew.premises = premisesNew;
        subgoalNew.addPremise(prop, insertionIndex);

        proofNew.setSubgoal(subgoalNew, 1);

        ctx = ctx.copy();
        ctx.proof = proofNew;

        // O.z=-~O.z

        // const ser = new O.Serializer();
        // yield [[prop, 'ser'], ser];
        //
        // const buf = ser.getOutput();
        // const prop1 = yield [[Expr, 'deser'], new O.Serializer(buf)];

        return O.tco(ret, yield [[prop, 'toStr'], ctx]);
      }

      proofNew.subgoals = proofNew.subgoals.slice();
      proofNew.removeSubgoal();

      const goalsNew = yield [[prop, 'mpRev'], ctx, goal];

      const goalStrs = [];
      const toStrIdents = util.obj2();

      for(let i = goalsNew.length - 1; i !== -1; i--){
        const goal = goalsNew[i];
        goalStrs.push(yield [[goal, 'toStr'], ctx, toStrIdents]);

        const subgoalNew = subgoal.copy();
        subgoalNew.premises = premisesNew;

        yield [[subgoalNew, 'replaceGoal'], ctx, goal, insertionIndex];

        proofNew.addSubgoal(subgoalNew);
      }

      goalStrs.reverse();

      ctx = ctx.copy();

      if(proofNew.hasSubgoal){
        ctx.proof = proofNew;
      }else{
        ctx.proof = null;
        ctx.facts = util.copyObj(ctx.facts);
        ctx.facts[proof.name] = proof.prop;

        // const ser = new O.Serializer();
        // yield [[ctx, 'ser'], ser];
        //
        // const buf = ser.getOutput();
        // ctx = yield [[Context, 'deser'], new O.Serializer(buf)];
      }

      const finalStr = goalStrs.length !== 0 ?
        goalStrs.join('\n') :
        'The subgoal is done!';

      return O.tco(ret, finalStr);
    },

    *show(){
      const exprStrs = yield [getBrackets];

      if(exprStrs.length === 0)
        throw `At least one proposition must be specified in the \`show\` directive`;

      const boolSym = yield [getMeta, 'bool', 1];

      const toStrIdents = util.obj2();
      yield [[ctx.proof.subgoal, 'toStr'], ctx, toStrIdents];

      const props = [];
      const propStrs = [];

      for(const str of exprStrs){
        let prop = yield [parser.parse, ctx, str];
        prop = yield [[prop, 'simplify'], ctx];

        yield [assertEq, prop.type, boolSym];

        props.push(prop);
        propStrs.push(yield [[prop, 'toStr'], ctx, toStrIdents]);
      }

      const propsNum = props.length;

      ctx = ctx.copy();

      const proof = ctx.proof = ctx.proof.copy();
      const subgoals = proof.subgoals = proof.subgoals.slice();
      const subgoal = proof.subgoal = proof.subgoal.copy();
      const premises = subgoal.premises = subgoal.premises.slice();

      const subgoalsNew = [];

      for(let i = 0; i !== propsNum; i++){
        const prop = props[i];

        const subgoalNew = subgoal.copy();
        yield [[subgoalNew, 'replaceGoal'], ctx, prop];

        subgoalsNew.push(subgoalNew);
        premises.push(prop);
      }

      proof.subgoals = [subgoal, ...subgoalsNew, ...subgoals.slice(1)];

      return O.tco(ret, propStrs.join('\n'));
    },

    *del(){
      const {proof} = ctx;
      const {subgoals, subgoal} = proof;
      const {premises} = subgoal;
      const premisesNum = premises.length;

      const indicesStrs = line.split(' ');
      const indicesObj = O.obj();

      if(eol()) throw `Expected at least one premise index`;

      for(const str of indicesStrs){
        const str1 = str.trim();

        if(!su.isInt(str1))
          throw `Expected a premise index, but got ${O.sf(str1)}`;

        const n = Number(str1) - 1;

        if(!(n >= 0 && n < premisesNum))
          throw `There is no premise with index ${str1}`;

        if(O.has(indicesObj, n))
          throw `Duplicate premise index ${n}`;

        indicesObj[n] = 1;
      }

      ctx = ctx.copy();

      const proofNew = ctx.proof = proof.copy();
      const subgoalsNew = proofNew.subgoals = subgoals.slice();
      const subgoalNew = proofNew.subgoal = subgoal.copy();

      const premisesNew = premises.filter((a, i) => {
        return !O.has(indicesObj, i);
      });

      subgoalNew.premises = premisesNew;
      line = '';

      return O.tco(ret, '');
    },

    *ren(){
      const {proof} = ctx;
      const {subgoals, subgoal} = proof;
      const {identsObj, identsArr, premises, goal} = subgoal;

      const name1 = yield [getIdent];

      if(!O.has(identsObj, name1))
        throw `There is no local identifier ${name2str(name1)}`;

      const name2 = yield [getIdent];
      yield [assertFree, name2];

      ctx = ctx.copy();

      const proofNew = ctx.proof = proof.copy();
      const subgoalsNew = proofNew.subgoals = subgoals.slice();
      const subgoalNew = proofNew.subgoal = subgoal.copy();

      const identNew = new Ident(name2);

      const identsObjNew = util.copyObj(identsObj);
      identsObjNew[name2] = identsObjNew[name1];
      delete identsObjNew[name1];

      const identsArrNew = identsArr.slice();
      const index = identsArrNew.indexOf(name1);

      assert(index !== -1);
      identsArrNew[index] = name2;

      subgoalNew.identsObj = identsObjNew;
      subgoalNew.identsArr = identsArrNew;

      const premisesNew = [];

      for(const prem of premises)
        premisesNew.push(yield [[prem, 'substIdentAndSimp'], ctx, name1, identNew]);

      subgoalNew.premises = premisesNew;

      const goalNew = yield [[goal, 'substIdent'], name1, identNew];
      yield [[subgoalNew, 'replaceGoal'], ctx, goalNew];

      return O.tco(ret, '');
    },

    *let(){
      const {proof} = ctx;
      const {subgoals, subgoal} = proof;
      const {identsObj, identsArr, premises, goal} = subgoal;

      const eqSym = yield [getMeta, 'eq'];

      const name = yield [getIdent];
      yield [assertFree, name];

      yield [getExact, ':'];

      const val = yield [getExpr];

      ctx = ctx.copy();

      const proofNew = ctx.proof = proof.copy();
      const subgoalsNew = proofNew.subgoals = subgoals.slice();
      const subgoalNew = proofNew.subgoal = subgoal.copy();

      const identsObjNew = util.copyObj(identsObj);
      identsObjNew[name] = [val.type, [0, []]];

      const identsArrNew = identsArr.slice();
      identsArrNew.push(name);

      subgoalNew.identsObj = identsObjNew;
      subgoalNew.identsArr = identsArrNew;

      const premisesNew = premises.slice();
      const prem = yield [[Expr.mkBinOp(eqSym, new Ident(name), val), 'simplify'], ctx];
      premisesNew.push(prem);

      subgoalNew.premises = premisesNew;

      return O.tco(ret, '');
    },

    *sub(){
      const {proof} = ctx;
      const {subgoals, subgoal} = proof;
      const {identsObj, identsArr, premises, goal} = subgoal;
      const premisesNum = premises.length;

      const eqSym = yield [getMeta, 'eq'];

      line = line.trimRight();

      const match = line.match(/^(\d+)(\+?)$/);

      if(match === null)
        throw `Expected a premise index`;

      const indexStr = match[1];

      if(!su.isInt(indexStr))
        throw `Invalid premise index`;

      const index = Number(indexStr) - 1;

      if(!(index >= 0 && index < premisesNum))
        throw `There is no premise with index ${indexStr}`;

      const keep = match[2].length !== 0;

      const prem = premises[index];
      const info = prem.getBinOp();

      if(info === null || info[0] !== eqSym)
        throw `The premise is not an equality`;

      const ident = info[1];

      if(!ident.isIdent)
        throw `LHS must be an identifier`;

      const {name} = ident;
      const exprNew = info[2];

      ctx = ctx.copy();

      const proofNew = ctx.proof = proof.copy();
      const subgoalsNew = proofNew.subgoals = subgoals.slice();
      const subgoalNew = proofNew.subgoal = subgoal.copy();

      const premisesNew = [];

      for(let i = 0; i !== premisesNum; i++){
        const prem = premises[i];

        if(i === index){
          if(keep) premisesNew.push(prem);
          continue;
        }

        premisesNew.push(yield [[prem, 'substIdentAndSimp'], ctx, name, exprNew]);
      }

      subgoalNew.premises = premisesNew;

      const goalNew = yield [[goal, 'substIdent'], name, exprNew];
      yield [[subgoalNew, 'replaceGoal'], ctx, goalNew];

      line = '';

      return O.tco(ret, '');
    },
  };

  const processLine = function*(){
    const directive = yield [getToken];
    let data;

    if(directive === null)
      throw `Missing directive`;

    if(!ctx.hasProof){
      if(!O.has(directiveFuncs, directive))
        throw `Unknown directive ${O.sf(directive)}`;

      data = yield [directiveFuncs[directive]];
    }else{
      if(!O.has(proofDirectiveFuncs, directive))
        throw `Unknown proof directive ${O.sf(directive)}`;

      const {proof} = ctx;
      assert(proof.hasSubgoal);

      data = yield [proofDirectiveFuncs[directive], proof];
    }

    yield [assertEol];

    if(ctx.hasProof)
      ctx.proof.simplify();

    return data;
  };

  const result = yield O.try(processLine);
  return O.tco(processResult, result);
};

const hasErr = () => {
  const data = O.last(linesData);
  if(data === null) return 0;

  return data.err;
};

const onKeyDown = evt => {
  const {ctrlKey, shiftKey, altKey, code} = evt;
  const flags = (ctrlKey << 2) | (shiftKey << 1) | altKey;

  const processKey = () => {
    ctrl: if(flags === 4){
      if(code === 'Tab'){
        display.nextTab(0);
        return 1;
      }

      if(code === 'KeyN'){
        display.newTab();
        return 1;
      }

      if(code === 'KeyW'){
        display.closeTab(0);
        return 1;
      }

      // if(code === 'KeyS'){
      //   O.pd(evt);
      //   save();
      //   return 1;
      // }

      return 0;
    }

    ctrlShift: if(flags === 6){
      if(code === 'Tab'){
        display.prevTab(0);
        return 1;
      }

      return 0;
    }

    return 0;
  };

  if(processKey()) return;

  display.emit('onKeyDown', evt);
};

const onKeyPress = evt => {
  display.emit('onKeyPress', evt);
};

const save = () => {
  localStorage[project] = JSON.stringify({
    str: mainEditor.lines.join('\n'),
    cx: mainEditor.cx,
    cy: mainEditor.cy,
    cxPrev: mainEditor.cxPrev,
    scrollX: mainEditor.scrollX,
    scrollY: mainEditor.scrollY,
  });
};

// const str1 = await require('./logic/1.txt');
const load = () => {
  let obj = O.obj();

  if(1/*!O.has(localStorage, project)?*/){
    if(!loadLogic) return;

    assert(logicStr !== null);

    const lines = O.sanl(logicStr);
    const cx = O.last(lines).length;
    const cy = lines.length - 1;

    obj = {
      str: logicStr,
      cx: cx,
      cy: cy,
      cxPrev: cx,
      scrollX: 0,
      scrollY: cy - 15,
    };
  }

  const {
    str,
    cx,
    cy,
    cxPrev,
    scrollX,
    scrollY,
  } = obj;

  mainEditor.cx = cx;
  mainEditor.cy = cy;
  mainEditor.cxPrev = cxPrev;
  mainEditor.scrollX = scrollX;
  mainEditor.scrollY = scrollY;

  mainEditor.setText(str);
  // mainEditor.setText(O.sanl(str1).slice(0, 30).join('\n'));
  // mainEditor.setText(str1);
};

const onResize = evt => {
  iw = O.iw;
  ih = O.ih;

  w = iw / ws | 0;
  h = ih / hs | 0;

  g.resize(iw, ih);
};

main();