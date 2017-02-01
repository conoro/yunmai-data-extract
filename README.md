# Intro
The [Yunmai weighing scales](http://www.iyunmai.com/us/light/) is an impressive inexpensive smart scales with Bluetooth. I bought mine from [GearBest](http://www.gearbest.com/monitoring-testing/pp_332025.html). If you install their app on your phone, it will connect to the scales and save all of your data, each time you weigh yourself.

Whilst it isn't obvious, Yunmai is also saving all of your data to their Cloud. Unfortunately they have no webapp for accessing this data and no way for you to dump it out either.

If you are on Android, you can opt for the Yunmai app to save the data to [Google Fit](https://fit.google.com/fit/). You obviously need to have Google Fit installed too. Ditto Fitbit. However this has two problems. It only saves your weight to GoogleFit/FitBit and the recorded saving time is random, not when you actually took the measurement. This can even result in no data for one day and two values for the following day. All-in-all pretty useless.

By connecting my Galaxy S6 to Android Studio on my PC, I could look at the logs when the App was running. As expected there is an API server accepting/reporting your scales data. It returns good easy-to-understand JSON.

This App will access that data on their API and save it in various formats locally for you to re-use elsewhere.

This is a work in progress.

LICENSE: MIT

## Setting it up for yourself (instructions from Google Quickstart)
* Install [Node.js](https://nodejs.org/en/) and [Git](https://git-scm.com/)

```
git clone https://github.com/conoro/yunmai-data-extract
cd yunmai-data-extract
npm install
```
* Run the code with

```
node index.js
```

# Plan
 I'll be iterating on this as follows:

- [ ] Dump all weights and dates to console
- [ ] Save in local LevelDB
- [ ] Save in local CSV file
- [ ] Save to Google Sheets
- [ ] Expose the data in whatever format makes sense for IFTTT (ATOM maybe?)
- [ ] I'll need to figure out how to get an access token by looking further at the Android logs. For the moment (or until it expires), I'll use the hard-coded one for me that I got in the logs.

 Note, I probably won't bother with pagination since there is likely to only be one data point per day.


# TODO
* All of the above (v1.0.0 used the Google Fit API but since that flow works so poorly, I'm giving up on that)
