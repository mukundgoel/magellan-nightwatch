// Base test class that should be used for all Magellan tests
//
// Exposes a before/after function that are run *per-file*

var sauce = require("./util/sauce"),
  magellanAPI = require("./client-api"),
  clc = require("cli-color"),
  Q = require("q"),
  settings = require("./settings.js");

var logUncaughtBrowserErrors = function (browserErrors) {

  var deferred = Q.defer();

  if (browserErrors.length > 0) {
    console.log(clc.yellowBright("\n\u2622  Uncaught browser errors detected:"));

    browserErrors.forEach(function(err, N){
      var msg = err.message != "" ? (" : " + err.message) : "";
      console.log(clc.yellowBright("\n" + (N + 1) + ") @ " + err.time + msg));

      if (err.name !== "") {
        console.log(clc.yellowBright("      name:", err.name));
      }

      if (err.filename !== "") {
        console.log(clc.yellowBright("  filename:", err.filename));
      }

      console.log(clc.yellowBright("      line:", err.line));
      console.log(clc.yellowBright("    column:", err.column));

      if (err.stack) {
        console.log(clc.yellowBright("     stack:", err.stack));
      }
    });
  }

  deferred.resolve();
  return deferred.promise;
};

var closeSession = function(client) {

  var deferred = Q.defer();

  client.end();
  deferred.resolve();
  return deferred.promise;
};

var updateSauceStats = function(client, numFailures) {

  var deferred = Q.defer();

  if (sauce.isSauceTest(client)) {
    console.info("Test video at: " + sauce.getTestUrl());
    sauce.updateStats(client, numFailures, deferred.resolve);
  } else {
    deferred.resolve();
  }

  return deferred.promise;
};

var emitStartedTest = function(client) {
  if (settings.isWorker === true) {
    var testName = client.currentTest.module;

    process.send({
      type: "worker-status",
      status: "started",
      name: testName
    });
  }
};

var emitFinishedTest = function(client, numFailures, browserErrors) {

  if (settings.isWorker === true) {
    var testName = client.currentTest.module;
    process.send({
      type: "worker-status",
      status: "finished",
      name: testName,
      passed: (numFailures === 0) ? true : false,
      metadata: {
        resultURL: sauce.getTestUrl(client),
        browserErrors: browserErrors
      }
    });
  }

  var deferred = Q.defer();
  deferred.resolve();
  return deferred.promise;
};

var MagellanBaseTest = function (steps) {
  var self = this;
  var enumerables = ["before", "after", "beforeEach", "afterEach"];

  // Proxy Magellan commands destined for Nightwatch API
  magellanAPI.initialize(this, steps);

  // copy incoming steps onto self
  Object.keys(steps).forEach(function (k) {
    if (typeof steps[k] === "function") {
      Object.defineProperty(self, k, { enumerable: true, value: steps[k].bind(self) });
    } else {
      Object.defineProperty(self, k, { enumerable: true, value: steps[k] });
    }
  });

  enumerables.forEach(function (k) {
    var srcFn = self[k] || MagellanBaseTest.prototype[k];
    if (srcFn) {
      Object.defineProperty(self, k, { enumerable: true, value: srcFn });
    }
  });

  Object.defineProperty(this, "browserErrors", { enumerable: false, value: [] });
};

MagellanBaseTest.prototype = {
  before: function (client) {
  },

  /*
   * Runs at the beginning of each step
   */
  beforeEach: function (client, callback) {
    // Note: Sometimes, the session hasn't been established yet but we have control.
    if (client.sessionId) {
      settings.sessionId = client.sessionId;
    }

    // Tell reporters that we are starting this test.
    // This logic would ideally go in the "before" block and not "beforeEach"
    // but Nightwatch does not give us access to the module (file) name in the
    // "before" block, so we have to put it here (hence the `notifiedListenersOfStart`
    // flag, so that we only perform this update once per-file.)
    if (!this.notifiedListenersOfStart) {
      emitStartedTest(client);
      
      if (settings.isWorker === true) {
        this.handleExternalMessage = function (message) {
          if (message && message.signal === "bail") {
            client.assert.equal(false, true, message.customMessage || "Test killed.");
          }
        };
        process.addListener("message", this.handleExternalMessage);
      }

      this.notifiedListenersOfStart = true;
    }
    callback();
  },

  /*
   * Runs at the beginning of each step
   */
  afterEach: function (client, callback) {
    if (client.sessionId) {
      settings.sessionId = client.sessionId;
    }

    this.failures = this.failures || [];
    this.passed = (this.passed || 0) + this.results.passed;

    // keep track of failed tests for reporting purposes
    if (this.results.failed || this.results.errors) {
      // Note: this.client.currentTest.name is also available to display
      // the name of the specific step within the test where we've failed.
      this.failures.push(this.client.currentTest.module);
    };
    callback();
  },

  /*
   * Runs at the end of each file
   */
  after: function (client, callback) {
    var self = this;

    var numFailures = self.failures.length;
    var totalTests = self.passed + self.failures.length;

    if (settings.isWorker === true && this.handleExternalMessage) {
      process.removeListener("message", this.handleExternalMessage);
    }

    logUncaughtBrowserErrors(self.browserErrors)
      .then(function() {
        return emitFinishedTest(client, numFailures, self.browserErrors);
      })
      .then(function() { return updateSauceStats(client, numFailures); })
      .then(function() { return closeSession(client); })
      .then(function() {
        callback();
      });
  }
};

module.exports = MagellanBaseTest;
