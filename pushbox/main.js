'use strict';

var O = require('../framework');
var media = require('../media');
var logStatus = require('../log-status')

var figures = [
  ['1', [3, 0], [0, 0], [0, 1, 1, -1]],
  ['2', [1, 2], [0, 0], [0, 1, 1, -1]],
  ['3', [2, 2], [0, 0], [0, 1, 1, -1]],
  ['T', [0, 0], [2, 1], [2, 1, 2, -3, -1, 2]]
];

var moves = [
  ['1', [3, 3]],
  ['1', [0, 3]],
  ['T', [1, 0]],
  ['2', [0, 2]],
  ['2', [0, 0]],
  ['3', [0, 2]],
  ['3', [0, 1]],
  ['T', [1, 2]]
];

var ws = 4;
var hs = 4;
var blockSize = 32;
var offset = 3;
var offsetLabel = 32 - offset;
var movesNum = moves.length;
var moveDuration = 2;
var waitBeforeFirstMove = 0;
var offset2 = offset * 2;

var w = ws * blockSize + offset2;
var h = hs * blockSize + offset2 + offsetLabel;
var fps = 30;
var hd = false;

var duration = (movesNum + waitBeforeFirstMove) * moveDuration;
var framesNum = duration * fps;
var moveFramesNum = moveDuration * fps;
var timeOffset = waitBeforeFirstMove * moveFramesNum;

var g = null;

media.renderVideo('-vid/1.mp4', w, h, fps, hd, (w, h, g_, f) => {
  logStatus(f, framesNum);

  if(f == 1){
    g = new O.EnhancedRenderingContext(g_);
    g.font(blockSize * .5);

    drawFigures(g);
  }

  if(f - 1 >= timeOffset){
    var time = f - timeOffset - 1;
    var moveIndex = time / moveFramesNum | 0;
    var stage = time % moveFramesNum + 1;

    var [name, [xTarget, yTarget]] = moves[moveIndex];
    var moving = [name];
    var figure = figures.find(([figName]) => figName == name);
    var figureCoords = figure[1];
    var [x, y] = figureCoords;

    if(stage < moveFramesNum){
      var k1 = interpolate(stage, moveFramesNum, 1);
      var k2 = 1 - k1;

      var xNew = x * k1 + xTarget * k2;
      var yNew = y * k1 + yTarget * k2;
      var coordsNew = [xNew, yNew];

      drawFigures(g, moving, coordsNew);
    }else{
      figureCoords[0] = xTarget;
      figureCoords[1] = yTarget;

      drawFigures(g);
    }
  }

  return f != framesNum;
});

function drawFigures(g, moving = [], coordsNew = null){
  g.fillStyle = 'black';
  g.fillRect(0, 0, w, h);

  g.fillStyle = 'lightgray';
  g.fillRect(offset, offsetLabel + offset, w - offset2, h - offsetLabel - offset2);

  figures.forEach(([name, [x, y], [tx, ty], [offsetX, ...lines]]) => {
    // Check if the figure is moving

    var isMoving = moving.includes(name);

    if(isMoving){
      x = coordsNew[0];
      y = coordsNew[1];
    }

    // Draw figure's shape

    g.fillStyle = 'white';
    g.beginPath();

    var coords = [offset + (x + offsetX) * blockSize, offsetLabel + offset + y * blockSize];
    var coordType = 0;

    g.moveTo(...coords);

    lines.forEach(line => {
      coords[coordType] += line * blockSize;
      coordType ^= 1;

      g.lineTo(...coords);
    });

    g.closePath();
    g.fill();
    g.stroke();

    // Draw figure's name

    g.fillStyle = 'black';

    coords = [offset + (x + tx + .5) * blockSize, offsetLabel + offset + (y + ty + .5) * blockSize];

    g.fillText(name, ...coords);
  });
}

function interpolate(x, y = null, offset = null){
  if(y !== null){
    if(offset !== null) x = (x - offset) / (y - offset);
    else x /= y;
  }

  var val = 1.0050251256281406 / (1 + Math.exp((x - .5) * 12)) - 0.002512562814070352;

  return O.bound(val, 0, 1);
}