//
// A more reliable version moveToElement() that:
//   - waits for the element to be settled and available (like clickEl/getEl)
//   - ensures we're looking at a singular selector (i.e. selector yields result of length 1)

var util = require("util");
var CheckVisibleAndClick = require("./lib/checkVisibleAndClick");

// Wait until we've seen a selector as :visible SEEN_MAX times, with a
// wait for WAIT_INTERVAL milliseconds between each visibility test.
var settings = require("../settings");
var MAX_TIMEOUT = settings.COMMAND_MAX_TIMEOUT;
var WAIT_INTERVAL = 100;
var SEEN_MAX = 3;

function MoveToEl () {
  CheckVisibleAndClick.call(this);
  this.checkConditions = this.checkConditions.bind(this);
  this.pass = this.pass.bind(this);
  this.fail = this.fail.bind(this);
}

util.inherits(MoveToEl, CheckVisibleAndClick);

MoveToEl.prototype.command = function (selector, xoffset, yoffset, cb) {
  this.selector = selector;

  this.cb = cb;
  this.xoffset = xoffset;
  this.yoffset = yoffset;

  this.successMessage = "Moved to selector <" + this.selector+ "> after %d milliseconds";
  this.failureMessage = "Could not move to selector <" + this.selector+ "> after %d milliseconds";

  this.startTime = (new Date()).getTime();

  // Track how many times we've seen selector as :visible
  this.seenCount = 0;

  this.checkConditions();

  return this;
};

MoveToEl.prototype.moveToElement = function (seleniumClickSelector) {
  var self = this;
  var selector = self.selector;

  if (seleniumClickSelector && typeof seleniumClickSelector === "string") {
    selector = seleniumClickSelector;
  }

  this.client.api.moveToElement(selector, this.xoffset, this.yoffset, function () {
    self.pass();
  });
};

MoveToEl.prototype.checkConditions = function () {
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
        self.moveToElement(result.seleniumClickSelector);
      } else {
        // We're about to fail. If we DO see the selector but selectorLength was > 1,
        // issue a warning that the test had an ambiguous target to click on
        if (result.selectorLength > 1) {
          console.log("WARNING: moveToEl saw selector " + self.selector + " but result length was " + result.selectorLength + ", with " + result.selectorVisibleLength + " of those :visible");
          console.log("Selector did not disambiguate after " + elapsed + " milliseconds, refine your selector or check DOM for problems.");
        }
        self.fail();
      }
    } else {
      setTimeout(self.checkConditions, WAIT_INTERVAL);
    }
  });
};

module.exports = MoveToEl;
