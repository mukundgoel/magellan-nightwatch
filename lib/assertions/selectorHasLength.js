// Assert whether a selector has a given expected query result length

var util = require("util"),
  events = require("events");

exports.assertion = function(selector, expectedLength) {

  this.message = util.format('Testing if selector <%s> has length <%s>', selector, expectedLength);

  this.pass = function () {
    return this.result === expectedLength;
  };

  this.value = function () {
    return this.result;
  };

  this.expected = function () {
    return expectedLength;
  };

  this.command = function (callback) {
    var self = this;

    // Measure the query length of the selector the context of the browser,
    // set the result and call the assertion command's callback()
    this.client.api.execute(function(sel, len) {
      return (window && window.$) ? $(sel).length : "jQuery not available";
    }, [selector, expectedLength], function(result) {
      self.result = result.value;
      callback();
    });

    return this;
  };

};
