'use strict';

const O = require('../framework');
const debug = require('../debug');
const {Expression} = require('./expressions.js');
const LogicalSystem = require('./logical-system.js');
const {assert, err} = require('./assert.js');

const DEBUG = 0;

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

    function logStats(sts=stats){
      var str = sts.map(stat => {
        if(stat instanceof Assumption)
          return stat.toString();

        return stat2str(stat);
      }).join('\n');

      log(`${str}\n`);
    }
  }
};

class Assumption{
  constructor(stats){
    var asmpStat = stats[0];

    stats = stats.filter(stat => {
      return !(stat instanceof Assumption);
    });

    this.stats = stats.map(stat => {
      var infer = new LogicalSystem.Inference(asmpStat, stat);
      infer[INDEX_SYMBOL] = [asmpStat[INDEX_SYMBOL], stat[INDEX_SYMBOL]];

      return infer;
    });
  }

  toString(){
    var str = this.stats.map(expr => {
      return `  ${stat2str(expr)}`;
    }).join('\n');

    return `[\n${str}\n]`;
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

Prover.Assumption = Assumption;
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

  var indexPrev = sts.findIndex(stat => {
    return stat.eq(expr);
  });

  if(indexPrev !== -1)
    return new AppliedRule(2, indexPrev);

  var maxVal = sts.length - 1;

  if(DEBUG){
    logStats(sts);
    debug(`STATEMENT: ${expr.clone()}`);
    log.inc();
  }

  var match = null;

  rules.some(rule => {
    if(DEBUG){
      debug(`ATTEMPTING RULE: ${rule2str(rule)}`);
      log.inc();
    }

    var premises = rule[0];
    var len = premises.length;

    var found = rule[1].some(conclusion => {
      if(DEBUG){
        debug(`ATTEMPTING CONCLUSION: ${conclusion}`);
        log.inc();
      }

      var substs = conclusion.findSubsts(expr);

      if(substs === null){
        if(DEBUG) log.dec();
        return false;
      }

      if(len === 0){
        match = [rule, [], substs];
        log.dec();
        return true;
      }

      var perms = O.ca(len, () => 0);

      do{
        if(DEBUG){
          debug(`STATS: ${perms.map(index => stat2str(sts[index], 0)).join(',')}`);
          log.inc();
        }

        var eqs = premises.map((premise, index) => {
          return [premise, sts[perms[index]]];
        });

        eqs.push([conclusion, expr]);

        var substs = Expression.findSubsts(eqs);

        if(substs !== null){
          if(DEBUG){
            log.dec();
            debug('FOUND!');
            log.dec();
          }

          var stsPremises = perms.map(index => {
            return sts[index][INDEX_SYMBOL];
          });

          match = [rule, stsPremises, substs];

          return true;
        }

        if(DEBUG) log.dec();
      }while(nextPerm(perms, maxVal));

      if(DEBUG) log.dec();
    });

    if(DEBUG){
      debug(`FOUND: ${found}`);
      log.dec();
    }

    return found;
  });

  var appliedRule;

  if(match === null) appliedRule = new AppliedRule(0);
  else appliedRule = new AppliedRule(3, ...match);

  if(DEBUG){
    debug(`APPLIED RULE: ${appliedRule}`);
    log.dec();
  }

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