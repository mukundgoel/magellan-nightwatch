var util = require("util");
var CheckVisibleAndClick = require("./lib/checkVisibleAndClick");
var stringify = require("json-stringify-safe");
var clc = require("cli-color");

// Wait until we've seen a selector as :visible SEEN_MAX times, with a
// wait for WAIT_INTERVAL milliseconds between each visibility test.
var settings = require("../settings");
var MAX_TIMEOUT = settings.COMMAND_MAX_TIMEOUT;
var WAIT_INTERVAL = 100;
var SEEN_MAX = 3;

function VerifyElement() {
  CheckVisibleAndClick.call(this);
  this.checkConditions = this.checkConditions.bind(this);
}

util.inherits(VerifyElement, CheckVisibleAndClick);

VerifyElement.prototype.checkConditions = function () {
  var self = this;

  this.execute(this.checkVisibleAndClick, [self.selector, false], function(result) {
    // Keep a running count of how many times we've seen this element visible
    if (result.isVisible) {
      self.seenCount++;
    }

    var elapsed = (new Date()).getTime() - self.startTime;

    // If we've seen the selector enough times or waited too long, then 
    // it's time to pass or fail and continue the command chain.
    if (self.seenCount >= SEEN_MAX || elapsed > MAX_TIMEOUT) {

      // Unlike clickEl, only issue a warning in the getEl() version of this
      if (result.selectorLength > 1) {
        console.log("WARNING: getEl saw selector " + self.selector + " but result length was " + result.selectorLength + ", with " + result.selectorVisibleLength + " of those :visible");
        console.log("Selector did not disambiguate after " + elapsed + " milliseconds, refine your selector or check DOM for problems.");
      }

      if (self.seenCount >= SEEN_MAX) {
        self.pass();
      } else {
        self.fail();
      }
    } else {
      setTimeout(self.checkConditions, WAIT_INTERVAL);
    }
  });
};

VerifyElement.prototype.command = function (selector, cb) {
  this.selector = selector;
  this.cb = cb;

  this.successMessage = "Selector '" + this.selector + "' was visible after %d milliseconds.";
  this.failureMessage = "Selector '" + this.selector + "' was not visible after %d milliseconds.";

  this.startTime = (new Date()).getTime();

  // Track how many times we've seen selector as :visible
  this.seenCount = 0;

  this.checkConditions();

  return this;
};

module.exports = VerifyElement;
