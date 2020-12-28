'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const format = require('../format');
const Parser = require('./parser');
const cs = require('./ctors');

const EXPORT_COLOR_SCHEME = 0;
const COLOR_SCHEME_EXPORT_FILE = format.path('-dw/color-scheme.txt');

const cwd = __dirname;
const dir = path.join(cwd, 'test');
const csFile = path.join(dir, 'color-scheme.json');
const codeFile = path.join(dir, 'code.txt');
const scFile = path.join(dir, 'scopes.txt');
const outputFile = path.join(dir, 'output.htm');

const main = () => {
  const scheme = parseScheme(O.rfs(csFile, 1));
  const code = O.rfs(codeFile, 1);
  const scopesIno = scheme.parseScopesInfo(O.rfs(scFile, 1));

  let str = O.lf(code);

  const len = str.length;
  const spArr = O.ca(len + 1, () => '');

  const spStart = (index, str) => {
    spArr[index] += str;
  };

  const spEnd = (index, str) => {
    spArr[index] = spArr[index] + str;
  };

  for(const scInfo of scopesIno){
    const {scopes, start, end} = scInfo;
    const props = scheme.matchProps(scopes);

    const style = {
      ...'foreground' in props ? {color: props.foreground} : {},
    };

    const styleKeys = O.keys(style);
    if(styleKeys.length === 0) continue;

    const styleStr = styleKeys.map(key => {
      return `${key}:${style[key]}`;
    }).join(';');

    spStart(start, `<span style="${styleStr}">`);
    spEnd(end, `</span>`);

    if('font_style' in props){
      const fontStyle = props['font_style'];
      const {attribs} = fontStyle;

      if('italic' in attribs){
        spStart(start, `<i>`);
        spEnd(end, `</i>`);
      }
    }
  }

  str = [...str].map((s, i) => {
    if(/[^a-zA-Z0-9\s]/.test(s))
      s = `&#${O.cc(s)};`;

    return spArr[i] + s;
  }).join('') + O.last(spArr);

  str = str.replace(/^/gm, '&#32; ');

  const output = `<div style="background:${
    scheme.getGlob('background')};color:${
    scheme.getGlob('foreground')};font-family:monospace;white-space:pre">\n${
    str}\n\n</div>`;

  O.wfs(outputFile, output);
};

const parseScheme = str => {
  const info = parseJSON(str);
  const scheme = new cs.Scheme();

  const varsObj = info.variables;
  const globsObj = info.globals;
  const rulesArr = info.rules;

  const varNames = O.keys(varsObj);
  const globNames = O.keys(globsObj);

  for(const name of varNames)
    scheme.addVar(name, scheme.parseExpr(varsObj[name]));

  for(const name of globNames)
    scheme.addGlob(name, scheme.parseExpr(globsObj[name]));

  for(const ruleObj of info.rules){
    const {name: type, scope, ...rest} = ruleObj;
    const rule = scheme.createRule(type, scheme.parseScope(scope));

    for(const prop of O.keys(rest)){
      const parsed = scheme.parseExpr(rest[prop]);
      rule.setProp(prop, parsed);
    }
  }

  if(EXPORT_COLOR_SCHEME)
    O.wfs(COLOR_SCHEME_EXPORT_FILE, scheme.toString());

  return scheme;
};

const parseJSON = str => {
  return new Function(`return (${str})`)();
};

main();