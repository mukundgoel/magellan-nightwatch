// Safe version of waitForElementNotPresent

var util = require("util");
var selectorUtil = require("../util/selector");
var CheckVisibleAndDo = require("./lib/checkVisibleAndDo");

var settings = require("../settings");
var MAX_TIMEOUT = settings.COMMAND_MAX_TIMEOUT;
var WAIT_INTERVAL = 100;

function VerifyElementDisappearance() {
  CheckVisibleAndDo.call(this);
  this.checkConditions = this.checkConditions.bind(this);
}

util.inherits(VerifyElementDisappearance, CheckVisibleAndDo);

VerifyElementDisappearance.prototype.checkConditions = function () {
  var self = this;

  this.execute(this.checkVisibleAndClick, [self.selector, {getLength:true}], function(result) {
    var elapsed = (new Date()).getTime() - self.startTime;

    if (result.isVisibleStrict === false || elapsed > MAX_TIMEOUT) {

      if (result.isVisibleStrict === false) {
        self.pass("not present");
      } else {
        self.fail("not present", "still present");
      }
    } else {
      setTimeout(self.checkConditions, WAIT_INTERVAL);
    }
  });
};

VerifyElementDisappearance.prototype.command = function (selector, cb) {
  this.selector = selectorUtil.normalize(selector);
  this.cb = cb;

  this.successMessage = "Selector '" + this.selector + "' successfully disappeared after %d milliseconds.";
  this.failureMessage = "Selector '" + this.selector + "' failed to disappear after %d milliseconds.";

  this.startTime = (new Date()).getTime();

  this.checkConditions();

  return this;
};

module.exports = VerifyElementDisappearance;
