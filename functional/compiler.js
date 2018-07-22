'use strict';

const O = require('../framework');

module.exports = {
  compile,
};

function compile(parsed){
  var bs = new O.BitStream();

  var identsArr = [];
  var identsObj = O.obj();

  var stack = [parsed.list];
  var first = 1;

  while(stack.length !== 0){
    var elem = stack.pop();

    if(elem === null){
      wb(0);
      continue;
    }

    if(first) first = 0;
    else wb(1);

    if(elem.isCall()){
      var {ident, arr} = elem;
      var name = ident.name;

      if(!(name in identsObj)){
        if(identsArr.length !== 0)
          wb(1);

        identsArr.push(name);
        identsObj[name] = identsArr.length - 1;
      }else{
        wb(0);

        var index = identsObj[name];

        if(identsArr.length !== 1)
          bs.write(index, identsArr.length - 1);
      }
    }

    stack.push(null);
    stack = stack.concat(elem.arr.reverse());
  }

  bs.pack();

  var arr = bs.getArr();
  while(arr[arr.length - 1] === 0)
    arr.pop();

  return Buffer.from(arr);

  function wb(a){
    bs.writeBit(a);
  }
}