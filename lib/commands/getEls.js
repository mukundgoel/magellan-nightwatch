var util = require("util"),
  selectorUtil = require("../util/selector"),
  clc = require("cli-color"),
  CheckVisibleAndDo = require("./lib/checkVisibleAndDo");

// Wait until we've seen a selector as :visible SEEN_MAX times, with a
// wait for WAIT_INTERVAL milliseconds between each visibility test.
var settings = require("../settings");
var MAX_TIMEOUT = settings.COMMAND_MAX_TIMEOUT;
var WAIT_INTERVAL = 100;
var SEEN_MAX = 3;

function GetElements() {
  CheckVisibleAndDo.call(this);
  this.checkConditions = this.checkConditions.bind(this);
}

util.inherits(GetElements, CheckVisibleAndDo);

GetElements.prototype.checkConditions = function() {
  var self = this;

  this.execute(this.checkVisibleAndDo, [self.selector, {getLength:true}], function(result) {
    // Keep a running count of how many times we've seen this element visible
    if (result.isVisible) {
      self.seenCount++;
    }

    var elapsed = (new Date()).getTime() - self.startTime;

    // If we've seen the selector enough times or waited too long, then 
    // it's time to pass or fail and continue the command chain.
    // console.log(self.seenCount, SEEN_MAX, elapsed)
    if (self.seenCount >= SEEN_MAX || elapsed > MAX_TIMEOUT) {
      if (self.seenCount >= SEEN_MAX) {

        var ret = [];
        for (var i = 1; i <= result.value.value; i++) {
          ret.push({
            'ELEMENT': i
          });
        }

        self.pass(ret);
      } else {
        self.fail();
      }
    } else {
      setTimeout(self.checkConditions, WAIT_INTERVAL);
    }
  });
};


GetElements.prototype.pass = function(value) {
  var elapsed = (new Date()).getTime() - this.startTime;
  this.client.assertion(true, "visible", "visible", util.format(this.successMessage, elapsed), true);
  if (this.cb) {
    this.cb.apply(this.client.api, [value, this.selector]);
  }
  this.emit("complete");
};

GetElements.prototype.fail = function() {
  var elapsed = (new Date()).getTime() - this.startTime;
  this.client.assertion(false, "not visible", "visible", util.format(this.failureMessage, elapsed), true);
  if (this.cb) {
    this.cb.apply(this.client.api, []);
  }
  this.emit("complete");
};

GetElements.prototype.command = function(selector, cb) {
  this.selector = selectorUtil.normalize(selector);
  this.cb = cb;

  this.successMessage = "Selector '" + this.selector + "' was visible after %d milliseconds.";
  this.failureMessage = "Selector '" + this.selector + "' was not visible after %d milliseconds.";

  this.startTime = (new Date()).getTime();

  // Track how many times we've seen selector as :visible
  this.seenCount = 0;

  this.checkConditions();

  return this;
};

module.exports = GetElements;
