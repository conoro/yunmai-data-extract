The [Yunmai weighing scales](http://www.iyunmai.com/us/light/) is an impressive inexpensive smart scales with Bluetooth. I bought mine from [GearBest](http://www.gearbest.com/monitoring-testing/pp_332025.html). If you install their app on your phone, it will connect to the scales and save all of your data, each time you weigh yourself. If you are on Android, you can opt for the Yunmai to save the data to [Google Fit](https://fit.google.com/fit/). You obviously need to have Google Fit installed too. 

However, the weight data that is saved doesn't seem to be visible (yet) in either the Google Fit Android App or the Web App. The data is there and is accessible using the Fit APIs.

This App will access your weight data via the Google API and expose it on an end-point that can then be a source for IFTTT, so you can send the data to any target supported by IFTTT. The data will probably also be persisted locally so you have a local backup (TBD).

First step is just to get the OAuth flow working. Then we can worry about sending the data elsewhere.

This is a work in progress.

Note that Yunmai can also send to Fitbit which may be an easier route in the end. TBC.

Also need to check why only weight is sent, considering how much data the Android App actually records.
