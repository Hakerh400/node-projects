'use strict';

const EventEmitter = require('events');
const http = require('http');
const urlModule = require('url');
const canvas = require('../canvas');

const server = 'http://localhost/';

var O;

class EventTarget extends EventEmitter{
  constructor(){
    super();
  }

  addEventListener(type, func){
    this.on(type, func);
  }
};

class Window extends EventTarget{
  constructor(w, h, url = null){
    super();

    var window = this;

    this.innerWidth = w;
    this.innerHeight = h;

    this.document = new Document(this);
    this.location = new Location(url);
    this.XMLHttpRequest = createXMLHttpRequestConstructor(this);
    this.Function = createFunctionContrustor(this);

    this._rafEvents = [];
    this._canvases = [];
    this._ready = true;

    if(!O) O = require('../framework');

    if(url !== null){
      loadPage(this, url, err => {
        this.emit('load');
      });
    }

    this.addEventListener('_raf', () => {
      var rafEvents = [...this._rafEvents];
      this._rafEvents.length = 0;
      rafEvents.forEach(({func}) => func());
    });

    isReady();

    function isReady(){
      if(window._ready) window.emit('_ready');
      else setTimeout(isReady);
    }
  }

  setTimeout(func, time = 0){
    var event = new WindowEvent(func, 'timeout', {time});
    this.emit('event', event);
    if(!event.preventedDefault) this.dispatchEvent(event);
  }

  requestAnimationFrame(func){
    var event = new WindowEvent(func, 'raf');
    this.emit('event', event);
    if(!event.preventedDefault) this._rafEvents.push(event);
  }

  dispatchEvent({func, type, details: evt}){
    switch(type){
      case 'timeout':
        this._ready = false;
        setTimeout(() => {
          this._ready = true;
          func();
        }, evt.time);
        break;
    }
  }

  unescape(str){
    return str;
  }

  toString(){
    return '[object Window]';
  }
};

class Document{
  constructor(window){
    this.window = window;
    this.head = new Node(this, 'head');
    this.body = new Node(this, 'body');
  }

  createElement(tagName){
    tagName = tagName.toLowerCase();

    switch(tagName){
      case 'canvas': return createCanvas(this.window); break;
      default: return new Node(this, tagName); break;
    }
  }

  createTextNode(text){
    return new Text(text);
  }

  querySelector(selector){
    return new Node(this, 'div');
  }
};

class Node extends EventTarget{
  constructor(document, tagName){
    super();

    this.document = document;
    this.tagName = tagName.toUpperCase();
    this.style = new CSSStyleDeclaration();
    this.children = [];
    this.classList = new DOMTokenList();
  }

  appendChild(node){
    this.children.push(node);
  }

  remove(){
    /**/
  }
};

class CSSStyleDeclaration{
  constructor(){}
};

class DOMTokenList{
  constructor(){
    this.classNames = [];
  }

  add(className){
    className += '';

    if(!this.classNames.includes(className)){
      this.classNames.push(className);
    }
  }

  remove(className){
    className += '';

    var index = this.classNames.indexOf(className);
    if(index !== -1) this.classNames.splice(index, 1);
  }
};

class Text{
  constructor(text){
    this.textContent = text;
  }
};

class Location{
  constructor(url){
    this.href = resolveUrl(url);
  }
};

class WindowEvent{
  constructor(func, type, details = {}){
    this.func = func;
    this.type = type;
    this.details = details;
    this.preventedDefault = false;
  }

  preventDefault(){
    this.preventedDefault = true;
  }
};

module.exports = {
  Window
};

O = require('../framework');

function loadPage(window, url, cb = O.nop){
  window._ready = false;
  url = resolveUrl(url);

  getPage(url, (err, data) => {
    if(err) return cb(err);
    data = data.toString();

    var scriptUrl = data.match(/\<script .*?src\s*\=\s*\"([^\"]*)/)[1];

    getPage(scriptUrl, (err, data) => {
      if(err) return cb(err);
      data = data.toString();

      new window.Function(data)();

      setTimeout(() => {
        window._ready = true;
        cb(null);
      });
    });
  });
}

function getPage(url, cb = O.nop){
  var errCb = err => cb(err, null);

  url = resolveUrl(url);

  var req = http.get(url, res => {
    var data = Buffer.alloc(0);

    res.on('data', d => data = Buffer.concat([data, d]));
    res.on('end', () => cb(null, data));

    res.on('error', errCb);
  });

  req.on('error', errCb);
}

function createCanvas(window){
  var w = window.innerWidth;
  var h = window.innerHeight;
  var cs = window._canvases;

  var canvas = new canvas.Canvas(w, h);
  cs.push(canvas);

  canvas.style = new CSSStyleDeclaration();
  canvas.classList = new DOMTokenList();

  return canvas;
}

function createFunctionContrustor(window){
  return function(...args){
    var func = new Function('window', 'document', 'Function', ...args);

    var proxy = new Proxy(func, {
      apply(f, t, args){
        return f.apply(t, [window, window.document, window.Function, ...args]);
      }
    });

    return proxy;
  };
}

function createXMLHttpRequestConstructor(window){
  class XMLHttpRequest{
    constructor(){
      this.window = window;
      this.url = '';
      this.readyState = 0;
      this.status = 0;
      this.responseText = '';
      this.onreadystatechange = O.nop;
    }

    open(method, url){
      this.url = url;
    }

    send(){
      this.window._ready = false;

      getPage(this.url, (err, data) => {
        if(err){
          this.readyState = 1;
          this.status = 404;
        }else{
          this.readyState = 4;
          this.status = 200;
          this.responseText = data.toString();
        }

        this.window._ready = true;
        this.onreadystatechange();
      });
    }
  };

  return XMLHttpRequest;
}

function resolveUrl(url){
  if(url === null) return null;
  return urlModule.resolve(server, url);
}