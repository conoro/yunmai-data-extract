/* yunmai-data-extract

 Copyright Conor O'Neill 2017 (conor@conoroneill.com)
 Portions Copyright Google
 LICENSE: MIT

 This simple Node.js app downloads your weight data saved by a Yunmai weighing scales from their Cloud API

*/

var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');
var level = require('levelup');

var db = level('yunmai_weights.db');
var wstream = fs.createWriteStream('yunmai_weights.csv');

// Convince Excel to read CSV correctly
wstream.write('sep=,\n');
wstream.write('Date, Weight(KG)\n');

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/fitness.googleapis.com-nodejs-quickstart.json
var SCOPES = ['https://www.googleapis.com/auth/fitness.body.read'];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'fitness.googleapis.com-nodejs-quickstart.json';

// Load client secrets from a local file.
fs.readFile('client_secret.json', function processClientSecrets(err, content) {
  if (err) {
    console.log('Error loading client secret file: ' + err);
    return;
  }
  // Authorize a client with the loaded credentials, then call the
  // Google Sheets API.
  authorize(JSON.parse(content), listWeights);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  var clientSecret = credentials.installed.client_secret;
  var clientId = credentials.installed.client_id;
  var redirectUrl = credentials.installed.redirect_uris[0];
  var auth = new googleAuth();
  var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, function(err, token) {
    if (err) {
      getNewToken(oauth2Client, callback);
    } else {
      oauth2Client.credentials = JSON.parse(token);
      callback(oauth2Client);
    }
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log('Authorize this app by visiting this url: ', authUrl);
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Enter the code from that page here: ', function(code) {
    rl.close();
    oauth2Client.getToken(code, function(err, token) {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client);
    });
  });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token));
  console.log('Token stored to ' + TOKEN_PATH);
}

/* Access Google Fit and dump all the Yunmai data that it holds for your account */
function listWeights(auth) {
  var fitness = google.fitness('v1');
  var epoch = new Date().getTime()*1000000;

// Date range is 01-01-2015 to Now (and set in datasetId)
fitness.users.dataSources.datasets.get({
  auth: auth,
  dataSourceId: "raw%3Acom.google.weight%3Acom.yunmai.scaleen%3AGoogleFitManager-%20weight",
  datasetId: "1420070401000000000-"+epoch,
  userId: "me"
}, function(err, response) {
  if (err) {
    console.log('The API returned an error: ' + err);
    return;
  }
  for (var i = 0, len = response.point.length; i < len; i++) {
    var weightTime = new Date(parseInt(response.point[i].modifiedTimeMillis));
    console.log(weightTime, response.point[i].value[0].fpVal);

    // Save in LevelDB. Don't need to worry about repeated entries
    db.put(response.point[i].modifiedTimeMillis, response.point[i].value[0].fpVal, function (err) {
      if (err) return console.log('Error writing to LevelDB!', err); // some kind of I/O error
    });

    // Save in CSV. Just overwriting entire file each time, so no need to worry about repeated entries
    var niceDate = weightTime.getFullYear() + "-" + (weightTime.getMonth()+1) + "-" + weightTime.getDate() + " " + weightTime.getHours() + ":" + weightTime.getMinutes() + ":" + weightTime.getSeconds();
    wstream.write(niceDate + ', ' + response.point[i].value[0].fpVal + '\n');

    // Save in Google Sheets. Need to avoid repeated entries and overwriting manually entered columns

  }
  wstream.end();

});
}
