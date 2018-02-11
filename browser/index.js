'use strict';

class Window{
  constructor(){
    this.document = new Document();
    this.location = new Location();
  }
};

class Document{
  constructor(){
    this.head = null;
    this.body = null;
  }
};

class Location{
  constructor(){
    this.href = null;
  }
};

module.exports = {
  Window,
  Document,
};