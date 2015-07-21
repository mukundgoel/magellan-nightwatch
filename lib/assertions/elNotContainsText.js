// Assert that a selector does not contain a given text

var util = require("util"),
  events = require("events"),
  acquirejQuery = require("../acquire-jquery");

exports.assertion = function(selector, notExpectedContainedText) {

  this.message = util.format('Testing if selector <%s> does not contain text <%s>', selector, notExpectedContainedText);

  this.pass = function () {
    return this.result === true;
  };

  this.value = function () {
    return this.result;
  };

  this.expected = function () {
    return true;
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
          var regex = new RegExp(text);
          var elText = jQueryRef(sel).text();
          var result = !regex.exec(elText);

          if (!result) {
            // Collapse whitespaces and newlines in order to work around wonky
            // spacing caused by the DOM
            elText = elText.replace(/[\s|\n]+/g, ' ');
            result = !text.exec(elText);
          }

          result = result || false;

          return {
            result: result,
            message: "actual text() result:[" + jQueryRef(sel).text() + "]"
          };
        } else {
          return {
            result: false,
            message: "jQuery, document, or window not available"
          };
        }
      }, [selector, notExpectedContainedText, acquirejQuery], function(result) {
        if (result.value.result === false) {
          console.log("Debugging information for elNotContainsText");
          console.log(result.value.message);
        }
        self.result = result.value.result;
        callback();
      });

    return this;
  };

};
