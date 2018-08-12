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
var level = require("levelup");
const request = require("request-promise");

require("toml-require");
require("./conf.toml");

var db = level("yunmai_weights.db", {
  valueEncoding: "json"
});
var wstream = fs.createWriteStream("yunmai_weights.csv");

// Convince Excel to read CSV correctly
wstream.write("sep=,\n");
wstream.write(
  "createTime, weight, bmi, bmr, bone, fat, muscle, protein, resistance, somaAge, visFat, water\n"
);

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
  // 2017-02: `http://int.api.iyunmai.com/api/android/scale/${scale}/list.json?code=${code}&%26startTime=${startTime}&lang=${lang}&userId=${userId}&token=${token}`
  // 2017-11: `http://intapi.iyunmai.com/api/android/scale/${scale}/list.json?code=${code}&startTime=${startTime}&lang=${lang}&userId=${userId}&token=${token}`
  // 2018-08: `http://intdata.iyunmai.com/api/android/scale/list.json?code=${code}&%26startTime=${startTime}&lang=${lang}&userId=${userId}&versionCode=2&token=${token}`
  //
  // Code and Token definitely seem to be related. Token must be generated from the Code
  // Some calls use a datestamp code e.g. 20170201 which seems to be reusable across other calls
  // Note sure where the other codes come from
  // Will also not be able to check expiry/renewal until it happens in real-life

  var d = new Date();
  d.setHours(0, 0, 0, 0);
  var epochtime = d.getTime() / 1000;

  const options = {
    method: "GET",
    uri: "http://intdata.iyunmai.com/api/android/scale/list.json",
    qs: {
      code: code,
      startTime: epochtime,
      lang: 2,
      userId: userId,
      versionCode: 2,
      token: token
    },
    json: true
  };

  request(options)
    .then(function(response) {
      // Request was successful, use the response object at will
      console.dir(response, { depth: null });
      for (var i = 0, len = response.data.rows.length; i < len; i++) {
        // Save in LevelDB. Don't need to worry about repeated entries. Automatically handles incremental updates too
        db.put(
          response.data.rows[i].createTime,
          response.data.rows[i],
          function(err) {
            if (err) return console.log("Error writing to LevelDB!", err); // some kind of I/O error
          }
        );
      }

      console.log("LevelDB updated");

      var sheets = google.sheets("v4");
      var requests = [];
      var row = 0;
      var column = 0;

      // Set Column Headers
      requests.push({
        updateCells: {
          start: {
            sheetId: gSheetsTabId,
            rowIndex: row,
            columnIndex: column
          },
          rows: [
            {
              values: [
                {
                  userEnteredValue: {
                    stringValue: "Date"
                  },
                  userEnteredFormat: {
                    textFormat: {
                      bold: true
                    }
                  }
                },
                {
                  userEnteredValue: {
                    stringValue: "Weight (KG)"
                  },
                  userEnteredFormat: {
                    textFormat: {
                      bold: true
                    }
                  }
                },
                {
                  userEnteredValue: {
                    stringValue: "BMI"
                  },
                  userEnteredFormat: {
                    textFormat: {
                      bold: true
                    }
                  }
                },
                {
                  userEnteredValue: {
                    stringValue: "BMR"
                  },
                  userEnteredFormat: {
                    textFormat: {
                      bold: true
                    }
                  }
                },
                {
                  userEnteredValue: {
                    stringValue: "Bone"
                  },
                  userEnteredFormat: {
                    textFormat: {
                      bold: true
                    }
                  }
                },
                {
                  userEnteredValue: {
                    stringValue: "Body Fat"
                  },
                  userEnteredFormat: {
                    textFormat: {
                      bold: true
                    }
                  }
                },
                {
                  userEnteredValue: {
                    stringValue: "Muscle"
                  },
                  userEnteredFormat: {
                    textFormat: {
                      bold: true
                    }
                  }
                },
                {
                  userEnteredValue: {
                    stringValue: "Protein"
                  },
                  userEnteredFormat: {
                    textFormat: {
                      bold: true
                    }
                  }
                },
                {
                  userEnteredValue: {
                    stringValue: "Resistance"
                  },
                  userEnteredFormat: {
                    textFormat: {
                      bold: true
                    }
                  }
                },
                {
                  userEnteredValue: {
                    stringValue: "Body Age"
                  },
                  userEnteredFormat: {
                    textFormat: {
                      bold: true
                    }
                  }
                },
                {
                  userEnteredValue: {
                    stringValue: "Visceral Fat"
                  },
                  userEnteredFormat: {
                    textFormat: {
                      bold: true
                    }
                  }
                },
                {
                  userEnteredValue: {
                    stringValue: "Water"
                  },
                  userEnteredFormat: {
                    textFormat: {
                      bold: true
                    }
                  }
                }
              ]
            }
          ],
          fields: "userEnteredValue,userEnteredFormat.textFormat"
        }
      });

      row++;

      // read the whole LevelDB store as a stream and generate CSV and update GSheets
      db
        .createReadStream()
        .on("data", function(data) {
          // Save in CSV. Just overwriting entire file each time, so no need to worry about repeated entries
          wstream.write(
            data.value.createTime +
              ", " +
              data.value.weight +
              ", " +
              data.value.bmi +
              ", " +
              data.value.bmr +
              ", " +
              data.value.bone +
              ", " +
              data.value.fat +
              ", " +
              data.value.muscle +
              ", " +
              data.value.protein +
              ", " +
              data.value.resistance +
              ", " +
              data.value.somaAge +
              ", " +
              data.value.visFat +
              ", " +
              data.value.water +
              "\n"
          );

          //Save in Google Sheets. Just overwriting entire set of columns each time, so no need to worry about repeated entries
          //Shouldn't impact any extra columns that users add themselves
          requests.push({
            updateCells: {
              start: {
                sheetId: gSheetsTabId,
                rowIndex: row,
                columnIndex: column
              },
              rows: [
                {
                  values: [
                    {
                      userEnteredValue: {
                        stringValue: data.value.createTime
                      },
                      userEnteredFormat: {
                        numberFormat: {
                          type: "DATE",
                          pattern: "dd/mm/yyyy hh:mm"
                        }
                      }
                    },
                    {
                      userEnteredValue: {
                        numberValue: data.value.weight
                      }
                    },
                    {
                      userEnteredValue: {
                        numberValue: data.value.bmi
                      }
                    },
                    {
                      userEnteredValue: {
                        numberValue: data.value.bmr
                      }
                    },
                    {
                      userEnteredValue: {
                        numberValue: data.value.bone
                      }
                    },
                    {
                      userEnteredValue: {
                        numberValue: data.value.fat
                      }
                    },
                    {
                      userEnteredValue: {
                        numberValue: data.value.muscle
                      }
                    },
                    {
                      userEnteredValue: {
                        numberValue: data.value.protein
                      }
                    },
                    {
                      userEnteredValue: {
                        numberValue: data.value.resistance
                      }
                    },
                    {
                      userEnteredValue: {
                        numberValue: data.value.somaAge
                      }
                    },
                    {
                      userEnteredValue: {
                        numberValue: data.value.visFat
                      }
                    },
                    {
                      userEnteredValue: {
                        numberValue: data.value.water
                      }
                    }
                  ]
                }
              ],
              fields: "userEnteredValue, userEnteredFormat.numberFormat"
            }
          });
          row++;
        })
        .on("close", function() {
          db.close();
          wstream.end();
          console.log("CSV updated");

          var batchUpdateRequest = {
            requests: requests
          };

          if (useGSheets === true) {
            sheets.spreadsheets.batchUpdate(
              {
                auth: auth,
                spreadsheetId: gSheetsId,
                resource: batchUpdateRequest
              },
              function(err, response) {
                if (err) {
                  // Handle error
                  console.log(err);
                }
                console.log("Google Sheets updated");
              }
            );
          }
        });
    })
    .catch(function(err) {
      // Something bad happened, handle the error
      console.dir(err);
    });
}
