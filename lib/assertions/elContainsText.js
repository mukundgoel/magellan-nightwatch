// Assert whether a selector contains a given text

var util = require("util"),
  events = require("events"),
  acquirejQuery = require("../acquire-jquery");

exports.assertion = function(selector, expectedContainedText) {

  this.message = util.format('Testing if selector <%s> contains text <%s>', selector, expectedContainedText);

  this.pass = function () {
    return (this.result === expectedContainedText) || (new RegExp(expectedContainedText).exec(this.result));
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

        var checkString = function(elText, text) {
          var result = elText.indexOf(text) > -1 ? text : false;

          if (!result) {
            var regex = new RegExp(text);
            result = regex.exec(elText);
          }

          return result;
        };

        var jQueryRef = (new Function(acquirejQuery))();

        if (jQueryRef) {
          var elText = jQueryRef(sel).text();
          var result = checkString(elText, text);

          if (!result) {
            // Collapse whitespaces and newlines in order to work around wonky
            // spacing caused by the DOM
            elText = elText.replace(/[\s|\n]+/g, ' ');
            result = checkString(elText, text);
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
      }, [selector, expectedContainedText, acquirejQuery], function(result) {
        if (result.value.result === false) {
          console.log("Debugging information for elContainsText");
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
