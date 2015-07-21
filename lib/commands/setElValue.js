//
// A more reliable version setValue() that:
//   - waits for the element to be settled and available (like clickEl/getEl)
//   - ensures we're looking at a singular selector (i.e. selector yields result of length 1)
//   - uses a more reliable way to enter content that is not susceptible to timing weirdness

var util = require("util");
var CheckVisibleAndClick = require("./lib/checkVisibleAndClick");
var acquirejQuery = require("../acquire-jquery");

// Wait until we've seen a selector as :visible SEEN_MAX times, with a
// wait for WAIT_INTERVAL milliseconds between each visibility test.
var settings = require("../settings");
var MAX_TIMEOUT = settings.COMMAND_MAX_TIMEOUT;
var WAIT_INTERVAL = 100;
var SEEN_MAX = 3;

function SetValueToSettledElement () {
  CheckVisibleAndClick.call(this);
  this.checkConditions = this.checkConditions.bind(this);
  this._enterValueDirectly = this._enterValueDirectly.bind(this);
  this.pass = this.pass.bind(this);
  this.fail = this.fail.bind(this);
}

util.inherits(SetValueToSettledElement, CheckVisibleAndClick);

SetValueToSettledElement.prototype.command = function (selector, valueToSet, cb) {
  this.valueToSet = valueToSet;
  this.selector = selector;
  this.cb = cb;

  this.successMessage = "Selector <" + this.selector+ "> set value to [" + this.valueToSet + "] after %d milliseconds";
  this.failureMessage = "Selector <" + this.selector+ "> could not set value to [" + this.valueToSet + "] after %d milliseconds";

  this.startTime = (new Date()).getTime();

  // Track how many times we've seen selector as :visible
  this.seenCount = 0;

  this.checkConditions();

  return this;
};

// In the case of browsers like phantomjs, we can only overcome keypress
// quirks by in-filling the value directly with .val()
SetValueToSettledElement.prototype._enterValueDirectly = function () {
  var self = this;

  this.execute(function (sel, valueToSet, acquirejQuery) {
    // Note: we would have already loaded, injected, or found a loaded jQuery by this point
    var jQueryRef = (new Function(acquirejQuery))();

    if (jQueryRef) {
      var $el = jQueryRef(sel);
      if ($el.is(":visible")) {
        $el
          .focus()
          .val(valueToSet)
          .focus()
          .blur();
      }
    }
    return true;
  }, [self.selector, self.valueToSet, acquirejQuery], function () {
    self.pass();
  });
};

// TODO: Remove this hack.
// Return true if the element in question is a masked input
SetValueToSettledElement.prototype._shouldUseKeyboardWorkaround = function (cb) {
  this.execute(function (selector, acquirejQuery) {
    try {
      var isBuggyKeyboardBrowser = navigator.userAgent.toLowerCase().indexOf("phantomjs") > -1
        || navigator.userAgent.toLowerCase().indexOf("msie 9.0") > -1
        || navigator.userAgent.toLowerCase().indexOf("msie 8.0") > -1;

      if (isBuggyKeyboardBrowser) {
        return true;
      }

      var jQueryRef = (new Function(acquirejQuery))();
      var isMaskedInputField;
      if (jQueryRef) {
        isMaskedInputField = (typeof jQueryRef(selector).data("rawMaskFn") === "function");
      } else {
        // this is unknowlable if we don't have jQuery
        isMaskedInputField = false;
      }
      return isMaskedInputField;
    } catch (e) {
      return false;
    }
    return {};
  }, [this.selector, acquirejQuery], cb);
};

// set a value on an element with the assumption that it is ready/settled
SetValueToSettledElement.prototype._setValue = function () {
  // NOTE: Assumes valueToSet is a string.
  var self = this;

  // Ask if we need to use a keyboard workaround for the element
  // we're entering a value into. If we do, we enter the value
  // directly with a val() implementation. We otherwise use a 
  // normal selenium setValue implementation.
  self._shouldUseKeyboardWorkaround(function(result) {
    // Note: clearValue ensures the caret is at the beginning
    if (result === true) {
      self._enterValueDirectly();
    } else {
      self.client.api
        .setValue(self.selector, self.valueToSet, function (){
          self.pass();
        });
    }
  });
};

SetValueToSettledElement.prototype.checkConditions = function () {
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
          console.log("WARNING: setElValue saw selector " + self.selector + " but result length was " + result.selectorLength + ", with " + result.selectorVisibleLength + " of those :visible");
          console.log("Selector did not disambiguate after " + elapsed + " milliseconds, refine your selector or check DOM for problems.");
        }
        self.fail();
      }
    } else {
      setTimeout(self.checkConditions, WAIT_INTERVAL);
    }
  });
};

module.exports = SetValueToSettledElement;
