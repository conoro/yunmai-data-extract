toml-require
============

`require()` your `.toml` files in Node.js. Uses the [Node `toml` package](https://github.com/BinaryMuse/toml-node).

[![Build Status](https://travis-ci.org/BinaryMuse/toml-require.png?branch=master)](https://travis-ci.org/BinaryMuse/toml-require)

[![NPM](https://nodei.co/npm/toml-require.png?downloads=true)](https://nodei.co/npm/toml-require/)

Installation
------------

```
npm install [--save] toml-require
```

Usage
-----

```javascript
require('toml-require').install(options);
require('./myConfig.toml');
```

`options` is optional, but takes the following keys:

* `toml`: `toml-require` will use it's own version of `toml` by default, but if you want to specify a particular version of the `toml` package, you can require it yourself and pass it as this option (e.g. `require('toml-require').install({toml: require('toml')})`)

License
-------

toml-require is licensed under the MIT license. See the LICENSE file for more information.
