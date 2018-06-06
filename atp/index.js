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

      rule.infers = Statement.parse(this, rule.infers);
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

    var ids = Object.create(null);
    var queue = target.parts(1);
    var part, stat;

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
      if(stat.id in ids) return;

      list.push([stat, rule]);
      ids[stat.id] = 1;
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

    /*var isVar = this.isVar();

    if(isVar !== stat.isVar()) return false;
    if(isVar) return this.index === stat.index;
    if(this.func !== stat.func) return false;

    var args1 = this.args;
    var args2 = stat.args;

    if(args1.length !== args2.length)
      return false;

    return args1.every((arg, index) => {
      return arg.same(args2[index]);
    });*/
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

  isVar(){
    return true;
  }

  clone(){
    return new Variable(this.index);
  }
};

class Substitution{
  constructor(arr){
    var obj = this.obj = Object.create(null);

    arr.forEach(([stat1, stat2]) => {
      var id = stat1 instanceof Statement ? stat1.id : stat1;
      obj[id] = stat2.clone();
    });
  }

  get(stat){
    var {obj} = this;
    if(stat.id in obj) return obj[stat.id].clone();
    return null;
  }
};

class Combination{
  constructor(len){
    this.arr = O.ca(len, () => 0);

    this.index = 0;
    this.max = 0;
    this.last = true;
  }

  next(){
    var {arr} = this;

    if(this.last){
      this.last = false;
      this.max++;
      this.index = 0;

      arr.fill(0);
      arr[0] = max;
    }else{
      var len = arr.length;

      for(var i = 0; i < len; i++){
        if(arr[i] !== max){
          arr[i]++;
          break;
        }

        arr[i] = 0;
      }

      if(i === len - 1 && arr[i] === this.max)
        this.last = true;
    }

    return arrPrev;
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