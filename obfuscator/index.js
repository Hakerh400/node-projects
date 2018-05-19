'use strict';

var fs = require('fs');
var O = require('../framework');

const DEBUG = 0;
const SHUFFLE = 1;
const ONLOAD = 0;

const MAX_LINE_LEN = 80;
const NEW_LINE = '\r\n'

var reg1 = /[a-zA-Z]/;
var reg2 = /[a-zA-Z0-9]/;

var consoles = [];
var varMap = null;

var opCodes = [
  /* a */ [0x00, 'call', (a, b) => r(a, b)],
  /* b */ [0x01, 'method', (a, b, c) => r(a, p(a, b), c)],
  /* c */ [0x02, 'read', a => m.a[a]],
  /* d */ [0x03, 'write', (a, b) => m.a[b] = a, true],
  /* e */ [0x04, 'clone', () => C(m.b)],
  /* f */ [0x05, 'prop', (a, b) => a[p(a, b)]],
  /* g */ [0x06, 'update', (a, b, c) => a[p(a, b)] = c, true],
  /* h */ [0x07, 'array', () => []],
  /* i */ [0x08, 'push', (a, b) => (a[s(14)](b),a)],
  /* j */ [0x09, 'pop', a => a, true],
  /* k */ [0x0A, 'swap', (a, b) => [m[b], m[a]] = [(m = m.b)[a = C(m,s) - a], m[b = C(m,C) - b]], true],
  /* l */ [0x0B, 'typeof', a => typeof(a)],
  /* m */ [0x0C, 'get', a => C(m.L)[a]],
  /* n */ [0x0D, 'set', (a, b) => C(m.L)[b] = a, true],
  /* o */ [0x0E, 'if', (a, b, c) => a && r(b, c)],
  /* p */ [0x0F, 'else', (a, b, c, d, e) => a ? r(b, c) : r(d, e)],
  /* q */ [0x10, 'tern', (a, b, c) => a ? b : c],
  /* r */ [0x11, 'minus', a => -a],
  /* s */ [0x12, 'not', a => !a],
  /* t */ [0x13, 'neg', a => ~a],
  /* u */ [0x14, 'while', (a, b) => {while(O.j = r(a, b)); return(O.j)}],
  /* v */ [0x15, 'func', a => (...b) => r(s.t[a], b)],
  /* w */ [0x16, 'hash', a => h(a)],
  /* x */ [0x17, 'machine', () => m.d],
];

var strings = [
  /* 00 */ 'return(',
  /* 01 */ 'this',
  /* 02 */ 'length',
  /* 03 */ 'abcdef',
  /* 04 */ 'Object',
  /* 05 */ 'getOwnPropertyNames',
  /* 06 */ 'reduce',
  /* 07 */ '...',
  /* 08 */ 'getPrototypeOf',
  /* 09 */ 'constructor',
  /* 10 */ 'split',
  /* 11 */ 'join',
  /* 12 */ 'map',
  /* 13 */ 'indexOf',
  /* 14 */ 'push',
  /* 15 */ 'find',
  /* 16 */ 'repeat',
  /* 17 */ 'slice',
  /* 18 */ 'match',
  /* 19 */ 'splice',
  /* 20 */ 'unshift',
  /* 21 */ 'includes',
  /* 22 */ 'pop',
  /* 23 */ 'var',
];

var jsOps = [
  '+', '-', '*', '/',
  '%', '|', '&', '^',
  '<', '>',
];

module.exports = {
  obfuscate,
};

function obfuscate(src){
  global.indent = 0;

  global.log = (...a) => {
    fs.writeSync(process.stdout.fd, ' '.repeat(indent << 1));
    console.log(...a);
    return a[a.length - 1];
  };

  global.format = (a, b=0) => {
    var str = 'CIRCULAR';

    try{
      str = a&&a.map?'['+a.map(a=>format(a, b + 1))+']':a&&a.includes?'"'+a+'"':a+'';
    }catch(e){
      if(b >= 2)
        throw e;
    }

    return str;
  };

  global.wait = () => {
    var buff = Buffer.alloc(2);
    fs.readSync(process.stdin.fd, buff, 0, 2);
    if(buff.toString() !== '\r\n') process.exit(1);
  };

  var out = ``;
  out += `var[h,p,O,M,R,C]=(Z=>Z(Z))((Z,\n`;
  out += `e=[0x${Buffer.from(O.ca(4, () => O.rand(256))).toString('hex')}],`;
  out += `s=a=>${arr2str(strings, 1)}[a|0],\n`;
  out += `f=a=>s[s(9)](s(23)+\`\${({}+f)[7]}r=\${1/a?s(a):a};\${s()}r)\`)(f),\n`;
  out += `m={a:[f(1)],b:N=N[s(17)](1),c:[],L:[]},\n`;
  out += `r=f((((a,b,c,{m,M,k,v}=r)=>c||1/c?a[b](l(c)):b||1/b?1/a?r(v.t[a],b):M[v(21)](a)?(`;
    out += `m[v(14)](r(b)),M=v.f(m.u,k)+1,k(a),m.u[v(2)]=M,[v.f(m)[0],m[v(22)]()][0]`;
    out += `):a(l(b)):[l(a)])+[])[s(10)]\`l\`[s(11)](s(7)+\`r.j\`)),\n`;
  out += `I=(a,b)=>r([b][s(9)](a))[s(12)]((a,c)=>b(c)),`;
  out += `S=(S=>I(1<<8,i=>f(\`'\\\\x\${S(i>>4)}\${S(i&15)}'\`)))(a=>a>9?s(3)[a-10]:a,r.j=a=>a[s(21)]?a:[a]),\n`;
  out += `A=a=>S[s(13)](a[0]),\n`;
  out += `F=a=>S[a&255],\n`;
  out += `B=a=>r(a==Z?a+B:a+(B.a||(B.a=B(Z))))[s(6)]((a,b)=>b[s(18)](s(7)[0])?A(b)+(a<<6)+(a<<16)-a|0:a,0)\n`;
  out += `)=>[`;
  out += `a=>I(4,(i,j=(a>>(i<<3))&255)=>F(i&&(j&64)?j%10+48:j%26+(j&128?65:97)),a=B(\`\${C(a,h)+1?a:''}\`))[s(11)]\`\`,\n`;
  out += `(a,b=a,c=m.a[0])=>m.c[b]||c[s(4)][s(5)](a=a!=p.m?a:e)[s(15)](a=>h(a)==b&&(m.c[b]=a,1))||(a!=e?p(c[s(4)][s(8)](a),b):b)`;

  out += `,\n`;
  out += `[${opCodes.map(op => {
    var func = op[2];
    var pop = op[3] === true;
    var str = `${func}`.replace(/ /g, '');

    if(str[0] === '(' && str[2] === ')')
      str = `${str[1]}${str.slice(3)}`;

    if(pop){
      var char;

      if(str[0] === '(') char = str[1];
      else char = str[0];

      str = str.replace(/(?:^|[^\.])([a-zA-Z0-9]+)/g, (match, c) => {
        if(c !== char) return match;
        return match.toUpperCase();
      });
    }

    return str;
  }).join(',')}]\n`;

  out += `,\n`;
  out += `((P,T)=>(a,b=-1,d,v=0,e='',`;
  out += `U=(i,c)=>(d+=i,d=A(d[A(d[1])-40?1:2]),d=(d>64&d<91)*2|(d=F(d))=='m'|d=='M',c=m.b[s(19)](C(m.b,s)-C(i,p)+d%2),d&1&&c[s(20)](m),c=r(i,c),d&2||P(c))`;
  out += `)=>r(a+[N.a])[s(12)]((c,i)=>i>2&(i=A(c))>32&&(`;
  if(DEBUG){
    out += `(`;
    out += `log('SLICE:  '+h('slice')),`;
    out += `log('GLOBAL: '+format(m.a)+''),`;
    out += `log('LOCAL:  '+format(m.L)+''),`;
    out += `log('STACK:  '+format(m.b)+' '+c+' \\x76:'+v),`;
    out += `wait()`;
    out += `),`;
  }
  out += `d=(i>64&i<91)*2|i>96&i<123,b+1&&(d||1/c)?C(b+=c,M)-3||(P(b),b=-1):1/c?P(c|0):v?`;
  out += `d?--v||(U(M[e]||(M[e]=f((T+[])[s(10)]\`+\`[s(11)](e)))),e=''):v-1||(e+=c)`;
  out += `:d&2?`;
  out += `i-65?v=1:b=''`;
  out += `:d&1?`;
  out += `U(O[i-97])`;
  out += `:0)).a)(a=>m.b[s(14)](a),(a,b)=>a+b)`;

  out += `,\n`;
  out += `a=>(s.f=C,s.t=a,(m.L.u=m.b,r).M=a)[r.m=(m.d=[m.a, m.L, m.b],m).L,s(2)]&&r(a[r.k=M,r.v=s,0],m.a)`;
  
  out += `,\n`;
  out += `(a,b)=>[b,b=a[s(2)]-1][0]?b:a[b]`;

  out += `])`;
  checkCode();

  while(/\r\n|\r|\n/.test(out)){
    out = out.replace(/(^|[\s\S])(?:\r\n|\r|\n)([\s\S]|$)/, (a, b, c) => {
      var char = '';
      if(reg2.test(b) && reg2.test(c)) char = ' ';
      return `${b}${char}${c}`;
    });
  }

  varMap = O.ca(26, i => i);
  if(SHUFFLE) varMap = O.shuffle(varMap);
  out = out.replace(/\\x/g, '\x00');

  out = out.replace(/[a-zA-Z0-9]+/g, ident => {
    if(ident.length !== 1 || !reg1.test(ident))
      return ident;

    return getVar(ident);
  });

  out = out.replace(/\x00/g, '\\x');
  checkCode();

  out = out.replace(/.{3}\=\>(\[[^\]]*\])[^\=].{4}/, (match, origArr) => {
    var origFunc = match[0];
    var origArg = match[2];

    var arr = new Function(`return ${origArr};`)();
    var chars = O.shuffle([...arr.join('')].filter((a, b, c) => c.indexOf(a) === b));
    var str = '';

    var parens = [];
    var argsNum = O.rand(3) + 2;
    var args = [];

    str += '(';
    for(var i = 0; i < argsNum; i++){
      do{
        var c = randLetter();
      }while(args.includes(c));

      var index = chars.indexOf(c);
      if(index !== -1) chars.splice(index, 1);

      if(i !== 0) str += ',';
      str += c;

      args.push(c);
    }
    str += `)=>${getLetter()}`;

    while(chars.length !== 0){
      var c;

      if(O.rand(4) === 0) c = randLetter();
      else c = chars.shift();

      var newParen = O.rand(parens.length + 2) === 0;

      if(!newParen || O.rand(2) === 0){
        var op;

        if(parens.length !== 0 && O.rand(4) === 0) op = ',';
        else op = O.randElem(jsOps);

        str += op;
      }

      if(newParen){
        var type = O.rand(2);
        parens.push(type);
        str += '(['[type];
      }

      if(reg2.test(c)){
        str += c;
      }else if(jsOps.includes(c)){
        str += `${randLetter()}${c}${randLetter()}`;
      }else{
        switch(c){
          case '(': str += randLetter(); break;
          case '.': str += `${randLetter()}.${randLetter()}`; break;

          default:
            throw new TypeError(`Unsupported character \`${c}\``);
            break;
        }
      }

      if(parens.length !== 0 && O.rand(2) === 0){
        var type = parens.pop();
        str += ')]'[type];
      }
    }

    while(parens.length !== 0){
      var type = parens.pop();
      str += ')]'[type];
    }

    var funcStr = str;

    str = `${origFunc}=${origArg}=>${origFunc}[${origArg}|=0]||(${origFunc}[${origArg}]=`;
    str += `((a,b)=>`;

    str += arr2str(arr.map(str => {
      return arr2str([...str].map(char => {
        var indices = [...funcStr]
          .map((a, b) => a === char ? b : null)
          .filter(a => a !== null);

        var index = O.randElem(indices);

        return index;
      }));
    }));

    str += `[a=(a+1).match(/.*/g).join\`\`,b].map(b=>a[b]).join\`\``;
    str += `)(${funcStr},${origArg}))`;

    return str;

    function getLetter(){
      var letters = chars
        .map((a, b) => [a, b])
        .filter(([char]) => reg1.test(char));

      if(letters.length === 0)
        return randLetter();

      var [letter, index] = letters[O.rand(letters.length)];
      chars.splice(index, 1);

      return letter;
    }
  });

  checkCode();

  var getHash = new Function(getVar('N'), `${out};\nreturn ${getVar('h')};`)([]);
  var strs = [];

  src = O.sanl(src).filter(line => {
    return !line.trim().startsWith('//');
  }).join('\n');

  src.split(/\n{2}/).forEach(src => {
    src = src.replace(/"(?:\\(?:[\\\"]|x.{2}|u.{4})|[^\"])*"/g, match => {
      var str = JSON.parse(match);
      var hash = getHash(str);

      return `_${hash}`;
    });

    var str = `${randLetter()}=>`;
    var parens = [];
    var first = true;

    (src.match(/\S+/g) || []).forEach(op => {
      if(!first){
        if(parens.length !== 0 && O.rand(4) === 0) str += ',';
        else str += O.randElem(jsOps);
      }

      first = false;

      if(O.rand(parens.length + 2) === 0){
        var type = O.rand(2);
        parens.push(type);
        str += '(['[type];
      }

      if(/[0-9]/.test(op[0])){
        if(op.length !== 1)
          throw new SyntaxError(`Invalid number \`${op}\``);

        str += op;
      }else if(op[0] === '_'){
        str += [...`A${op.substring(1)}`].map((a, b) => {
          if(b === 0) return a;
          return `${O.randElem(jsOps)}${a}`;
        }).join('');
      }else if(reg1.test(op)){
        var opCode = opCodes.findIndex(opObj => {
          return opObj[1] === op;
        });

        if(opCode === -1)
          throw new SyntaxError(`Invalid instruction \`${op}\``);

        str += String.fromCharCode('a'.charCodeAt(0) + opCode);
      }else{
        str += `B${op}${randLetter()}`;
      }

      if(parens.length !== 0 && O.rand(2) === 0){
        var type = parens.pop();
        str += ')]'[type];
      }
    });

    while(parens.length !== 0){
      var type = parens.pop();
      str += ')]'[type];
    }

    strs.push(str);
  });

  out += `;${getVar('R')}([${strs.join(',')}])`;
  out = `(${getVar('N')}=>{${out}})\`\``;
  checkCode();

  if(ONLOAD){
    out = `onload=a=>${out}`;
    checkCode();
  }

  var out2 = '';
  while(out.length !== 0){
    if(out.length <= MAX_LINE_LEN){
      out2 += out;
      break;
    }

    for(var i = MAX_LINE_LEN; i > 0; i--){
      var s = out.substring(i - 1, i + 1);
      if(/[\'\`\\\$\{\}]|[a-zA-Z0-9]{2}/.test(s))
        continue;

      var str = out.substring(0, i);
      var next = out.substring(i);
      var code = `${out2}${str}\n${next}`;

      if(isCodeValid(code))
        break;
    }

    if(i === 0){
      require('fs').writeFileSync(O.dirs.dw+'/1.js', code);
      throw new SyntaxError('Invalid syntax');
    }

    out2 += `${str}\n`;
    out = next;
  }
  out = out2;
  checkCode();

  if(NEW_LINE !== '\n'){
    out = out.replace(/\n/g, NEW_LINE);
    checkCode();
  }

  return out;

  function checkCode(){
    if(!isCodeValid(out)){
      console.log('ERROR');
      new Function(out)();
    }
  }

  function isCodeValid(code){
    var valid = false;

    saveConsole();

    try{
      var func = new Function(getVar('N'), code);
      valid = true;
    }catch{}

    restoreConsole();

    return valid;
  }

  function getVar(oldChar){
    if(varMap === null)
      return oldChar;

    var base = (/[A-Z]/.test(oldChar) ? 'A' : 'a').charCodeAt(0);
    var oldIndex = oldChar.charCodeAt(0) - base;
    var newIndex = varMap[oldIndex] + base;
    var newChar = String.fromCharCode(newIndex);

    return newChar;
  }

  function getStr(str){
    var index = strings.indexOf(str);

    if(index === -1)
      throw new TypeError(`Unknown string "${str}"`);

    return index;
  }

  function getProp(str){
    var index = getStr(str);
    var vari = getVar('s');

    return `[${vari}(${index})]`;
  }
}

function saveConsole(){
  consoles.push(console.log);
  console.log = O.nop;
}

function restoreConsole(){
  console.log = consoles.shift();
}

function randLetter(){
  var c = String.fromCharCode(O.rand(26) + 'a'.charCodeAt(0));
  if(O.rand(2) === 0) c = c.toUpperCase();
  return c;
}

function arr2str(arr, stringify=0){
  if(stringify) arr = arr.map(a => JSON.stringify(a));
  return `[${arr.join(',')}]`;
}