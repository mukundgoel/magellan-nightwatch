var util = require("util"),
  selectorUtil = require("../util/selector"),
  argv = require("yargs")
  .count('verbose')
  .alias('v', 'verbose')
  .argv,
  verbose = argv.verbose;

// Wait until we've seen a selector as :visible SEEN_MAX times, with a
// wait for WAIT_INTERVAL milliseconds between each visibility test.
var settings = require("../settings");
var MAX_TIMEOUT = settings.COMMAND_MAX_TIMEOUT,
  WAIT_INTERVAL = 100,
  SEEN_MAX = 3,

  clc = require("cli-color"),
  stringify = require('json-stringify-safe');

var CheckVisibleAndDo = require("./lib/checkVisibleAndDo");

function MoveToEl() {
  CheckVisibleAndDo.call(this);
  this.checkConditions = this.checkConditions.bind(this);
}

util.inherits(MoveToEl, CheckVisibleAndDo);

MoveToEl.prototype.checkConditions = function() {
  var self = this;
  // Tell the remote browser that we should click if we're about to see the
  // selector SEEN_MAX times. This way, we can save ourselves the trouble of
  // having to first increment and then send an additional click request.
  var shouldMouseoverIfVisible = this.seenCount === SEEN_MAX - 1;

  this.execute(this.checkVisibleAndDo, [self.selector, {mouseOver:true}], function(result) {
    if (verbose) {
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
          // we dont want this step to fail without :visible property, so perform click here 
        }
        self.fail();
      }
    } else {
      setTimeout(self.checkConditions, WAIT_INTERVAL);
    }
  });
};

MoveToEl.prototype.command = function(selector, cb) {
  this.selector = selectorUtil.normalize(selector);
  this.cb = cb;

  this.successMessage = "Selector <" + this.selector + "> moved to after %d milliseconds";
  this.failureMessage = "Selector <" + this.selector + "> could not be moved to after %d milliseconds";

  this.startTime = (new Date()).getTime();

  // Track how many times we've seen selector as :visible
  this.seenCount = 0;

  this.checkConditions();

  return this;
};

module.exports = MoveToEl;
