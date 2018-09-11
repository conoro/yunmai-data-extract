/* yunmai-data-extract

 Copyright Conor O'Neill 2017 (conor@conoroneill.com)
 LICENSE: MIT

 OAuth portions Copyright Google

 This simple Node.js app downloads your weight data saved by a Yunmai weighing scales from their Cloud API and saves it to CSV, LevelDB and Google Sheets.

*/

var fs = require("fs");
var readline = require("readline");
var google = require("googleapis");
var googleAuth = require("google-auth-library");
const request = require("request-promise");

require("toml-require");
require("./conf.toml");

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/sheets.googleapis.com-nodejs-quickstart.json
var SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
var TOKEN_DIR =
  (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE) +
  "/.credentials/";
var TOKEN_PATH = TOKEN_DIR + "sheets.googleapis.com-nodejs-quickstart.json";

// Load client secrets from a local file.
fs.readFile("client_secret.json", function processClientSecrets(err, content) {
  if (err) {
    console.log("Error loading client secret file: " + err);
    return;
  }
  // Authorize a client with the loaded credentials, then call the
  // Google Sheets API.
  authorize(JSON.parse(content), writeWeightData);
});

// Create an OAuth2 client with the given credentials, and then execute the given callback function.
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

// Get and store new token after prompting for user authorization, and then execute the given callback with the authorized OAuth2 client.
function getNewToken(oauth2Client, callback) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES
  });
  console.log("Authorize this app by visiting this url: ", authUrl);
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question("Enter the code from that page here: ", function(code) {
    rl.close();
    oauth2Client.getToken(code, function(err, token) {
      if (err) {
        console.log("Error while trying to retrieve access token", err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client);
    });
  });
}

// Store GSheets token to disk be used in later program executions.
function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != "EEXIST") {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token));
  console.log("Token stored to " + TOKEN_PATH);
}

// Main function which does the work
function writeWeightData(auth) {
  // With optional params:
  // old uri: 'http://int.api.iyunmai.com/api/android/scale/'+scale+'/list.json?code='+code+'&%26startTime='+startTime+'&lang=' + lang + '&userId='+userId+'&token='+token,
  // new uri: http://intapi.iyunmai.com/api/android/scale/'+scale+'/list.json?code='+code+'&startTime='+startTime+'&lang='+lang+'&userId='+userId+'&token='+token

  // Code and Token definitely seem to be related. Token must be generated from the Code
  // Some calls use a datestamp code e.g. 20170201 which seems to be reusable across other calls
  // Note sure where the other codes come from
  // Will also not be able to check expiry/renewal until it happens in real-life

  var d = new Date();
  d.setHours(0, 0, 0, 0);
  var epochtime = d.getTime() / 1000;

  const options = {
    method: "GET",
    uri:
      "http://intapi.iyunmai.com/api/android/scale/" +
      scale +
      "/list.json?code=" +
      code +
      "&lang=2" +
      "&userId=" +
      userId +
      "&token=" +
      token,
    json: true
  };

  request(options)
    .then(function(response) {
      // Request was successful, use the response object at will
      console.dir(response, { depth: null });
      for (var i = 0, len = response.data.rows.length; i < len; i++) {
        console.log(response.data.rows[i].createTime, response.data.rows[i]);
      }
    })
    .catch(function(err) {
      // Something bad happened, handle the error
      console.dir(err);
    });
}
