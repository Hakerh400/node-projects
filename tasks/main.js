'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../framework');
const formatFileName = require('../format-file-name');

const TAB_SIZE = 2;
const TAB = ' '.repeat(TAB_SIZE);

const tasksDir = formatFileName('-projects/tasks/open');

setTimeout(main);

function main(){
  var projects = fs.readdirSync(tasksDir);

  if(projects.length === 0){
    log('All tasks are done.');
    return;
  }

  var project = O.randElem(projects);
  var projectName = path.parse(project).name;
  var taskLocation = [projectName];

  var projectFile = path.join(tasksDir, project);
  var str = fs.readFileSync(projectFile, 'utf8');

  var task = new Task(projName(projectName));
  task.extract(str);

  log(task.rand().join('\n'));
}

class Task{
  constructor(name, subTasks=[]){
    this.name = name;
    this.subTasks = subTasks;
  }

  extract(str){
    this.subTasks.length = 0;

    var tasks = [this];
    var indents = [0];

    O.sanl(str).forEach(line => {
      var newIndent = line.match(/^\s*/)[0];

      line = line.substring(newIndent.length);
      newIndent = newIndent.replace(/\t/g, TAB).length;

      var task = new Task(line);

      while(newIndent < indents[indents.length - 1]){
        if(newIndent !== indents[indents.length - 2])
          syntax();

        tasks[tasks.length - 2].push(tasks.pop());
        indents.pop();
      }

      if(newIndent > indents[indents.length - 1]){
        tasks.push(tasks[tasks.length - 1].pop());
        indents.push(newIndent);
      }

      tasks[tasks.length - 1].push(task);
    });

    if(tasks.length !== 1 || indents.length !== 1 || indents[0] !== 0)
      syntax();
  }

  rand(){
    var arr = [this.name];

    if(!this.isEmpty()){
      O.randElem(this.subTasks).rand().forEach(elem => {
        arr.push(elem);
      });
    }

    return arr;
  }

  push(task){
    this.subTasks.push(task);
  }

  pop(){
    if(this.isEmpty()) return null;
    return this.subTasks.pop();
  }

  remove(task){
    var {subTasks} = this;
    var index;

    if(typeof task === 'string'){
      var name = task;

      index = subTasks.findIndex(task => {
        return task.name === name;
      });
    }else{
      index = subTasks.indexOf(task);
    }

    if(index === -1)
      err('Task not found');

    subTasks.splice(index, 1);
  }

  first(){
    if(this.isEmpty()) return null;
    return this.subTasks[0];
  }

  last(){
    if(this.isEmpty()) return null;
    return this.subTasks[this.subTasks.length - 1];
  }

  len(){
    return this.subTasks.length;
  }

  isEmpty(){
    return this.subTasks.length === 0;
  }

  toString(indent=0){
    var {subTasks} = this;

    var indentStr = TAB.repeat(indent);
    var str = `${indentStr}${this.name}`;

    indent++;

    subTasks.forEach(task => {
      str += `\n${task.toString(indent)}`;
    });

    return str;
  }
};

function projName(name){
  name = O.projectToName(name);

  if(name.startsWith('Fs '))
    name = `FS${name.substring(2)}`;

  return name;
}

function syntax(){
  err('Invalid syntax');
}

function err(msg){
  throw new Error(msg);
}