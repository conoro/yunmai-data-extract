# Intro

_NOTE: Code currently (September 2019) working again

The [Yunmai weighing scales](http://www.iyunmai.com/us/light/) is an impressive inexpensive smart scales with Bluetooth. I bought mine from [GearBest](http://www.gearbest.com/monitoring-testing/pp_332025.html). If you install their app on your phone, it will connect to the scales and save all of your data, each time you weigh yourself.

Whilst it isn't obvious, Yunmai is also saving all of your data to their Cloud. Unfortunately they have no webapp for accessing this data and no way for you to dump it out either.

This App will access that data on their API and save it in various formats locally and optionally on Google Sheets for you to re-use elsewhere.

LICENSE: MIT

## Setting it up for yourself (Android only for the moment)

- Install [Node.js](https://nodejs.org/en/), [Git](https://git-scm.com/). Then run:

```
git clone https://github.com/conoro/yunmai-data-extract
cd yunmai-data-extract
npm install
```

- rename conf-sample.toml to conf.toml

- Install and run a packet sniffing App like [Packet Capture by Grey Shirts](https://play.google.com/store/apps/details?id=app.greyshirts.sslcapture&hl=en_IE) on your Android phone
- Start capturing data for the Yunmai App inside Packet Capture
- Start the Yunmai App on the phone and interact with some of the data menus
- Go back to Packet Capture and stop the data capture
- Tap into each of the packets and find requests that access http://intdata.iyunmai.com
- Edit conf.toml and use the info from the requests as follows:

```
userId = userId variable from requests
code = code variable from requests
token = token variable from requests
```

- To get your scales weight data you can now run the main app at any time with

```
node index.js
```

- It will currently generate an Excel-compatible CSV file and a LevelDB database for you.
- You don't have to run it every day, just whenever you want a data dump from the Yunmai

- If you want to save to Google Sheets, do the following:
  - Enable the GSheets API in the [Google API Console](https://console.developers.google.com)
  - Create a new set of Credentials of type Oauth Client ID
  - Select Web Application as the App type
  - Fill out the name field
  - Skip the Authorized JavaScript origins
  - Enter `http://127.0.0.1:3000` as the Authorized redirect URIs
  - Click "Create"
  - Save the secrets file you get as client_secret.json in the yunmai-data-extract directory
  - Create a Google Sheet and a Tab in that Sheet and then edit conf.toml to set:
  - useGSheets = true
  - gSheetsId = "Get it from the part of the url after /d/ in the Google Sheet you want to use"
  - gSheetsTabId = "Get the Tab ID of the Sheet from the gid in url of the Google Sheet you want to use"

* If you choose to save to Google Sheets then the first time you run it, you'll have to follow the authorisation flow presented. It's self-explanatory and you won't have to do it again.
* If you ever have auth issues with GSheets, just delete ~/.credentials/yunmai-data-extract-gsheets.json and re-run
* You can add your own columns to Google Sheets and they'll be preserved (e.g. daily notes). But manually added rows will be overwritten.
* Date format is proper European. Americans can edit the code to suit themselves ;-)

* If the Yunmai code/token ever expires (you'll see errors when you run index.js) then you can easily get new ones by re-running Packet Capture

