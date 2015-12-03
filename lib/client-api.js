var settings = require("./settings");

var getSessionId = function (client) {
  return client.pause(1, function () {
    if (client.sessionId) {
      settings.sessionId = client.sessionId;
    }
  });
};

module.exports = {
  initialize: function (context, steps) {
    Object.keys(steps).forEach(function(key){
      if (typeof steps[key] !== "function") return;
      //
      // For each step in the test's steps:
      //
      // 1. Keep a backup of the step.
      // 2. Replace the step with an alterate function that first quickly grabs
      //    the selenium session id from the client object, and then calls the 
      //    original test function.
      //
      var originalStep = steps[key];
      steps[key] = function(client) {
        getSessionId(client);
        originalStep.call(context, client);
      };
    });
  }
};
