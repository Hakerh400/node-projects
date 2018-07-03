'use strict';

const canvas = getCanvas();

module.exports = canvas;

function getCanvas(){
  try{
    return require('./node_modules/canvas');
  }catch(err){
    return null;
  }
}