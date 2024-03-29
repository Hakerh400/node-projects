'use strict';

const assert = require('./assert');
const O = require('../omikron');
const EventTarget = require('./event-target');
const specialChars = require('./special-chars');
const util = require('./util');
const su = require('./str-util');

const {min, max} = Math;

class Editor extends EventTarget{
  selected = 0;
  editable = 1;
  wrap = 0;

  lines = [];
  cx = 0;
  cy = 0;
  cxPrev = 0;
  updatedLine = null;
  scrollX = 0;
  scrollY = 0;

  w = 1;
  h = 1;

  markedLine = null;

  get curLine(){
    const {lines, cy} = this;
    assert(cy < lines.length);
    return lines[cy];
  }

  render(g, w, h){
    this.w = w;
    this.h = h;

    const {lines, scrollX, scrollY, markedLine} = this;
    const linesNum = lines.length;

    for(let y = 0; y !== h; y++){
      const lineIndex = scrollY + y;
      if(lineIndex >= linesNum) break;

      const line = lines[lineIndex];
      const lineLen = line.length;

      if(markedLine !== null){
        const [my, mCol] = markedLine;

        if(y === my - scrollY){
          g.fillStyle = mCol;
          g.fillRect(0, y, w, 1);
        }
      }

      for(let x = 0; x !== w; x++){
        const charIndex = scrollX + x;
        if(charIndex >= lineLen) break;

        g.fillStyle = 'black';
        g.fillText(line[charIndex], x + .5, y + .5);
      }
    }

    if(this.selected)
      this.drawCursor(g, w, h);
  }

  drawCursor(g, w, h){
    const {cx, cy, scrollX, scrollY} = this;

    const x = cx - scrollX;
    const y = cy - scrollY;

    if(x < 0 || x >= w) return;
    if(y < 0 || y >= h) return;

    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x, y + 1);
    g.stroke();
  }

  onKeyDown(evt){
    const {ctrlKey, shiftKey, altKey, code} = evt;
    const flags = (ctrlKey << 2) | (shiftKey << 1) | altKey;

    noFlags: if(flags === 0){
      if(/^Arrow|^(?:Backspace|Home|End|Delete|Tab)$/.test(code)){
        O.pd(evt);
        this.processKey(code);
        return;
      }

      if(code === 'F4'){
        O.pd(evt);
        if(!hasErr()) return;
        this.goto(linesData.length - 1);
        return;
      }

      return;
    }

    if(flags === 4 || flags === 5){
      if(code === 'ArrowUp'){
        this.scrollUp(altKey);
        return;
      }

      if(code === 'ArrowDown'){
        this.scrollDown(altKey);
        return;
      }

      if(code === 'ArrowLeft'){
        this.scrollLeft();
        return;
      }

      if(code === 'ArrowRight'){
        this.scrollRight();
        return;
      }
    }

    ctrl: if(flags === 4){
      if(code === 'KeyG'){
        O.pd(evt);

        const s = prompt();
        if(s === null) return;

        let n = Number(s) - 1;
        if(isNaN(n)) return;

        this.goto(n);

        return;
      }

      return;
    }

    ctrlShift: if(flags === 6){
      if(code === 'KeyD'){
        O.pd(evt);
        this.processKey('Duplicate');
        return;
      }

      if(code === 'ArrowUp'){
        O.pd(evt);
        this.processKey('MoveUp');
        return;
      }

      if(code === 'ArrowDown'){
        O.pd(evt);
        this.processKey('MoveDown');
        return;
      }

      return;
    }
  }

  onKeyPress(evt){
    const {ctrlKey, altKey, key} = evt;
    if(ctrlKey || altKey) return;

    const shouldAddTab = () => {
      return 0;
      const {cy} = this;
      if(linesData.length <= cy) return 0;

      const {ctx} = linesData[cy];
      return ctx.hasProof;
    };

    const addTab = shouldAddTab();

    this.processKey(key, addTab);
  }

  goto(n){
    n = O.bound(n, 0, this.lines.length - 1);

    this.setCx(0);
    this.cy = n;
    this.scrollY = max(n - 15, 0);
  }

  scrollUp(moveCur=0){
    if(this.scrollY !== 0)
      this.scrollY--;

    if(moveCur && this.cy !== 0){
      this.setCx(0);
      this.cy--;
    }
  }

  scrollDown(moveCur=0){
    this.scrollY++;

    if(moveCur){
      this.setCx(0);
      this.cy++;
    }
  }

  scrollLeft(moveCur=0){
    if(this.scrollX !== 0)
      this.scrollX--;

    if(moveCur && this.cx !== 0)
      this.decCx();
  }

  scrollRight(moveCur=0){
    this.scrollX++;

    if(moveCur)
      this.incCx();
  }

  processKey(key, addTab=1){
    if(!this.selected) return;
    if(!this.editable) return;

    const {cx, cxPrev} = this;
    let {cy} = this;

    const line = this.getLine(cy);
    const lineLen = line.length;

    const tSize = addTab ? su.tabSize + 2/*su.getSpSize(line)*/ : 0;
    const tStr = addTab ? `${su.sp(su.tabSize)}- ` : '';

    const p1 = line.slice(0, cx);
    const p2 = line.slice(cx);

    const processKey = () => {
      if(key === 'Enter'){
        this.setLine(cy, p1);

        if(cx !== 0){
          const char = p1.slice(-1);
          const pt = su.getOpenParenType(char);

          if(pt !== null && p2.startsWith(su.closedParenChars[pt])){
            this.insertLines(++cy, tStr + su.tabStr, tStr + p2);
            this.setCx(tSize + su.tabSize);
            return;
          }
        }

        this.insertLine(++cy, tStr + p2);
        this.setCx(tSize);
        return;
      }

      if(key === 'Backspace'){
        if(cx === 0){
          if(cy === 0){
            // this.setCx();
            return;
          }

          this.removeLine(cy);
          this.setCx(this.getLineLen(--cy));
          this.appendLine(cy, line);
          return;
        }

        const c1 = line[cx - 1];
        const c2 = cx !== lineLen ? line[cx] : null;

        const pt = su.getOpenParenType(c1);
        const isOpenParen = pt !== null && p2.startsWith(su.closedParenChars[pt]);
        const isStrDelim = su.isStrDelim(c1) && c1 === c2;

        const p2New = isOpenParen || isStrDelim ? p2.slice(1) : p2;

        this.decCx();
        this.setLine(cy, p1.slice(0, -1) + p2New);
        return;
      }

      if(key === 'Delete'){
        if(cx === lineLen){
          this.appendLine(cy, this.removeLine(cy + 1));
          return;
        }

        this.setLine(cy, p1 + p2.slice(1));
        return;
      }

      if(key === 'Home'){
        const ts = line.match(/^ */)[0].length;
        this.setCx(cx !== ts ? ts : 0);
        return;
      }

      if(key === 'End'){
        this.setCx(lineLen);
        return;
      }

      if(key === 'Tab'){
        this.setLine(cy, p1 + su.tabStr + p2);
        this.setCx(cx + su.tabSize);
        return;
      }

      if(key === 'Duplicate'){
        this.insertLine(++cy, line);
        this.setCx();
        return;
      }

      if(key.startsWith('Move')){
        const dir = key.slice(4) === 'Up' ? 0 : 2;

        if(dir === 0){
          if(cy === 0){
            // this.setCx();
            return;
          }

          this.swapLines(cy, --cy);
          // this.setCx();
          return;
        }

        this.swapLines(cy, ++cy);
        // this.setCx();
        return;
      }

      if(key.startsWith('Arrow')){
        const dir = ['Up', 'Right', 'Down', 'Left'].indexOf(key.slice(5));
        if(dir === -1) return;

        if(dir & 1){
          if(dir === 3){
            if(cx === 0){
              if(cy === 0){
                this.setCx(0);
                return;
              }

              this.setCx(this.getLineLen(--cy));
              return;
            }

            this.decCx();
            return;
          }

          if(cx === lineLen){
            ++cy;
            this.setCx(0);
            return;
          }

          this.incCx();
          return;
        }

        if(dir === 0){
          if(cy === 0) return;

          this.cx = min(this.getLineLen(--cy), cxPrev);
          return;
        }

        this.cx = min(this.getLineLen(++cy), cxPrev);
        return;
      }

      if(key.length !== 1){
        // log(key);
        return;
      }

      const char = key;
      let str = char;

      setStr: {
        if(su.isStrDelim(char)){
          str = char + char;
          break setStr;
        }

        const openParenType = su.getOpenParenType(char);

        if(openParenType !== null){
          const nextChar = cx !== lineLen ? p2[0] : null;

          if(nextChar === null || su.isClosedParen(nextChar) || nextChar === ' ')
            str = char + su.closedParenChars[openParenType];

          break setStr;
        }

        if(su.isClosedParen(char)){
          if(p2.startsWith(char)) str = '';
          break setStr;
        }

        const p1New = p1 + char;

        for(const [code, su] of specialChars){
          if(!p1New.endsWith(code)) continue;

          const codeLen = code.length;
          this.setLine(cy, p1.slice(0, 1 - codeLen) + su + p2);
          this.setCx(cx - codeLen + su.length + 1);
          return;
        }
      }

      this.setLine(cy, p1 + str + p2);
      this.incCx();
    };

    processKey();
    this.cy = cy;
  }

  setCx(cxNew=this.cx){
    this.cx = cxNew;
    this.cxPrev = cxNew;
  }

  incCx(){
    this.setCx(this.cx + 1);
  }

  decCx(){
    this.setCx(this.cx - 1);
  }

  setLines(lines){
    if(this.locked) return;

    if(this.wrap){
      const {w, h} = this;

      lines = O.sanl(lines.map(line => {
        if(line.length < w) return line;

        const words = line.split(' ');
        const lines = [];
        let lineCur = '';

        for(const word of words){
          if(lineCur.length !== 0)
            lineCur += ' ';

          if(lineCur.length + word.length >= w){
            lines.push(lineCur);
            lineCur = ' '.repeat(2);
          }

          lineCur += word;
        }

        if(lineCur.length !== 0)
          lines.push(lineCur);

        return lines.join('\n');
      }).join('\n'));
    }

    this.lines = lines;
    this.updateLine(0);
  }

  setText(str){
    this.setLines(str.split('\n'));
  }

  clear(){
    this.setText('');
  }

  appendLine(index, str){
    this.setLine(index, this.getLine(index) + str);
  }

  swapLines(index1, index2){
    const line1 = this.getLine(index1);
    const line2 = this.getLine(index2);

    this.setLine(index1, line2);
    this.setLine(index2, line1);
  }

  getLineLen(index){
    return this.getLine(index).length;
  }

  getLine(index){
    const {lines} = this;

    if(index >= lines.length)
      return '';

    return lines[index];
  }

  setLine(index, str){
    if(this.locked) return;

    const {lines} = this;
    assert(util.isStr(str));

    if(lines.length <= index && str.length === 0)
      return;

    this.expandLines(index);

    if(str === lines[index]) return;

    lines[index] = str;
    this.updateLine(index);
  }

  insertLine(index, line){
    this.insertLines(index, line);
  }

  removeLine(index){
    return this.removeLines(index)[0];
  }

  insertLines(index, ...xs){
    if(this.locked) return;

    this.expandLines(index);
    this.updateLine(index);
    this.lines.splice(index, 0, ...xs);
  }

  removeLines(index=0, num=1){
    if(this.locked) return;

    const {lines} = this;

    this.expandLines(index);
    this.updateLine(index);

    assert(index + num <= lines.length);

    return lines.splice(index, num);
  }

  spliceLines(index=0, num=this.lines.length - num){
    return this.removeLines(index, num);
  }

  expandLines(index){
    const {lines} = this;

    while(lines.length <= index)
      lines.push('');
  }

  updateLine(index){
    const {updatedLine} = this;

    if(updatedLine === null || index < updatedLine)
      this.updatedLine = index;
  }
}

module.exports = Editor;