/* yunmai-data-extract

 Copyright Conor O'Neill 2017 (conor@conoroneill.com)
 LICENSE: MIT

 OAuth portions Copyright Google

 This simple Node.js app downloads your weight data saved by a Yunmai weighing scales from their Cloud API and saves it to CSV, LevelDB and Google Sheets.

*/

const { google } = require("googleapis");
const express = require("express");
const opn = require("open");
const path = require("path");
const fs = require("fs");

const { GoogleAuth } = require("google-auth-library");
const { Level } = require("level");
const { EntryStream } = require("level-read-stream");
const request = require("request-promise");

require("toml-require");
require("./conf.toml");

var db = new Level("yunmai_weights.db", {
  valueEncoding: "json",
});
var wstream = fs.createWriteStream("yunmai_weights.csv");

// Convince Excel to read CSV correctly
wstream.write("sep=,\n");
wstream.write(
  "createTime, weight, bmi, bmr, bone, fat, skeletalMuscle, protein, resistance, somaAge, visFat, water\n"
);

// If any problems connecting to GSheets, delete ~/.credentials/yunmai-data-extract-gsheets.json
var TOKEN_DIR =
  (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE) +
  "/.credentials/";
var TOKEN_PATH = TOKEN_DIR + "yunmai-data-extract-gsheets.json";

if (useGSheets === true) {
  const keyfile = "client_secret.json";
  const keys = JSON.parse(fs.readFileSync(keyfile));
  const scopes = ["https://www.googleapis.com/auth/spreadsheets"];

  // Create an oAuth2 client to authorize the API call
  const client = new google.auth.OAuth2(
    keys.web.client_id,
    keys.web.client_secret,
    keys.web.redirect_uris[0]
  );

  // Generate the url that will be used for authorization
  authorizeUrl = client.generateAuthUrl({
    access_type: "offline",
    scope: scopes
  });

  const app = express();

  const server = app.listen(10001, '127.0.0.1', () => {});

  app.get("/", (req, res) => {
    const code = req.query.code;
    client.getToken(code, (err, tokens) => {
      if (err) {
        console.error("Error getting oAuth tokens:");
        throw err;
      }
      client.credentials = tokens;
      storeToken(tokens);
      res.send("Authentication successful! Please return to the console.");
      server.close();
      writeWeightData(client);
    });
  });

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, function(err, token) {
    if (err) {
      opn(authorizeUrl, { wait: false });
    } else {
      client.credentials = JSON.parse(token);
      writeWeightData(client);
      server.close();
    }
  });
} else {
  writeWeightData();
}

function storeToken(tokens) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != "EEXIST") {
      throw err;
    }
  }

  fs.writeFile(TOKEN_PATH, JSON.stringify(tokens), function(err) {
    if (err) throw err;
    console.log("Token stored to " + TOKEN_PATH);
  });
}

// Main function which does the work
function writeWeightData(auth) {
  // With optional params:
  // August 2019: http://intdata.iyunmai.com/api/android/scale/list.json?code='+code+'&%26startTime='+epochtime+'&lang='+lang+'&userId='+userId+'&versionCode=2&token='+token
  // Code and Token definitely seem to be related. Token must be generated from the Code
  // Some calls use a datestamp code e.g. 20170201 which seems to be reusable across other calls
  // Note sure where the other codes come from
  // Will also not be able to check expiry/renewal until it happens in real-life

  var d = new Date();
  d.setFullYear(2019, 9, 1);
  d.setHours(0, 0, 0, 0);
  var epochtime = d.getTime() / 1000;

  var uri = `https://intdata.iyunmai.com/api/android/scale/list.json?code=${code}&%26startTime=${epochtime}&lang=2&versionCode=2&signVersion=3&userId=${userId}`
  const options = {
    method: "GET",
    uri: uri,
    json: true,
    headers: {
      'user-agent': 'yunmai_android',
      'accept-encoding': 'gzip',
      'accesstoken': token
    }
  };

  request(options)
    .then(function(response) {
      if (response.result.code !== 0) {
        throw `Unexpected response code ${response.result.code}, response: ${JSON.stringify(response.result)}`
      }
      // Request was successful, use the response object at will
      console.dir(response, {
        depth: null
      });
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

      if (useGSheets === true) {
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
                      stringValue: "skeletalMuscle"
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
      }
      // read the whole LevelDB store as a stream and generate CSV and update GSheets
      new EntryStream(db)
        .on("data", function (data) {
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
              data.value.skeletalMuscle +
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

          if (useGSheets === true) {
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
                          numberValue: data.value.skeletalMuscle
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
          }
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
