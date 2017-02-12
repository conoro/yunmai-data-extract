var fs = require('fs');
var toml = require('toml');
var semver = require('semver');

var installed = false;

function install(options) {
  if (installed) {
    return;
  }

  options = options || {};
  var parser = options.toml || toml;

  require.extensions['.toml'] = function(module, filename) {
    var data, option, src;
    if (semver.lt(process.versions.node, '0.10.0'))
      option = 'utf8';
    else
      option = {encoding: 'utf8'};
    src = fs.readFileSync(filename, option);
    try {
      data = parser.parse(src);
    } catch (e) {
      if (e.line && e.column) {
        var tomlCompileError = new Error("Error compiling " + filename + " at line " + e.line +
          ", column " + e.column + ": " + e.message);
        throw tomlCompileError;
      } else {
        throw e;
      }
    }
    module.exports = data;
  };

  installed = true;
}

module.exports = {
  install: install
};
