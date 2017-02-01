/* yunmai-data-extract

 Copyright Conor O'Neill 2017 (conor@conoroneill.com)
 LICENSE: MIT

 This simple Node.js app downloads your weight data saved by a Yunmai weighing scales from their Cloud API

*/

var fs = require('fs');
var readline = require('readline');
var level = require('levelup');
const request = require('request-promise');

require('toml-require');
require('./conf.toml');

var db = level('yunmai_weights.db');
var wstream = fs.createWriteStream('yunmai_weights.csv');

// Convince Excel to read CSV correctly
wstream.write('sep=,\n');
wstream.write('createTime, weight, bmi, bmr, bone, fat, muscle, protein, resistance, somaAge, visFat, water\n');

// With optional params:
// uri: 'http://int.api.iyunmai.com/api/android/scale/'+ScaleID+'/list.json?code='+Code+'&%26startTime='+StartTime+'&lang=' + Lang + '&userId='+UserID+'&token='+Token,

// Code and Token definitely seem to be related. Token must be generated from the Code
// Some calls use a datestamp code e.g. 20170201 which seems to be reusable across other calls
// Note sure where the other codes come from
// Will also not be able to check expiry/renewal until it happens in real-life

const options = {
  method: 'GET',
  uri: 'http://int.api.iyunmai.com/api/android/scale/'+ScaleID+'/list.json?code='+Code+'&userId='+UserID+'&token='+Token,
  json: true
}

request(options)
  .then(function (response) {
    // Request was successful, use the response object at will
    console.dir(response, { depth: null })
    for (var i = 0, len = response.data.rows.length; i < len; i++) {

      // Save in LevelDB. Don't need to worry about repeated entries
      db.put(response.data.rows[i].createTime, response.data.rows[i], function (err) {
        if (err) return console.log('Error writing to LevelDB!', err); // some kind of I/O error
      });

      // Save in CSV. Just overwriting entire file each time, so no need to worry about repeated entries
      wstream.write(response.data.rows[i].createTime + ', ' + response.data.rows[i].weight + ', ' + response.data.rows[i].bmi + ', ' + response.data.rows[i].bmr + ', ' + response.data.rows[i].bone + ', ' + response.data.rows[i].fat + ', ' + response.data.rows[i].muscle + ', ' + response.data.rows[i].protein + ', ' + response.data.rows[i].resistance + ', ' + response.data.rows[i].somaAge + ', ' + response.data.rows[i].visFat + ', ' + response.data.rows[i].water + '\n');

      // Save in Google Sheets. Need to avoid repeated entries and overwriting manually entered columns

    }

    wstream.end();

  })
  .catch(function (err) {
    // Something bad happened, handle the error
    console.dir(err)
  })
