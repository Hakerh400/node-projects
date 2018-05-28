'use strict';

var O = require('../framework');
var Tape = require('./tape.js');

const MAX_INDEX = 2 ** 16;

class TuringMachine{
  constructor(cards=null){
    this.setCards(cards);
  }

  setCards(cards=null){
    if(cards === null){
      this.cards = null;
      return;
    }

    if(typeof cards === 'string'){
      cards = parseCards(cards);
      if(cards.length === 0)
        throw new TypeError('At least one card is required');
    }

    this.cards = cards;
  }

  randSrc(){
    var cardsNum = randInt(100, 1e3);

    var arr = O.shuffle(O.ca(cardsNum, index => {
      var card = O.ca(2, () => {
        return [
          O.rand(2),
          randInt(-16, 16),
          null,
        ];
      });

      card.index = index + 1;

      return card;
    }));

    var firstCardIndex = arr.findIndex(card => card.index === 1);
    var firstCard = arr[firstCardIndex];
    arr[firstCardIndex] = {index: 0};

    var cs = [...firstCard];
    var cards = [firstCard];

    while(arr.length !== 0){
      var card = arr.splice(O.rand(arr.length), 1)[0];
      var index = O.rand(cs.length);
      var c = cs.splice(index, 1)[0];

      c[2] = card.index;

      if(card.index !== 0){
        cs.push(...card);
        cards.push(card);
      }
    }

    cs.forEach(c => {
      c[2] = O.rand(cardsNum + 1);
    });

    cards.sort((a, b) => a.index > b.index ? 1 : -1);

    this.setCards(cards);
  }

  start(input, allowIncompleteBytes=false, silenceErrors=false){
    var {cards} = this;

    var tape = new Tape(input);
    var card = cards[0];
    var index = 0;

    while(1){
      var bit = tape.get(index);
      var action = card[bit];

      if(action[0])
        tape.xor(index);

      index += action[1];

      if(Math.abs(index) > MAX_INDEX){
        if(silenceErrors)
          return null;

        throw new RangeError('Index is too small/big');
      }

      if(action[2] === 0)
        break;

      card = cards[action[2] - 1];
    }

    return tape.toBuffer(allowIncompleteBytes);
  }

  stringifyCards(){
    return this.cards.map(card => {
      return card.map(c => {
        return c.join(' ');
      }).join(', ');
    }).join('\n');
  }
};

module.exports = TuringMachine;

function parseCards(src){
  return O.sanl(src).filter(line => {
    return line.trim().length !== 0;
  }).map(card => {
    return card.split(',').map(c => {
      return c.trim().split(/\s+/).map(num => {
        return num | 0;
      });
    });
  });
}

function randInt(min, max){
  return min + O.rand(max - min + 1);
}