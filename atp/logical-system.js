'use strict';

const vm = require('vm');
const O = require('../framework');
const debug = require('../debug');
const expressions = require('./expressions.js');
const {assert, err} = require('./assert.js');

const DEBUG = 0;

const INFERENCE_SYMBOL = '--->';
const RESERVED_SYMBOLS = [INFERENCE_SYMBOL, ',', '?'];

const TIMEOUT = 3e3;

class LogicalSystem{
  constructor(ctors, rules){
    this.ctors = ctors;

    this.vars = ctors.filter(({prototype: proto}) => proto.isVar());
    this.consts = ctors.filter(({prototype: proto}) => proto.isConst());
    this.ops = ctors.filter(({prototype: proto}) => proto.isOp());

    this.rules = rules;
  }

  static from(str){
    var sections = str.trim().split(/\r\n\r\n|\r\r|\n\n/)
    var data = O.obj();

    sections.forEach(section => {
      var lines = O.sanl(section.trim()).map(line => line.trim());
      assert(lines.length !== 0, 'Missing section name');

      var name = lines.shift();
      var len = lines.length;

      asrt(len !== 0, 'Missing content')
      asrt(!(name in data), 'Duplicate section')

      switch(name){
        case 'space':
          asrt(len === 1, 'Expected exactly 1 string')

          var space = evalJs(lines[0], name, 0);
          asrt(typeof space === 'string', 'Space must be a string')

          data.space = space;
          break;

        case 'const':
          asrt('space' in data, 'Section "space" must be defined before section "const"')
          asrt(len === 3, 'Expected exactly 3 functions')

          var [ctr, from, is] = lines.map((line, index) => {
            return evalJs(line, name, index);
          });

          data.const = createConstant(ctr, from, is);
          break;

        case 'var':
          asrt('space' in data, 'Section "space" must be defined before section "var"')
          asrt(len === 3, 'Expected exactly 3 functions')

          var [ctr, from, is] = lines.map((line, index) => {
            return evalJs(line, name, index);
          });

          data.var = createVariable(ctr, from, is);
          break;

        case 'operations':
          asrt('space' in data, 'Section "space" must be defined before section "operations"')

          var space = data.space;
          var ctors = [];

          lines.forEach((line, index) => {
            line = line.split(/\s+/);

            check(line.length >= 5, 'Expected at least 5 parameters');
            check(line.length <= 6, 'Expected no more than 6 parameters');

            var [name, op, type, priority, group, parens=null] = line;

            check(/[a-z]+(?:\-[a-z]+)*/.test(name), 'Invalid operation name');

            name = name.split('-').map(word => {
              return O.capitalize(word);
            }).join('');

            asrt(!RESERVED_SYMBOLS.includes(op), `Operator "${op}" is reserved`);

            switch(type){
              case 'unary': type = 1; break;
              case 'binary': type = 2; break;
              default: e('Operation type may only be "unary" or "binary"'); break;
            }

            var isBinary = type === 2;

            check(priority == (priority | 0), 'Invalid priority');
            priority = priority | 0;
            check(priority >= 0, 'Priority must be non-negative');

            switch(group){
              case 'left': group = 0; break;
              case 'right': group = 1; break;
              default: e('Operation group may only be "left" or "right'); break;
            }

            if(parens === null){
              parens = false;
            }else{
              check(parens === 'parens', `Unknown parameter "${parens}"`);
              parens = true;
            }

            var ctor = createOperation(name, op, type, priority, group, parens, space);

            ctors.forEach(ctor => {
              var proto = ctor.prototype;

              check(ctor.name !== name, `Operation "${name}" already exists`);
            });

            ctors.push(ctor);

            function check(bool, msg){
              asrt(bool, msg, index);
            }

            function e(msg){
              err(msg, name, index);
            }
          });

          data.operations = ctors;
          break;

        case 'rules':
          [
            'const',
            'var',
            'operations',
          ].forEach(sect => {
            asrt(sect in data, `Section "${sect}" must be defined before section "rules"`);
          });

          var ctors = [
            Axiom,
            Inference,
            Comma,

            data.const,
            data.var,

            ...data.operations,
          ];

          var rules = lines.map((line, index) => {
            var spMatch = line.match(/\s/);
            assert(spMatch !== null, 'Expected exactly 2 parameters: "alias" and "expression"', name, index);

            var spIndex = spMatch.index;
            var alias = line.substring(0, spIndex);
            var exprStr = line.substring(spIndex);

            try{
              var expr = expressions.Expression.parse(ctors, exprStr);
            }catch(e){
              err(e.message, name, index);
            }

            expr.alias = alias;

            return expr;
          });

          data.rules = rules;
          break;

        default:
          err('Unknown section name', name);
          break;
      }

      function asrt(bool, msg, line){
        assert(bool, msg, name, line);
      }
    });

    assert('rules' in data, 'Missing section "rules"');

    var rules = data.rules.map(rule => {
      assert(rule.isMeta() && rule.isInfer(), `Missing top-level inference meta-symbol in rule "${rule}"`);

      var opnds = rule.opnds;
      var isBinary = rule.isBinary();

      if(isBinary)
        checkOpnd(opnds[0]);

      var rhs = opnds[isBinary ? 1 : 0];

      rhs.iterate(expr => {
        assert(!(expr.isMeta() && expr.isInfer()), `Inference meta-symbol is not allowed on the RHS`);
      });

      checkOpnd(rhs);

      var premises = isBinary ? flatten(opnds[0]) : [];
      var conclusions = flatten(rhs);

      var ruleNew = [premises, conclusions];
      ruleNew.alias = rule.alias;

      return ruleNew;
    });

    rules.toString = () => {
      return LogicalSystem.stringifyRules(rules);
    };

    var ctors = [
      data.const,
      data.var,
      ...data.operations,
    ];

    return new LogicalSystem(ctors, rules);

    function flatten(opnd){
      var exprs = [];

      while(opnd.isMeta() && opnd.isComma()){
        var opnds = opnd.opnds;
        exprs.unshift(opnds[1]);
        opnd = opnds[0];
      }

      exprs.unshift(opnd);

      return exprs;
    }

    function checkOpnd(opnd){
      if(opnd.isMeta() && opnd.isComma()){
        var [opnd1, opnd2] = opnd.opnds;

        if(opnd2.isMeta()){
          assert(!opnd2.isComma(), `Righ comma meta-operator evaluation in "${opnd}" is not allowed`);
          checkNonMeta(opnd2);
        }

        checkOpnd(opnd1);
      }else{
        checkNonMeta(opnd);
      }
    }

    function checkNonMeta(opnd){
      opnd.iterate(expr => {
        if(expr === opnd) return;
        assert(!expr.isMeta(), `Nested meta-operation in "${opnd}" is not allowed`);
      });
    }
  }

  static stringifyRules(rules){
    return rules.map(rule => {
      return rule.map(arr => {
        return arr.map(expr => {
          return `[${expr}]`;
        }).join(' , ');
      }).join(' ---> ');
    }).join('\n');
  }
};

class Axiom extends expressions.UnaryOperation{
  constructor(opnd){
    super(opnd);
  }

  op(){ return INFERENCE_SYMBOL; }
  priority(){ return 10; }
  group(){ return 1; }

  isMeta(){ return true; }
  isInfer(){ return true; }
  isComma(){ return false; }
};

class Inference extends expressions.BinaryOperation{
  constructor(opnd1, opnd2){
    super(opnd1, opnd2);
  }

  op(){ return INFERENCE_SYMBOL; }
  priority(){ return 10; }
  group(){ return 0; }
  forceParens(){ return true; }

  isMeta(){ return true; }
  isInfer(){ return true; }
  isComma(){ return false; }
};

class Comma extends expressions.BinaryOperation{
  constructor(opnd1, opnd2){
    super(opnd1, opnd2);
  }

  op(){ return ','; }
  priority(){ return 12; }
  group(){ return 0; }

  isMeta(){ return true; }
  isInfer(){ return false; }
  isComma(){ return true; }
};

LogicalSystem.Axiom = Axiom;
LogicalSystem.Inference = Inference;
LogicalSystem.Comma = Comma;

module.exports = LogicalSystem;

function createConstant(ctr, from, is){
  return createLiteral(expressions.Constant, ctr, from, is);
}

function createVariable(ctr, from, is){
  return createLiteral(expressions.Variable, ctr, from, is);
}

function createLiteral(baseCtor, ctr, from, is){
  var ctor = class extends baseCtor{
    constructor(index){
      super(index, ctr(index));
    }

    static from(s){ return new ctor(from(s)); }
    static is(s){ return is(s); }
  };

  return ctor;
}

function createOperation(name, op, type, priority, group, forceParens, space){
  var es = expressions;
  var baseCtor = type === 1 ? es.UnaryOperation : es.BinaryOperation;

  priority = (priority << 1) + 20;

  var ctor = {
    [name]: class extends baseCtor{
      constructor(opnd1, opnd2){
        super(opnd1, opnd2);
      }

      op(){ return op; }
      priority(){ return priority; }
      group(){ return group; }
      forceParens(){ return forceParens; }
      space(){ return space; }
    }
  }[name];

  return ctor;
}

function evalJs(code, section, line){
  var ctx = O.obj();
  vm.createContext(ctx);

  try{
    return vm.runInContext(code, ctx, {
      displayErrors: true,
      timeout: TIMEOUT,
    });
  }catch(e){
    err(e.message, section, line);
  }
}