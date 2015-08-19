var _ = require("lodash"),
  methodmissing = require("methodmissing"),
  magellanErrorListener = require("./magellan-error-listener"),
  clc = require("cli-color"),
  settings = require("./settings");

var gatherBrowserErrors = function (client, context, steps) {
  return client.execute(magellanErrorListener, [], function(result) {
    if (result) {
      result = result.value;
      if (result && result.length) {
        console.log(clc.yellowBright("\u2622  Uncaught browser errors detected"));
        result.forEach(function(err) {
          context.browserErrors.push(err);
        });
      }
    }
  });
};

var getSessionId = function (client) {
  return client.pause(1, function () {
    if (client.sessionId) {
      settings.sessionId = client.sessionId;
    }
  });
};

var getProxiedClient = function (client, context, steps) {
  // `proxyObject` is returned as a proxied version of `client`
  // (the asynchronous command chain used in Nightwatch.js commands)

  var proxyObject = {
    assert: methodmissing({}, function(key, arg) {
      return getProxiedClient(client.assert[key].apply(client.api, arg), context, steps);
    })
  };

  return methodmissing(proxyObject, function (key, arg) {
    var chain = client;

    // Before any command in this whitelist, we harvest errors and inject our error listener
    var errorDetectInjectionList = ["clickEl", "getEl", "moveToEl"];
    if (_.contains(errorDetectInjectionList, key)) {
      chain = gatherBrowserErrors(client, context, steps);
    }

    // We don't have many opportunities to get the session id, especially in a test case
    // that's destined to fail, so we attempt to get it here also. The Selenium session id
    // is useful for linking to things that are tied to the identity of an individual test
    // run, such as saucelabs video URLs, reports, logs, etc.
    chain = getSessionId(client);

    // gatherBrowserErrors() executes asynchronous client commands, so we
    // must execute the next command onto that returned chain.
    chain[key].apply(client.api, arg);

    return getProxiedClient(client, context, steps);
  });

};

module.exports = {
  initialize: function (context, steps) {
    Object.keys(steps).forEach(function(key){
      if (typeof steps[key] !== "function") return;

      //
      // For each step in the steps:
      //
      // 1. Keep a backup of the step for later execution.
      // 2. Replace the step with an alterate function that first replaces `client`
      //    with a proxied version, and then calls the original test function.
      // 3. The proxied `magellanProxy` ensures each subsequent step in the chain,
      //    including calls to functions on .assert, are proxied also.
      //
      var originalStep = steps[key];
      steps[key] = function(client) {
        var magellanProxy = getProxiedClient(client, context, steps);
        originalStep.call(context, magellanProxy);
      };
    });
  }
};
