# Intro
The [Yunmai weighing scales](http://www.iyunmai.com/us/light/) is an impressive inexpensive smart scales with Bluetooth. I bought mine from [GearBest](http://www.gearbest.com/monitoring-testing/pp_332025.html). If you install their app on your phone, it will connect to the scales and save all of your data, each time you weigh yourself.

Whilst it isn't obvious, Yunmai is also saving all of your data to their Cloud. Unfortunately they have no webapp for accessing this data and no way for you to dump it out either.

If you are on Android, you can opt for the Yunmai app to save the data to [Google Fit](https://fit.google.com/fit/). You obviously need to have Google Fit installed too. Ditto Fitbit. However this has two problems. It only saves your weight to GoogleFit/FitBit and the recorded saving time is random, not when you actually took the measurement. This can even result in no data for one day and two values for the following day. All-in-all pretty useless.

By connecting my Galaxy S6 to Android Studio on my PC, I could look at the logs when the App was running. As expected there is an API server accepting/reporting your scales data. It returns good easy-to-understand JSON.

This App will access that data on their API and save it in various formats locally for you to re-use elsewhere.

This is a work in progress.

LICENSE: MIT

## Setting it up for yourself (Android only for the moment)
* Install [Node.js](https://nodejs.org/en/), [Git](https://git-scm.com/) and [Android Platform Tools](https://developer.android.com/studio/releases/platform-tools.html#download)

```
git clone https://github.com/conoro/yunmai-data-extract
cd yunmai-data-extract
npm install
```
* rename conf-sample.toml to conf.toml
* Connect your Android phone to your PC via USB. Run adb from the Android Platform tools as follows:

```
adb logcat | grep int.api.iyunmai.com/api/android/scale/
```
* Start the Yunmai App on the phone
* Find the values for scale, userId, code and token in one of the API calls returned by adb. Save in conf.toml
* Run the code with

```
node index.js
```

* If the code/token expires then you can easily get new ones by running the following with your Android phone connected to your PC:

```
node yunmai-new-token.js
```

* Note that yunmai-new-token.js is currently written for Windows and assumes adb is in C:\Program Files (x86)\Android\android-sdk\platform-tools\adb.exe. So you may need to edit slightly for OSX or Linux.

# Plan
 I'll be iterating on this as follows:

- [x] Dump all weights and dates to console
- [x] Save in local LevelDB
- [x] Save in local CSV file
- [x] Extract an updated access code/token from logs on phone
- [ ] Save to Google Sheets
- [ ] Expose the data in whatever format makes sense for IFTTT (ATOM maybe?)
