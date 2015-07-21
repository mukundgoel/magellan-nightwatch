// Assert whether a selector has the value of a given text

var util = require("util"),
  events = require("events"),
  acquirejQuery = require("../acquire-jquery");

exports.assertion = function(selector, expectedContainedText) {

  this.message = util.format('Testing if selector <%s> has value <%s>', selector, expectedContainedText);

  this.pass = function () {
    return this.result === expectedContainedText;
  };

  this.value = function () {
    return this.result;
  };

  this.expected = function () {
    return expectedContainedText;
  };


  this.command = function (callback) {
    var self = this;

    // Measure the query length of the selector the context of the browser,
    // set the result and call the assertion command's callback()
    this.client.api
      .getEl(selector)
      .execute(function(sel, text, acquirejQuery) {

        var jQueryRef = (new Function(acquirejQuery))();

        if (jQueryRef) {
          var result = jQueryRef(sel).val();

          return {
            result: result,
            message: "actual value result:[" + jQueryRef(sel).val() + "]"
          };
        } else {
          return {
            result: false,
            message: "jQuery, document, or window not available"
          };
        }
      }, [selector, expectedContainedText, acquirejQuery], function(result) {
        if (result.value.result === false) {
          console.log("Debugging information for elValueContains");
          console.log(result.value.message);
        } else {
          if (Array.isArray(result.value.result)) {
            result.value.result = result.value.result[0];
          }
        }
        self.result = result.value.result;
        callback();
      });

    return this;
  };

};
