/* Assert whether the element's length is greater than 0. The assertion can be used for verifying element's length (example <li>s length)
 * OR for element's text(), val() or html() value.
 * The assertion accepts 3 params : selector, selectorUsing and length
 * asserting whether the length of array returned by class is more than 0: client.assert.elLengthGreaterThan('.js-flyout-toggle-row', 'length', 0);
 * asserting whether the text of the element is present or not (we don't care what is the value, just want to assert that the value is not null) : .assert.elLengthGreaterThan('[data-id="actual_color"] .js-variant-name', 'text',  0);
 */
var util = require("util"),
  events = require("events"),
  acquirejQuery = require("../acquire-jquery");

exports.assertion = function(selector, selectUsing, lengthToCompare) {

  this.message = util.format('Testing if selector <%s> length is greater than <%s>', selector, lengthToCompare);

  this.pass = function() {
    return this.result === true;
  };

  this.value = function() {
    return this.lengthRecieved;
  };

  this.expected = function() {
    return "length greater than " + lengthToCompare;
  };

  this.command = function(callback) {
    var self = this;
    this.client.api
    .getEl(selector)
    .execute(function(sel, selectUsing, lengthToCompare, acquirejQuery) {
      var jQueryRef = (new Function(acquirejQuery))();

      if (jQueryRef) {
        var use = selectUsing.toLowerCase();
        var lengthRecieved; // this is just created to show the correct length when troubleshooting for assertion failure  
        if (use == 'text') {
          lengthRecieved = jQueryRef(sel).text().trim().length;
        } else if (use == 'value') {
          lengthRecieved = jQueryRef(sel).val().trim().length;
        } else if (use == 'html') {
          lengthRecieved = jQueryRef(sel).html().trim().length;
        } else if (use == 'length') {
          lengthRecieved = jQueryRef(sel).length;
        } else {
          lengthRecieved = "Invalid selectUsing param";
        }
        var result = (use == 'text' && lengthRecieved > lengthToCompare)
                  || (use == 'value' && lengthRecieved > lengthToCompare)
                  || (use == 'html' && lengthRecieved > lengthToCompare)
                  || (use == 'length' && lengthRecieved > lengthToCompare)
                  ? true : false;
        return {
          result: result,
          message: "actual result:[" + lengthRecieved + "]",
          lengthRecieved: lengthRecieved
        }
      } else {
        return {
          result: false,
          message: "jQuery, document, or window not available"
        }
      }
    }, [selector, selectUsing, lengthToCompare, acquirejQuery], function(result) {
      if (result.value.result === false) {
        console.log("Debugging information for elLengthGreaterThan");
        console.log(result.value.message);
      }
      self.result = result.value.result;
      self.lengthRecieved = result.value.lengthRecieved;
      callback();
    });
  };
};