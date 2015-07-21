var util = require("util");
var CheckVisibleAndClick = require("./lib/checkVisibleAndClick");
var settings = require("../settings");

// Wait until we've seen a selector as :visible SEEN_MAX times, with a
// wait for WAIT_INTERVAL milliseconds between each visibility test.
var MAX_TIMEOUT = settings.COMMAND_MAX_TIMEOUT;
var WAIT_INTERVAL = 100;
var SEEN_MAX = 3;

function ClickSettledElement() {
  CheckVisibleAndClick.call(this);
  this.checkConditions = this.checkConditions.bind(this);
}

util.inherits(ClickSettledElement, CheckVisibleAndClick);

ClickSettledElement.prototype.checkConditions = function() {
  var self = this;

  // Tell the remote browser that we should click if we're about to see the
  // selector SEEN_MAX times. This way, we can save ourselves the trouble of
  // having to first increment and then send an additional click request.
  var shouldClickIfVisible = this.seenCount === SEEN_MAX - 1;

  this.execute(this.checkVisibleAndClick, [self.selector, shouldClickIfVisible], function(result) {
    if (settings.verbose) {
      console.log("clickEl(" + self.selector + ") intermediate result: ", result);
    }

    if (result.isVisible && result.selectorLength === 1) {
      self.seenCount++;
    }

    var elapsed = (new Date()).getTime() - self.startTime;

    // If we've seen the selector enough times or waited too long, continue w/ checkElement
    if (self.seenCount >= SEEN_MAX || elapsed > MAX_TIMEOUT) {
      if (self.seenCount >= SEEN_MAX) {
        self.pass();
      } else {
        // We're about to fail. If we DO see the selector but selectorLength was > 1,
        // issue a warning that the test had an ambiguous target to click on
        if (result.selectorLength > 1) {
          console.log("ERROR: Saw selector " + self.selector + " but result length was " + result.selectorLength + ", with " + result.selectorVisibleLength + " of those :visible");
          console.log("Selector did not disambiguate after " + elapsed + " milliseconds, refine your selector or check DOM for problems.");
        }
        self.fail();
      }
    } else {
      setTimeout(self.checkConditions, WAIT_INTERVAL);
    }
  });
};

ClickSettledElement.prototype.command = function (selector, cb) {
  this.selector = selector;
  this.cb = cb;

  this.successMessage = "Selector <" + this.selector+ "> clicked after %d milliseconds";
  this.failureMessage = "Selector <" + this.selector+ "> could not be clicked after %d milliseconds";

  this.startTime = (new Date()).getTime();

  // Track how many times we've seen selector as :visible
  this.seenCount = 0;

  this.checkConditions();

  return this;
};

module.exports = ClickSettledElement;
