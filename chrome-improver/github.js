'use strict';

var nop = require('./nop.js');

var websiteName = 'https://github.com/';
var accountName = 'chrome-improver';
var repoName = 'chrome-improver';
var tabName = 'issues';

var githubUrl = getGithubUrl();

module.exports = {
  reportMsg
};

function reportMsg(msg = null, cb = nop){
  if(msg === null){
    msg = 'Unexpected error occured.';
  }

  var reportMsg = `Please report this issue to\n${githubUrl}`;
  var finalMsg = `${msg}\n${reportMsg}`;

  cb(finalMsg);
}

function getGithubUrl(){
  return resolveUrl([websiteName, accountName, repoName, tabName]);
}

function resolveUrl(frags){
  var resolvedUrl = frags.reduce((frag1, frag2) => {
    if(frag1.endsWith('/')) frag1 = frag1.substring(0, frag1.length - 1);
    if(frag2.endsWith('/')) frag2 = frag2.substring(1);

    return `${frag1}/${frag2}`;
  });

  return resolvedUrl;
}