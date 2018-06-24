'use strict';

var fs = require('fs');
var path = require('path');
var http = require('http');
var urlModule = require('url');
var readline = require('readline');
var O = require('../framework');
var media = require('../media');
var fsRec = require('../fs-recursive');
var hash = require('../hash');
var converter = require('.');

const PORT = 1037;

var wampProject = 'tasks';
var avatarsDirName = 'avatars';

var avatarsDir = path.join(O.dirs.wamp, 'projects', wampProject, avatarsDirName);

var avatarsNum;
var server;
var rl;

setTimeout(main);

function main(){
  fsRec.createDirSync(avatarsDir);
  avatarsNum = fs.readdirSync(avatarsDir).length;

  server = http.createServer(onReq);
  server.listen(PORT);

  rl = readline.createInterface(process.stdin, process.stdout);
  rl.on('line', onInput);
}

function onInput(str){
  str = str.trim();

  if(str.length !== 0){
    if(str === 'exit'){
      server.close();
      rl.close();
      return;
    }

    log('Unknown command');

    log('\n');
  }
}

function onReq(req, res){
  var buff = Buffer.alloc(0);

  res.setHeader('Access-Control-Allow-Origin', '*');

  req.on('data', chunk => {
    buff = Buffer.concat([buff, chunk]);
  });

  req.on('end', () => {
    var parsedUrl = urlModule.parse(req.url);
    var command = parsedUrl.pathname.substring(1);

    log(`Received command: ${command}`);

    switch(command){
      case 'avatars/reset':
        resetAvatarsDir();
        avatarsNum = 0;
        succ();
        break;

      case 'avatars/upload':
        converter.convert(buff).then(canvas => {
          var index = ++avatarsNum;
          var name = `${index}.png`;
          var filePath = path.join(avatarsDir, name);
          var sha512;

          media.renderImage(filePath, canvas.width, canvas.height, (w, h, g) => {
            g.clearRect(0, 0, w, h);
            g.drawImage(canvas, 0, 0);

            var data = g.getImageData(0, 0, w, h).data;
            sha512 = hash(Buffer.from(data), 'sha512').toString('hex');
          }, () => {
            succ({
              index,
              sha512,
            });
          });
        }).catch(error => {
          if(error instanceof Error)
            error = error.message;

          err(error);
        });
        break;

      default:
        err('Unknown command');
        break;
    }
  });

  function succ(msg='ok'){
    res.end(JSON.stringify({
      data: msg,
      error: null,
    }));
  }

  function err(msg){
    res.end(JSON.stringify({
      data: null,
      error: msg,
    }));
  }
}

function resetAvatarsDir(){
  resetDir(avatarsDir);
}

function resetDir(dir){
  if(fs.existsSync(dir))
    fsRec.deleteFilesSync(dir);

  fsRec.createDirSync(dir);
}