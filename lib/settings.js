var fs = require("fs");
var path = require("path");
var argv = require("yargs")
  .alias('c', 'config')
  .alias('v', 'verbose')
  .argv;

var getConfig = function () {

  // Try a number of config locations, starting with an explicitly-overriden one, if it exists.
  var configLocations = [];

  // Configurable config location via arguments
  if (argv.config) {
    configLocations.push(path.resolve(argv.config.trim()));
  }

  // Classic config location / still used by some repos
  configLocations.push(path.resolve("./nightwatch.json"));

  // The magellan boilerplate's default config location
  configLocations.push(path.resolve("./conf/config.json"));

  var triedConfs = [];

  // Try a config location, if it fails, try another, and so on. If we run out of config locations
  // to try, we exit with an error and indicate all the locations we tried
  var nextConf = function () {
    var configPath = configLocations.shift();
    triedConfs.push(configPath);

    var data;
    try {
      data = fs.readFileSync(configPath, "utf8");
    } catch (e) {
      // Eat this exception because we handle the lack of data below
    }

    if (!data) {
      if (configLocations.length === 0) {
        console.error("nightwatch-magellan has exhausted its search for nightwatch configuration file.");
        console.error("Tried configuration locations:");
        triedConfs.forEach(function (confLocation) {
          console.error("  " + confLocation);
        });
        process.exit(1);
      } else {
        return nextConf();
      }
    } else {
      console.log("nightwatch-magellan has found nightwatch configuration at ", configPath);
      var nightwatchConfig = JSON.parse(data);
      return {
        nightwatchConfig: nightwatchConfig
      };
    }
  };

  return nextConf();
};

var config = getConfig();

// Screenshot Output Control:
// Usage: --screenshots=path/to/temp/screenshot/directory
// This allows external test runners to set where screenshots from the screenshot() command will write their files.

var screenshotPath;
if (argv.screenshot_path) {
  screenshotPath = path.resolve(argv.screenshot_path);
} else {
  screenshotPath = path.resolve("./temp");
}

module.exports = {
  screenshotPath: screenshotPath,

  nightwatchConfig: config.nightwatchConfig,

  // True if we've launched Magellan as part of a cluster (i.e. from a magellan-director or similar event consumer)
  isWorker: !!argv.worker,

  COMMAND_MAX_TIMEOUT: 60000,

  verbose: argv.verbose,

  sessionId: undefined
};