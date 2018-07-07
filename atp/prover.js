'use strict';

const O = require('../framework');
const {Expression} = require('./expressions.js');
const LogicalSystem = require('./logical-system.js');
const {assert, err} = require('./assert.js');

const INDEX_SYMBOL = Symbol('index');

class Prover{
  constructor(system){
    this.system = system;
  }

  static from(str){
    var system = LogicalSystem.from(str);
    return new Prover(system);
  }

  checkProof(str){
    var {system} = this;
    var {ctors, rules} = system;

    var stats = [];
    var appliedRules = [];

    var indents = [0];
    var asmpIndices = [];

    var lastIndent = 0;
    var nextIndent = false;

    var lines = O.sanl(str);

    lines.forEach((line, index) => {
      var indent = line.match(/^\s*/)[0].length;
      var closeAsmp = false;

      if(indent === lastIndent){
        closeAsmp = nextIndent;
      }else if(indent > lastIndent){
        asrt(nextIndent, 'Indented expression is not allowed at this place');

        indents.push(indent);
        lastIndent = indent;
      }else{
        indents.pop();

        lastIndent = indents[indents.length - 1];
        asrt(indent === lastIndent, 'Unexpected indentation level');

        closeAsmp = true;
      }

      if(closeAsmp){
        var i = asmpIndices.pop();

        
        var asmp = new Assumption(stats.splice(i));

        stats.push(asmp);
      }

      line = line.substring(indent);
      nextIndent = line[0] === '?';

      if(nextIndent){
        line = line.substring(1);
        asmpIndices.push(stats.length);
      }

      try{
        var expr = Expression.parse(ctors, line);
      }catch(e){
        er(e.message);
      }

      expr[INDEX_SYMBOL] = index + 1;

      var vari = expr.find(expr => expr.isVar());
      asrt(vari === null, 'Variables are not allowed');

      var appliedRule = !nextIndent ? findAppliedRule(stats, rules, expr) : new AppliedRule(1);
      appliedRules.push(appliedRule);

      stats.push(expr);

      function asrt(bool, msg){
        assert(bool, getMsg(msg));
      }

      function er(msg){
        err(getMsg(msg));
      }

      function getMsg(msg){
        return `${msg} (line ${index + 1})`;
      }
    });

    return new Proof(lines, appliedRules);
  }
};

class AppliedRule{
  constructor(type, rule=null, premises=null, substs=null){
    this.type = type;
    this.rule = rule;
    this.premises = premises;
    this.substs = substs;
  }

  toString(){
    var {type, rule, premises, substs} = this;

    if(type === 0) return 'Invalid step';
    if(type === 1) return 'Assumption';
    if(type === 2) return `Step ${rule}`;

    if(type === 3){
      var aliasStr = rule.alias;

      var premisesStr = premises.map(premise => {
        return index2str(premise);
      }).join(',');

      return `${aliasStr} (${premisesStr})`;
    }

    return 'Unknown error';
  }
};

class Proof{
  constructor(stats, rules){
    this.stats = stats;
    this.rules = rules;
  }

  toString(){
    var {stats, rules} = this;

    var spaceSize = 2;
    var space = ' '.repeat(spaceSize);

    var maxLen = stats.reduce((maxLen, stat) => {
      return Math.max(String(stat).length, maxLen);
    }, 0);

    var str = stats.map((stat, index) => {
      var rule = rules[index];

      var statStr = String(stat).padEnd(maxLen);
      var ruleStr = String(rule);

      return `${statStr}${space}${ruleStr}`;
    }).join('\n');

    return str;
  }
};

Prover.AppliedRule = AppliedRule;
Prover.Proof = Proof;

module.exports = Prover;

function findAppliedRule(stats, rules, expr){
  var sts = [];

  stats.forEach(stat => {
    if(stat instanceof Assumption){
      stat.stats.forEach(stat => sts.push(stat));
    }else{
      sts.push(stat);
    }
  });

  var statPrev = sts.find(stat => stat.eq(expr));
  if(statPrev) return new AppliedRule(2, statPrev[INDEX_SYMBOL]);

  var match = null;

  rules.some((rule, ruleIndex) => {
    var [premises, concls] = rule;

    return concls.some((concls, conclIndex) => {
      var substs = expr.findSubsts(concl);
      if(substs === null) return false;

      return premises.every(premise => {
      });
    });
  });

  var appliedRule;

  if(match === null) appliedRule = new AppliedRule(0);
  else appliedRule = new AppliedRule(3, ...match);

  return appliedRule;
}

function nextPerm(arr, max){
  var len = arr.length;

  for(var i = 0; i !== len; i++){
    if(arr[i] !== max){
      arr[i]++;
      return true;
    }

    arr[i] = 0;
  }

  return false;
}

function stat2str(stat, wholeStat=true){
  var index = index2str(stat[INDEX_SYMBOL]);

  if(!wholeStat) return index;
  return`[${index}] ${stat}`;
}

function index2str(index){
  if(index instanceof Array) return index.join('-');
  return String(index);
}

function rule2str(rule){
  return LogicalSystem.stringifyRules([rule]);
}