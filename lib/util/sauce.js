// Some utility functions that help with integrating Magellan with SauceLabs

var https = require("https");
var verbose = require("yargs").argv.magellan_verbose;
var settings = require("../settings");

module.exports = {

  /**
   * isSauceTest
   *
   * @param {Object}    client      The nightwatch client object
   *
   * @return {Boolean}  True if the current tests are running on a remote SauceLabs environment
   *                    False if the current tests are running on a local Selenium server
   */
  isSauceTest: function (client) {
    // check for the presence of a sauce labs tunnel
    return client.options &&
      client.options.desiredCapabilities &&
      client.options.desiredCapabilities["tunnel-identifier"]
  },

  getTestUrl: function () {
    return "http://saucelabs.com/tests/" + settings.sessionId;
  },

  updateStats: function (client, failures, callback) {

    // TODO: add tag support: `"tags" : ["test","example"]`
    var data = JSON.stringify({
      "passed" : failures === 0,
      // TODO: remove this
      "build" : process.env.MAGELLAN_BUILD_ID,
      "public": "team"
    });

    if (verbose) {
      console.log("Data posting to SauceLabs job:");
      console.log(JSON.stringify(data));
    }
    var requestPath = "/rest/v1/"+ client.options.username +"/jobs/" + settings.sessionId;
    try {
      console.log("Updating saucelabs", requestPath);
      var req = https.request({
        hostname: "saucelabs.com",
        path: requestPath,
        method: "PUT",
        auth : client.options.username + ":" + client.options.accessKey,
        headers : {
          "Content-Type": "application/json",
          "Content-Length" : data.length
        }
      }, function(res) {
        res.setEncoding("utf8");
        if (verbose) {
          console.log("Response: ", res.statusCode, JSON.stringify(res.headers));
        }
        res.on("data", function (chunk) {
          if (verbose) {
            console.log("BODY: " + chunk);
          }
        });
        res.on("end", function () {
          callback();
        });
      });

      req.on("error", function(e) {
        console.log("problem with request: " + e.message);
      });
      req.write(data);
      req.end();
    } catch (err) {
      console.log("Error", err);
      callback();
    }
  }
};
