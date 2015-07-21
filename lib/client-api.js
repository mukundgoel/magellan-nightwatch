var _ = require("lodash"),
  methodmissing = require("methodmissing"),
  whitelist = require("./whitelist"),
  magellanErrorListener = require("./magellan-error-listener"),
  clc = require("cli-color");

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

var getProxiedClient = function (client, context, steps) {
  // `proxyObject` is returned as a proxied version of `client`
  // (the asynchronous command chain used in Magellan commands)
  //
  // Behind the scenes, Nightwatch is used to implement most of 
  // the commands. To reduce how many commands we need to write
  // from scratch, the Magellan API is expressed as a whitelist
  // to a set of Nightwatch commands.

  // The proxy is implement with methodmissing which intercepts
  // all function calls sent to the `proxyObject` and checks if
  // they're either in the assertion or command whitelists.

  var proxyObject = {
    assert: methodmissing({}, function(key, arg) {
      if (!_.contains(whitelist.assertions, key)) {
        throw new Error("Assertion assert.'" + key + "' is not allowed or doesn't exist");
      }
      return getProxiedClient(client.assert[key].apply(client.api, arg), context, steps);
    })
  };

  return methodmissing(proxyObject, function (key, arg) {
    if (!_.contains(whitelist.commands, key)) {
      throw new Error("Command '" + key + "' is not allowed or doesn't exist");
    }

    var chain = client;

    // Before any command in this whitelist, we harvest errors and inject our error listener
    var injectionWhitelist = ["clickEl", "getEl"];
    if (_.contains(injectionWhitelist, key)) {
      chain = gatherBrowserErrors(client, context, steps);
    }

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
