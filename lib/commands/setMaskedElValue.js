//
// A more reliable version setValue() that does the same thing as setElValue() except
// is made to work well with masked inputs like mm/dd/yyyy and (xxx) yyy-zzzz , etc.
// These types of inputs often have actual text already in the input and exert control
// over caret position as the user types. For this reason, we try to enter text with
// care and attempt to place the caret in a beginning position.
//

var util = require("util");
var CheckVisibleAndClick = require("./lib/checkVisibleAndClick");
var acquirejQuery = require("../acquire-jquery");

// Wait until we've seen a selector as :visible SEEN_MAX times, with a
// wait for WAIT_INTERVAL milliseconds between each visibility test.
var settings = require("../settings");
var MAX_TIMEOUT = settings.COMMAND_MAX_TIMEOUT;
var WAIT_INTERVAL = 100;
var SEEN_MAX = 3;
var KEYBOARD_DELAY = 250;
var DEFAULT_FIELDSIZE = 50;

function SetMaskedElValue () {
  CheckVisibleAndClick.call(this);
  this.checkConditions = this.checkConditions.bind(this);
  this.pass = this.pass.bind(this);
  this.fail = this.fail.bind(this);
}

util.inherits(SetMaskedElValue, CheckVisibleAndClick);

SetMaskedElValue.prototype.command = function (selector, valueToSet, /* optional */ fieldSize, cb) {
  this.valueToSet = valueToSet;
  this.selector = selector;

  if (typeof fieldSize === 'number') {
    this.fieldSize = fieldSize;
    this.cb = cb;
  } else {
    this.fieldSize = DEFAULT_FIELDSIZE;
    this.cb = fieldSize;
  }

  this.successMessage = "Selector <" + this.selector+ "> (masked) set value to [" + this.valueToSet + "] after %d milliseconds";
  this.failureMessage = "Selector <" + this.selector+ "> (masked) could not set value to [" + this.valueToSet + "] after %d milliseconds";

  this.startTime = (new Date()).getTime();

  // Track how many times we've seen selector as :visible
  this.seenCount = 0;

  this.checkConditions();

  return this;
};

// set a value on an element with the assumption that it is ready/settled
SetMaskedElValue.prototype._setValue = function () {
  // NOTE: Assumes valueToSet is a string.
  var self = this;

  var client = self.client.api;

  // Send 50 <- keys first (NOTE: this assumes LTR text flow!)
  var backarrows = [];
  for (var i = 0; i < this.fieldSize; i++) {
    backarrows.push("\uE012");
  }

  var keys = backarrows.concat(self.valueToSet.split(""));

  var nextKey = function () {
    if (keys.length === 0) {
      client.pause(KEYBOARD_DELAY, function () {
        self.pass();
      });
    } else {
      var key = keys.shift();
      client
        .pause(KEYBOARD_DELAY)
        .keys(key, function () {
          nextKey();
        });
    }
  };

  client
    .click(self.selector, function () {
      nextKey();
    });
};

SetMaskedElValue.prototype.checkConditions = function () {
  var self = this;

  // wait until an element is ready/settled
  this.execute(this.checkVisibleAndClick, [self.selector, false], function (result) {
    if (result.isVisible && result.selectorLength === 1) {
      self.seenCount++;
    }

    // If we've seen the selector enough times or waited too long, continue w/ checkElement
    var elapsed = (new Date()).getTime() - self.startTime;
    if (self.seenCount >= SEEN_MAX || elapsed > MAX_TIMEOUT) {
      if (self.seenCount >= SEEN_MAX) {
        // We're convinced the element is ready. Now set its value
        self._setValue();
      } else {
        // We're about to fail. If we DO see the selector but selectorLength was > 1,
        // issue a warning that the test had an ambiguous target to click on
        if (result.selectorLength > 1) {
          console.log("WARNING: setMaskedElValue saw selector " + self.selector + " but result length was " + result.selectorLength + ", with " + result.selectorVisibleLength + " of those :visible");
          console.log("Selector did not disambiguate after " + elapsed + " milliseconds, refine your selector or check DOM for problems.");
        }
        self.fail();
      }
    } else {
      setTimeout(self.checkConditions, WAIT_INTERVAL);
    }
  });
};

module.exports = SetMaskedElValue;
