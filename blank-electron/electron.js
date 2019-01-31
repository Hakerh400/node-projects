'use strict';

const HD = 1;

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const media = require('../media');

const w = HD ? 1920 : 640;
const h = HD ? 1080 : 480;
const fps = 60;
const fast = !HD;

const [wh, hh] = [w, h].map(a => a >> 1);

const duration = 60 * 10;
const framesNum = fps * duration;

const outputFile = getOutputFile();

setTimeout(main);

function main(){
  O.body.style.margin = '0px';

  const a = O.doc.createElement('canvas');
  a.width = w;
  a.height = h;

  const gl = a.getContext('webgl');
  let P, A, D;

  (() => {
    P = gl.createProgram();

    gl.shaderSource(A=gl.createShader(35633),'attribute vec2 P;void main(){gl_Position=vec4(P,0,1);}');
    gl.compileShader(A);
    gl.attachShader(P,A);

    gl.shaderSource(A=gl.createShader(35632),'precision mediump float;uniform float D;vec2 a=vec2('+a.width+','+a.height+');vec3 b=vec3(.001,0,0);float c(vec3 d){d+=(sin(d.zxy*1.7)+sin(d.yzx+D*3.))*.2;d.xy=vec2(atan(d.x,d.y)*1.6,1.6-length(d.xy));return min(max(abs(d.y+(sin(D*2.)+1.)/4.)-.55,abs(length(fract(d.xz)-.5)-.2)-.13),d.y);}void main(){vec2 e=((gl_FragCoord.xy*2.)/a.xy)-1.;e.x*=a.x/a.y;vec3 f=normalize(vec3(0,sin(D)*.05,.5));vec3 g=normalize(cross(f,vec3(0,1,0)));vec3 d,h=(mat3(g,normalize(cross(g,f)),f))*normalize(vec3(e.xy,1.7+sin(D)));float i,j;for(int k=0;k<256;k++){d=vec3(0,0,1)*D*2.+h*j;i=c(d);if(i<.001||j>10.) break;j+=i;}vec3 l=(vec3(c(d+b.xyy),c(d+b.yxy),c(d+b.yyx))-c(d))/b.x;gl_FragColor=vec4(vec3((1.-(j/(9.9))))*(vec3(.3)+(pow(clamp(1.+dot(l,h),.0,.8),2.)*vec3(.8,.5,0.))+(.5*clamp(dot(l,vec3(-1,-.3,0)),.0,1.)*vec3(2,1,.6))+.3*clamp(.5+l.y/2.,.0,1.)*vec3(.5,.7,1))*clamp(c(d+l*.05)*4.+c(d+l*.1)*2.+.5,.1,1.),1);if(j>10.) gl_FragColor=vec4(0,0,0,1);}');
    gl.compileShader(A);
    gl.attachShader(P,A);

    gl.linkProgram(P);
    gl.useProgram(P);

    gl.bindBuffer(A=34962,gl.createBuffer());
    gl.bufferData(A,new Int8Array([-3,1,1,-3,1,1]),35044);

    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0,2,5120,0,0,0);

    D=0;
  })();

  const r = () => {
    gl.uniform1f(gl.getUniformLocation(P,'D'), D+=0.02);
    gl.drawArrays(6,0,3);
  }

  const pixels = new Uint8Array(w * h << 2);

  media.renderVideo(outputFile, w, h, fps, fast, (w, h, g, f) => {
    if(f > framesNum) return -1;
    media.logStatus(f, framesNum);

    r();
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    return Buffer.from(pixels);
  }, () => window.close());
}

function getOutputFile(vid=0){
  if(vid || !HD) return '-vid/1.mp4';
  const project = path.parse(__dirname).name;
  return `-render/${project}.mp4`;
}