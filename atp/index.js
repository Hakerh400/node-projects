'use strict';

var O = require('../framework');

const CHAR_CODE_A = 'a'.charCodeAt(0);

class Atp{
  constructor(syntax, rules){
    this.syntax = syntax;
    this.rules = this.parseRules(rules);
  }

  parseRules(rules){
    rules.forEach((rule, index) => {
      var {premises} = rule;

      rule.index = index;

      premises.forEach((premise, index) => {
        premises[index] = Statement.parse(this, premise);
      });

      premises.vars = Variable.union(premises);
      rule.infers = Statement.parse(this, rule.infers);

      rule.pvars = Variable.diff(premises.vars, rule.infers.vars);
      rule.ivars = Variable.diff(rule.infers.vars, premises.vars);
    });

    return rules;
  }

  getFunc(char){
    return this.syntax.findIndex(func => {
      return func.symbol === char;
    });
  }

  prove(stat){
    var list = [];
    list.toString = () => str;

    stat = Statement.parse(this, stat);
    var gen = this.statGenerator(list, stat);

    while(!gen.next().done);

    var lens = O.ca(3, () => 0);

    var list2 = list.map(([stat, rule], index) => {
      var indexStr = String(index + 1);
      var len = indexStr.length;
      if(len > lens[0]) lens[0] = len;

      var statStr = stat.toString(this);
      var len = statStr.length;
      if(len > lens[1]) lens[1] = len;

      var ruleStr = this.rules[rule[0]].name;
      if(rule.length !== 1) ruleStr += ` (${rule.slice(1).map(a => a + 1).join(', ')})`;
      var len = ruleStr.length;
      if(len > lens[2]) lens[2] = len;

      return [indexStr, statStr, ruleStr];
    });

    var border = `+${lens.map(len => {
      return '-'.repeat(len + 2);
    }).join('+')}+`;

    var str = `${border}\n${list2.map(line => {
      return `| ${line.map((item, index) => {
        return item.padEnd(lens[index], ' ');
      }).join(' | ')} |`;
    }).join('\n')}\n${border}`;

    return list;
  }

  *statGenerator(list, target){
    var {rules} = this;
    var rulesNum = rules.length;

    var listIds = Object.create(null);
    var queue = target.parts(true);
    var part, stat;

    //////////////////////////////////////////////////////////////////////////////////////////
    var parts = target.parts(true);
    var stat = rules[2].infers;
    var comb = new Combination(stat.vars, parts[0]);
    var i = 0;

    while(1){
      comb.next();
      add(stat.subst(comb.subst), [2]);

      if(comb.transit){
        if(++i === parts.length) break;
        comb.add(parts[i]);
      }
    }
    return;
    //////////////////////////////////////////////////////////////////////////////////////////

    while(queue.length !== 0){
      part = queue.shift();

      for(var i = 0; i < rulesNum; i++){
        var rule = rules[i];
        stat = rule.infers;

        stat = stat.subst(new Substitution([
          [part, Statement.parse(this, 'a')],
        ]));

        add(stat, [i]);
      }
    }

    return stat;

    function add(stat, rule){
      if(stat.id in listIds) return;

      list.push([stat, rule]);
      listIds[stat.id] = 1;
    }
  }
};

module.exports = Atp;

class Statement{
  constructor(func=-1, args=[], id=null, vars=[]){
    this.func = func;
    this.args = args;
    this.id = id;
    this.vars = vars;
  }

  static parse(atp, str){
    var {syntax} = atp;

    var parsed = null;
    var stats = [];

    str.split('').forEach(char => {
      switch(char){
        case '(':
          stats.push(new Statement());
          break;

        case ')':
          var f = stats.pop();

          if(stats.length !== 0){
            stats[stats.length - 1].args.push(f);
          }else{
            parsed = f;
          }
          break;

        case ' ': break;

        default:
          var index = atp.getFunc(char);

          if(index === -1){
            var vari = new Variable(char2index(char));

            if(stats.length !== 0){
              stats[stats.length - 1].args.push(vari);
            }else{
              parsed = vari;
            }
          }else{
            stats[stats.length - 1].func = index;
          }
          break;
      }
    });

    return parsed.update();
  }

  isVar(){
    return false;
  }

  clone(){
    var args = this.args.map(stat => stat.clone());
    var stat = new Statement(this.func, args, this.id, this.vars.slice());

    return stat;
  }

  subst(subst){
    var v = subst.get(this);

    if(v !== null)
      return v;

    if(this.isVar())
      return this.clone();

    var args = this.args.map(arg => arg.subst(subst));
    var stat = new Statement(this.func, args);

    return stat.update();
  }

  same(stat){
    return this.id === stat.id;
  }

  parts(sort=false, parts=null){
    if(parts === null){
      parts = [];
      parts.ids = Object.create(null);
    }

    var id = this.id;
    if(id in parts.ids) return parts;

    var stat = this.clone();
    parts.push(stat);
    parts.ids[id] = 1;

    if(!stat.isVar()){
      stat.args.forEach(arg => {
        arg.parts(false, parts);
      });
    }

    if(sort)
      sortParts(parts);

    return parts;
  }

  update(){
    this.updateId();
    this.updateVars();

    return this;
  }

  updateId(){
    if(this.isVar())
      return this.id = String(this.index);

    return this.id = `[${this.func},${this.args.map((stat, index) => {
      return stat.updateId();
    }).join(',')}]`;
  }

  updateVars(){
    var {vars} = this;
    vars.length = 0;

    if(this.isVar()){
      vars.push(this.index);
      return vars;
    }

    this.args.forEach(arg => {
      arg.updateVars().forEach(vari => {
        if(!vars.includes(vari))
          vars.push(vari);
      });
    });

    O.sortAsc(vars);

    return vars;
  }

  toString(atp){
    if(this.isVar())
      return index2char(this.index);

    var func = atp.syntax[this.func];
    var str;

    switch(func.notation){
      case 'infix':
        str = `${this.args[0].toString(atp)} ${func.symbol} ${this.args[1].toString(atp)}`;
        break;
    }

    return `(${str})`;
  }
};

class Variable extends Statement{
  constructor(index){
    super(null, null, String(index), [index]);

    this.index = index;
  }

  static union(arr){
    var vars = [];

    arr.forEach(vs => {
      if(vs instanceof Statement)
        vs = vs.vars;

      vs.forEach(vari => {
        if(!vars.includes(vari))
          vars.push(vari);
      });
    });

    return O.sortAsc(vars);
  }

  static diff(v1, v2){
    var vars = [];

    v1.forEach(v => {
      if(!v2.includes(v))
        vars.push(v);
    });

    return O.sortAsc(vars);
  }

  isVar(){
    return true;
  }

  clone(){
    return new Variable(this.index);
  }
};

class Substitution{
  constructor(arr=[]){
    var obj = this.obj = Object.create(null);

    arr.forEach(([stat, subst]) => {
      this.set(stat, subst);
    });
  }

  set(stat, subst){
    var id = stat instanceof Statement ? stat.id : stat;
    this.obj[id] = subst.clone();
  }

  get(stat){
    var {obj} = this;
    var id = stat instanceof Statement ? stat.id : stat;
    if(id in obj) return obj[id].clone();
    return null;
  }
};

class Combination{
  constructor(stats, init, includesSubst=true){
    this.includesSubst = includesSubst;

    this.len = stats.length;
    this.stats = stats.slice();
    this.substs = [init.clone()];
    
    this.arr = O.ca(this.len, () => 0);
    this.subst = includesSubst ? new Substitution() : null;

    this.max = 0;
    this.first = true;
    this.transit = true;
  }

  add(subst){
    this.substs.push(subst.clone());
  }

  next(){
    if(this.first){
      this.first = false;
      return this.update();
    }

    var {len, arr, max} = this;

    if(this.transit){
      this.transit = len !== 0;
      this.max++;

      arr.fill(0);
      arr[0] = this.max;
    }else{
      for(var i = 0; i !== len; i++){
        if(arr[i] !== this.max){
          arr[i]++;
          break;
        }

        arr[i] = 0;
      }

      checkMax: {
        for(var i = 0; i !== len; i++){
          if(arr[i] === max)
            break checkMax;
        }

        arr[0] = max;
      }

      checktransit: if(i === 0 && arr[0] === max){
        for(var i = 1; i !== len; i++){
          if(arr[i] !== max)
            break checktransit;
        }

        this.transit = true;
      }
    }

    return this.update();
  }

  update(){
    if(!this.includesSubst) return this;
    var {len, stats, substs, arr, subst} = this;

    for(var i = 0; i !== len; i++)
      subst.set(stats[i], substs[arr[i]]);

    return this;
  }
};

function sortParts(parts){
  return parts.sort((stat1, stat2) => {
    var f1 = stat1.isVar();
    var f2 = stat2.isVar();

    if(f1 && f2){
      if(stat1 < stat2) return -1;
      return 1;
    }

    if(f1 && !f2) return -1;
    if(!f1 && f2) return 1;

    var id1 = stat1.id;
    var id2 = stat2.id;

    if(id1.length < id2.length) return -1;
    if(id1.length > id2.length) return 1;
    if(id1 < id2) return -1;
    return 1;
  });
}

function char2index(char){
  return char.charCodeAt(0) - CHAR_CODE_A;
}

function index2char(index){
  return String.fromCharCode(index + CHAR_CODE_A);
}