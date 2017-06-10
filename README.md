# Intro
The [Yunmai weighing scales](http://www.iyunmai.com/us/light/) is an impressive inexpensive smart scales with Bluetooth. I bought mine from [GearBest](http://www.gearbest.com/monitoring-testing/pp_332025.html). If you install their app on your phone, it will connect to the scales and save all of your data, each time you weigh yourself.

Whilst it isn't obvious, Yunmai is also saving all of your data to their Cloud. Unfortunately they have no webapp for accessing this data and no way for you to dump it out either.

If you are on Android, you can opt for the Yunmai app to save the data to [Google Fit](https://fit.google.com/fit/). You obviously need to have Google Fit installed too. Ditto Fitbit. However this has two problems. It only saves your weight to GoogleFit/FitBit and the recorded saving time is random, not when you actually took the measurement. This can even result in no data for one day and two values for the following day. All-in-all pretty useless.

By connecting my Galaxy S6 to Android Studio on my PC, I could look at the logs when the App was running. As expected there is an API server accepting/reporting your scales data. It returns good easy-to-understand JSON.

This App will access that data on their API and save it in various formats locally and optionally on Google Sheets for you to re-use elsewhere.

This is a work in progress.

LICENSE: MIT

## Setting it up for yourself (Android only for the moment)
* Install [Node.js](https://nodejs.org/en/), [Git](https://git-scm.com/) and [Android Platform Tools](https://developer.android.com/studio/releases/platform-tools.html#download). Then run:

```
git clone https://github.com/conoro/yunmai-data-extract
cd yunmai-data-extract
npm install
```
* rename conf-sample.toml to conf.toml

* If you want to save to Google Sheets, do the following:
  * Follow all of the [Step 1 steps here](https://developers.google.com/sheets/api/quickstart/nodejs) to use the Sheets API
  * Save the secrets file you get as client_secret.json in the yunmai-data-extract directory
  * Create a Google Sheet and a Tab in that Sheet and then edit conf.toml to set:
  * useGSheets = true
  * gSheetsId = "Get it from the part of the url after /d/ in the Google Sheet you want to use"
  * gSheetsTabId = "Get the Tab ID of the Sheet from the gid in url of the Google Sheet you want to use"

* Connect your Android phone to your PC via USB (making sure [USB debugging is enabled](http://www.howtogeek.com/129728/how-to-access-the-developer-options-menu-and-enable-usb-debugging-on-android-4.2/) on your phone). Run:

```
node yunmai-new-token.js
```

* Start the Yunmai App on the phone
* Once the required settings are dumped by yunmai-new-token.js, type CTRL-C to exit
* Take the final set of values it gives you for scale/userId/code/token and save them in conf.toml

* To get your scales weight data you can now run the main app at any time with

```
node index.js
```
* Note the phone does not have to be connected to your PC when you are running that code
* It will currently generate an Excel-compatible CSV file and a LevelDB database for you.
* You don't have to run it every day, just whenever you want a data dump from the Yunmai
* If you choose to save to Google Sheets then the first time you run it, you'll have to follow the authorisation flow presented. It's self-explanatory and you won't have to do it again.
* You can add your own columns to Google Sheets and they'll be preserved (e.g. daily notes). But manually added rows will be overwritten.
* Date format is proper European. Americans can edit the code to suit themselves ;-)

* If the code/token ever expires (you'll see errors when you run index.js) then you can easily get new ones by re-running:

```
node yunmai-new-token.js
```

* Note that yunmai-new-token.js is currently written for Windows and assumes adb is in C:\Program Files (x86)\Android\android-sdk\platform-tools\adb.exe. So you may need to edit slightly for OSX or Linux.

# Use of pkg
This code now also runs successfully as an almost standalone binary using [pkg](https://github.com/zeit/pkg). You can see I have committed a Windows binary to the repo (compiled using Node 7.x). So to run the app on Windows, you don't need a full npm install, just the .exe and the committed Leveldown files in the node_modules directory.

The command to build that binary is simply:

```
npm install -g pkg
pkg index.js --output=yunmai-data-extract.exe --targets=node7-win-x64

```

# Plan
 I'll be iterating on this as follows:

- [x] Dump all weights and dates to console
- [x] Save in local LevelDB
- [x] Save in local CSV file
- [x] Extract an updated access code/token from logs on phone
- [x] Save to Google Sheets
- [ ] Expose the data in whatever format makes sense for IFTTT (ATOM maybe?)
