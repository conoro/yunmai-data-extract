/* yunmai-new-token

 Copyright Conor O'Neill 2017 (conor@conoroneill.com)
 LICENSE: MIT

This app grabs a new Yunmai code and token from a connected Android device.

Run this app with your phone connected via USB and then launch the Yunmai app.
After a few seconds it should print the new token and code to the console which you can then paste into conf.toml. If more than one pair is printed, use the last one presented, as the others may be just from the log history.

Note you must have [Android Platform Tools](https://developer.android.com/studio/releases/platform-tools.html#download) installed in Windows where adb can be found at C:\Program Files (x86)\Android\android-sdk\platform-tools\\adb.exe

Users of OSX and Linux can just tweak the adb command below to get what they need.

*/
var fs = require('fs');
var readline = require('readline');
var spawn = require('child_process').spawn;
const URL = require('url').URL;

require('toml-require');
require('./conf.toml');

adb = spawn('C:\\Program Files (x86)\\Android\\android-sdk\\platform-tools\\adb.exe', ['logcat']);

adb.stdout.on('data', function (data) {
  const regex = /http:\/\/int\.api\.iyunmai\.com\/api\/android\/scale\/[0-9]+\/list\.json\?code=[0-9]+&%26startTime=[0-9]+&lang=2&userId=[0-9]+&token=[0-9a-fA-F]+/mi;

  let m;

  var code = "not found";
  var token = "not found";

  if ((m = regex.exec(data)) !== null) {
      m.forEach((match, groupIndex) => {
          const myURL = new URL(match);
          code = myURL.searchParams.get('code');
          token = myURL.searchParams.get('token');
      });

      console.log("Code: " + code);
      console.log("Token: " + token);

  }
});

adb.stderr.on('data', function (data) {
  console.log('stderr: ' + data.toString());
});

adb.on('exit', function (code) {
  console.log('child process exited with code ' + code.toString());
});
