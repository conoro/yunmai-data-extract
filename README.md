# Intro
The [Yunmai weighing scales](http://www.iyunmai.com/us/light/) is an impressive inexpensive smart scales with Bluetooth. I bought mine from [GearBest](http://www.gearbest.com/monitoring-testing/pp_332025.html). If you install their app on your phone, it will connect to the scales and save all of your data, each time you weigh yourself. If you are on Android, you can opt for the Yunmai to save the data to [Google Fit](https://fit.google.com/fit/). You obviously need to have Google Fit installed too.

This App will access your weight data via the Google API and expose it on an end-point that can then be a source for IFTTT, so you can send the data to any target supported by IFTTT. The data will probably also be persisted locally so you have a local backup (TBD).

This is a work in progress.

Note that Yunmai can also send to Fitbit which may be an easier route in the end. TBC.

## Setting it up for yourself (instructions from Google Quickstart)
* Install [Node.js](https://nodejs.org/en/) and [Git](https://git-scm.com/)
* Use [this wizard](https://console.developers.google.com/start/api?id=fitness) to create or select a project in the Google Developers Console and automatically turn on the Fitness API. Click Continue, then Go to credentials.
* On the Add credentials to your project page, click the Cancel button.
* At the top of the page, select the OAuth consent screen tab. Select an Email address, enter a Product name if not already set, and click the Save button.
* Select the Credentials tab, click the Create credentials button and select OAuth client ID.
* Select the application type Other, enter the name "Yunmai Fitness", and click the Create button.
* Click OK to dismiss the resulting dialog.
* Click the file_download (Download JSON) button to the right of the client ID.
* Then in a console

```
git clone https://github.com/conoro/yunmai-google-fit-ifttt
cd yunmai-google-fit-ifttt
npm install googleapis --save
npm install google-auth-library --save
```
* Then copy the downloaded JSON file to that working directory and rename it client_secret.json
* Run the code with

```
node index.js
```

* You'll be presented with a URL. Paste that into a browser and give the permission requested on the screen that appears
* Copy the code that you are given back into the console
* You shouldn't need to do those two steps again. From now on, you can just run "node index.js" every time you want to see your Yunmai data

# Plan
 I'll be iterating on this as follows:

 - [x] Dump all weights and dates to console using date-range 01-01-2015 to Now
 - [ ] Save in local CSV file
 - [ ] Save in local IndexDB or maybe SQLite
 - [ ] Save to Google Sheets
 - [ ] Expose the data as simple JSON on open API end-point
 - [ ] Expose the data in whatever format makes sense for IFTTT

 Note, I probably won't bother with pagination since there is likely to only be one data point per day.

# TODO
* All of the above
* Investigate why Yunmai only saves weight and not all the other data from the scales
