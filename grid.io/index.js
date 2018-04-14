'use strict';

var O = require('../framework');
var webSocket = require('ws');

const GRID_WIDTH = 1e3 | 0;
const GRID_HEIGHT = 1e3 | 0;

const CHUNK_WIDTH = 30;
const CHUNK_HEIGHT = 17;

const MAX_NICK_LEN = 15;

const TAB_SIZE = 2;
const TAB = ' '.repeat(TAB_SIZE);

const MAX_ID_FRAGMENT = 2 ** 32;

const MIN_ANGLE = getMinAngle();
const MAX_ANGLE = getMaxAngle();

const FRICTION = .9;
const PLAYER_ACCELERATION = .01;
const MIN_VELOCITY = .00001;
const MAX_VELOCITY = .1;

const TICKS_PER_SECOND = 30;
const TIMEOUT_DELAY = Math.round(1e3 / TICKS_PER_SECOND);

var id1 = 0;
var id2 = 0;

var t = Date.now();

class Unique{
  constructor(){
    this.id1 = id1;
    this.id2 = id2++;

    if(id2 > MAX_ID_FRAGMENT){
      id1++;
      id2 = 0;
    }
  }

  younger(other){
    if(this.id1 < other.id1) return true;
    if(this.id1 > other.id1) return false;
    return this.id2 < other.id2;
  }

  older(other){
    if(this.id1 > other.id1) return true;
    if(this.id1 < other.id1) return false;
    return this.id2 > other.id2;
  }

  writeId(buff, offset){
    buff.writeUInt32LE(this.id1, offset);
    buff.writeUInt32LE(this.id2, offset + 4);
  }

  toString(...extra){
    var str = `${this.constructor.name} ${this.id2}`;

    if(extra.length !== 0){
      str += ' (';
      for(var i = 0; i < extra.length; i++){
        var param = extra[i];
        if(i !== 0) str += ', ';
        str += `${param}: ${JSON.stringify(this[param])}`;
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

    this.tickTime = Date.now();

    setTimeout(this.tickFunc);
  }

  onConn(ws){
    var user = new User(this, ws);
    this.users.push(user);
  }

  tick(){
    if(this.closed) return;
    var {world, users} = this;

    for(var user of users){
      var player = user.player;
      if(player === null) continue;

      var ents1 = player.entsPrev;
      var ents2 = player.ents;

      var entsArr = player.getVisibleEnts();
      for(var ents of entsArr){
        for(var ent of ents){
          ents2.push(ent);

          var index = ents1.indexOf(ent);

          if(index === -1){
            user.send(ent.packNewEnt());
          }else{
            ents1[index] = null;
            if(ent.updates !== 0)
              user.send(ent.packUpdateEnt());
          }
        }
      }

      for(var ent of ents1){
        if(ent !== null)
          user.send(ent.packRemoveEnt(0x00));
      }

      player.entsPrev = ents2;
      player.ents = ents1;
      ents1.length = 0;
    }

    for(var ent of world.ents){
      ent.refresh();
      ent.tick();
    }

    var time = Math.max(TIMEOUT_DELAY - (Date.now() - this.tickTime), 0);
    setTimeout(this.tickFunc, time);
    this.tickTime = Date.now();
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
    var {player} = this;

    if(!(data instanceof Buffer))
      return this.kick();

    if((data[0] === 0) === (player !== null))
      return this.kick();

    switch(data[0]){
      case 0x00:
        var len = data[1];
        if(len > MAX_NICK_LEN || data.length !== len + 2)
          return this.kick();

        var nick = data.slice(2).toString('ascii');
        var x = O.rand(CHUNK_WIDTH);
        var y = O.rand(CHUNK_HEIGHT);

        player = this.player = new Player(this.server.world, x, y, 0, nick);
        this.send(player.packNewEnt());
        player.refresh();
        break;

      case 0x01:
        if(data.length !== 5)
          return this.kick();

        var dir = data.readFloatLE(1);
        if(dir < MIN_ANGLE || dir > MAX_ANGLE)
          return this.kick();

        player.dir = dir;
        player.updates |= 2;
        break;

      case 0x02:
        if(data.length !== 2)
          return this.kick();

        var acceleration = data[1];
        if(acceleration > 15)
          this.kick();

        player.acceleration = acceleration;
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
    if(!this.isWsOpen || this.ws.readyState !== 1)
      return;
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
    this.chunksGrid = new ChunksGrid(this,
      Math.ceil(w / CHUNK_WIDTH), Math.ceil(h / CHUNK_HEIGHT),
      CHUNK_WIDTH, CHUNK_HEIGHT);

    this.ents = [];
  }

  addEnt(ent){
    this.ents.push(ent);
    this.chunksGrid.addEnt(ent);
  }

  moveEnt(ent){
    this.chunksGrid.moveEnt(ent);
  }

  removeEnt(ent){
    var index = this.ents.indexOf(ent);
    this.ents.splice(index, 1);
    this.chunksGrid.removeEnt(ent);
  }

  getChunk(x, y){
    return this.chunksGrid.get(x, y);
  }

  getEnts(func){
    return this.ents.filter(func);
  }

  getEnt(func){
    var {ents} = this;

    for(var ent of ents)
      if(func(ent))
        return ent;

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

class ChunksGrid extends Unique{
  constructor(world, w, h, ws, hs){
    super();

    this.world = world;
    this.w = w;
    this.h = h;
    this.ws = ws;
    this.hs = hs;

    this.chunks = O.ca(h, y => O.ca(w, x => {
      return new Chunk(this, x, y);
    }));
  }

  addEnt(ent){
    this.getByCoords(ent.x, ent.y).addEnt(ent);
  }

  moveEnt(ent){
    ent.chunk.removeEnt(ent);
    this.getByCoords(ent.x, ent.y).addEnt(ent);
  }

  removeEnt(ent){
    this.getByCoords(ent.x, ent.y).removeEnt(ent);
  }

  get(x, y){
    if(x < 0 || y < 0 || x >= this.w || y >= this.h) return null;
    return this.chunks[y][x];
  }

  getByCoords(x, y){
    return this.get(x / this.ws | 0, y / this.hs | 0);
  }
};

class Chunk extends Unique{
  constructor(chunksGrid, x, y){
    super();

    this.chunksGrid = chunksGrid;
    this.x = x;
    this.y = y;

    this.w = this.chunksGrid.ws;
    this.h = this.chunksGrid.hs;

    this.ents = [];
  }

  addEnt(ent){
    this.ents.push(ent);
    ent.chunk = this;
  }

  removeEnt(ent){
    var index = this.ents.indexOf(ent);
    this.ents.splice(index, 1);
  }
};

class Entity extends Unique{
  constructor(world, x, y, dir){
    super();

    this.world = world;
    this.coords = new O.Vector(x, y);
    this.velocity = new O.Vector(0, 0);
    this.acceleration = 0;
    this.dir = dir;
    this.type = 0;
    this.dead = 0;

    this.extraSize = 0;
    this.updates = 0;

    this.cacheNewEnt = null;
    this.cacheUpdateEnt = null;

    var buff = this.cacheRemoveEnt = Buffer.allocUnsafe(10);
    buff[0] = 0x04;
    this.writeId(buff, 1);

    this.world.addEnt(this);
  }

  tick(){
    var {coords, velocity, acceleration} = this;

    if(acceleration !== 0){
      if(acceleration & 1) velocity.add(0, -PLAYER_ACCELERATION);
      if(acceleration & 2) velocity.add(-PLAYER_ACCELERATION, 0);
      if(acceleration & 4) velocity.add(0, PLAYER_ACCELERATION);
      if(acceleration & 8) velocity.add(PLAYER_ACCELERATION, 0);
    }

    if(velocity.x !== 0 || velocity.y !== 0){
      coords.add(velocity);
      velocity.mul(FRICTION);

      var len = velocity.len();
      if(len > MAX_VELOCITY) velocity.setLen(MAX_VELOCITY);
      else if(len < MIN_VELOCITY) velocity.x = velocity.y = 0;

      this.world.moveEnt(this);
      this.updates |= 1;
    }
  }

  getVisibleEnts(){
    var {world, chunk, coords} = this;
    var {x, y} = chunk;
    var ents = [chunk.ents];

    var dx = coords.x / chunk.w % 1 < .5 ? -1 : 1;
    var dy = coords.y / chunk.h % 1 < .5 ? -1 : 1;

    chunk = world.getChunk(x, y + dy);
    if(chunk !== null) ents.push(chunk.ents);

    chunk = world.getChunk(x + dx, y);
    if(chunk !== null) ents.push(chunk.ents);

    chunk = world.getChunk(x + dx, y + dy);
    if(chunk !== null) ents.push(chunk.ents);

    return ents;
  }

  packNewEnt(){
    if(this.cacheNewEnt !== null)
      return this.cacheNewEnt;

    var {coords} = this;
    var buff = Buffer.allocUnsafe(this.extraSize + 31);

    buff[0] = 0x02;
    this.writeId(buff, 1);

    buff.writeDoubleLE(coords.x, 9);
    buff.writeDoubleLE(coords.y, 17);
    buff.writeFloatLE(this.dir, 25);
    buff.writeUInt16LE(this.type, 29);

    if(this.extraSize !== 0)
      this.packExtraData(buff, 31);

    this.cacheNewEnt = buff;
    return buff;
  }

  packUpdateEnt(){
    if(this.cacheUpdateEnt !== null)
      return this.cacheUpdateEnt;

    var {coords, updates} = this;
    var size = 10;
    var index = 10;

    if(updates & 1) size += 16;
    if(updates & 2) size += 4;
    if(updates & 4) size += this.extraSize;

    var buff = Buffer.allocUnsafe(size);

    buff[0] = 0x03;
    this.writeId(buff, 1);
    buff[9] = updates;

    if(updates & 1){
      buff.writeDoubleLE(coords.x, index);
      buff.writeDoubleLE(coords.y, index + 8);
      index += 16;
    }

    if(updates & 2){
      buff.writeFloatLE(this.dir, index);
      index += 4;
    }

    if(updates & 4)
      this.packExtraData(buff, index);

    this.cacheUpdateEnt = buff;
    return buff;
  }

  packRemoveEnt(reason){
    var buff = Buffer.from(this.cacheRemoveEnt);
    buff[9] = reason;
    return buff;
  }

  refresh(){
    this.updates = 0;
    this.cacheNewEnt = null;
    this.cacheUpdateEnt = null;
  }

  die(){
    this.dead = 1;
  }
};

class Player extends Entity{
  constructor(user, x, y, dir, nick){
    super(user.server.world, x, y, dir);

    this.user = user;
    this.nick = nick;
    this.type = 1;

    this.entsPrev = [this];
    this.ents = [];
  }

  toString(){
    return super.toString('nick');
  }
};

module.exports = {
  Server,
};

function createObj(){
  return Object.create(null);
}

function getMinAngle(){
  var angle = -O.pi;
  var buff = Buffer.allocUnsafe(4);
  buff.writeFloatLE(angle, 0);
  return Math.min(angle, buff.readFloatLE(0));
}

function getMaxAngle(){
  var angle = O.pi;
  var buff = Buffer.allocUnsafe(4);
  buff.writeFloatLE(angle, 0);
  return Math.max(angle, buff.readFloatLE(0));
}