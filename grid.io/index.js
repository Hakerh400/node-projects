'use strict';

var O = require('../framework');
var webSocket = require('ws');

const GRID_WIDTH = 1e3 | 0;
const GRID_HEIGHT = 1e3 | 0;

const TILE_SIZE = 64;
const VIEWPORT_SIZE = 1920;

const MAX_NICK_LEN = 15;

const TAB_SIZE = 2;
const TAB = ' '.repeat(TAB_SIZE);

class Unique{
  constructor(){
    this.id = Unique[O.static] | 0;
    Unique[O.static] = -~Unique[O.static];
  }

  toString(...extra){
    var str = `${this.constructor.name} ${this.id}`;

    if(extra.length !== 0){
      str += ' (';
      for(var i = 0; i < extra.length; i++){
        var param = extra[i];
        if(i !== 0) str += ', ';
        str += `${param}: "${this[param]}"`
      }
      str += ')';
    }

    return str;
  }

  info(msg){
    /**/
  }
};

class Server extends Unique{
  constructor(port){
    super();

    this.port = port;

    this.wss = new webSocket.Server({port});
    this.wss.on('connection', this.onConn.bind(this));

    this.world = new World(this, GRID_WIDTH, GRID_HEIGHT);
    this.users = [];

    this.tickFunc = this.tick.bind(this);
    this.closed = false;

    setTimeout(this.tickFunc);
  }

  onConn(ws){
    var user = new User(this, ws);
    this.users.push(user);
  }

  tick(){
    if(this.closed)
      return;

    var {users} = this;
    var len = users.length;

    for(var i = 0; i < len; i++){
      var user = users[i];
    }

    setTimeout(this.tickFunc);
  }

  close(){
    this.closed = true;
    this.wss.close();
  }

  getPlayers(){
    return this.world.getEnts(ent => ent instanceof Player);
  }
};

class User extends Unique{
  constructor(server, ws){
    super();

    this.server = server;

    this.ws = ws;
    this.onMsgFunc = this.onMsg.bind(this);
    this.onCloseFunc = this.onClose.bind(this);
    this.ws.on('message', this.onMsgFunc);
    this.ws.on('close', this.onCloseFunc);

    this.player = null;
    this.isWsOpen = true;

    this.info('Connected');
  }

  onMsg(data){
    if(!(data instanceof Buffer))
      return this.kick();

    if((data[0] === 0) === (this.player !== null))
      return this.kick();

    switch(data[0]){
      case 0:
        var len = data[1];
        if(len > MAX_NICK_LEN || data.length !== len + 2)
          return this.kick();

        var nick = data.slice(2).toString('ascii');
        var x = O.rand(this.server.world.w);
        var y = O.rand(this.server.world.h);
        this.player = new Player(this.server.world, x, y, nick);
        break;

      case 1:
        if(data.length !== 5)
          return this.kick();

        console.log(data.readFloatLE(1));
        break;

      default:
        this.kick();
        break;
    }
  }

  onClose(){
    this.info('Disconnected');
    this.isWsOpen = false;
    this.remove();
  }

  send(data){
    this.ws.send(data);
  }

  remove(){
    if(this.isWsOpen){
      this.ws.removeEventListener('message', this.onMsgFunc);
      this.ws.removeEventListener('close', this.onCloseFunc);
      this.ws.close();
    }

    if(this.player !== null)
      this.server.world.removeEnt(this.player);

    var index = this.server.users.indexOf(this);
    this.server.users.splice(index, 1);

    this.isWsOpen = false;
  }

  kick(){
    this.info('Kicked');
    this.remove();
  }
};

class World extends Unique{
  constructor(server, w, h){
    super();

    this.server = server;
    this.w = w;
    this.h = h;

    this.grid = new Grid(this, w, h);
    this.ents = [];
  }

  addEnt(ent){
    this.ents.push(ent);
  }

  removeEnt(ent){
    var index = this.ents.indexOf(ent);
    this.ents.splice(index, 1);
  }

  getEnts(func){
    return this.ents.filter(func);
  }

  getEnt(func){
    var {ents} = this;
    var len = ents.length;

    for(var i = 0; i < len; i++){
      var ent = ents[i];
      if(func(ent))
        return ent;
    }

    return null;
  }
};

class Grid extends Unique{
  constructor(world, w, h){
    super();

    this.world = world;
    this.w = w;
    this.h = h;

    this.tiles = O.ca(h, y => O.ca(w, x => {
      return createObj();
    }));
  }

  iterate(func){
    var {w, h, tiles} = this;

    for(var y = 0; y < h; y++)
      for(var x = 0; x < w; x++)
        func(x, y, tiles[y][x]);
  }

  get(x, y){
    if(x < 0 || y < 0 || x >= this.w || y >= this.h) return null;
    return this.grid[y][x];
  }

  reset(){
    this.iterate((x, y) => this.resetTile(x, y));
  }

  resetTile(x, y){
    this.grid[y][x] = createObj();
  }

  includes(x, y){
    return x >= 0 && y >= 0 && x < this.w && y < this.h;
  }
};

class Entity extends Unique{
  constructor(world, x, y){
    super();

    this.world = world;
    this.coords = new O.Vector(x, y);
    this.velocity = new O.Vector(0, 0);

    this.world.addEnt(this);
  }
};

class Player extends Entity{
  constructor(user, x, y, name){
    super(user.server.world, x, y);

    this.name = name;
  }

  toString(){
    return super.toString('name');
  }
};

module.exports = {
  Server,
};

function createObj(){
  return Object.create(null);
}