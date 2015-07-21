var util = require("util");
var clc = require("cli-color");
var stringify = require("json-stringify-safe");
var EventEmitter = require("events").EventEmitter;
var fs = require("fs");
var jquerySource = fs.readFileSync(__dirname + "/../../../injectable_scripts/jquery.min.oneline.js").toString();
var acquirejQuery = require("../../acquire-jquery");
var settings = require("../../settings");

function CheckVisibleAndClick() {
  EventEmitter.call(this);
}

util.inherits(CheckVisibleAndClick, EventEmitter);

CheckVisibleAndClick.prototype.doSeleniumClick = function (callback, seleniumClickSelector) {
  this.client.api.click(seleniumClickSelector, callback);
};

// Execute a browser-side function and if the result isn't an internal
// selenium error, call the callback. Otherwise fail
CheckVisibleAndClick.prototype.execute = function (fn, args, callback) {
  var self = this;

  // NOTE: we add two more arugments to every args array here:
  //  1) jquerySource - optional sourcecode of jquery in case we need to inject it for external sites
  //  2) forceUseJQueryClick - optional boolean to configure the forced usage of useJQueryClick

  // Only inject this large block of source code to the browser side
  // if the last run of checkVisibleAndClick requested injection. This
  // saves us from having to transmit the entire source of jQuery every
  // time we run execute(), but does cost us one "beat" when we are
  // using an external site that needs injection for shimming.
  if (this.jqueryInjectionRequested === true) {
    args.push(jquerySource);
    this.jqueryInjectionRequested = false;
  } else {
    args.push(undefined);
  }

  args.push(acquirejQuery);

  this.client.api.execute(fn, args, function (result) {
    if (settings.verbose) {
      console.log("execute(" + args + ") intermediate result: ", result);
    }

    if (result && result.status === 0 && result.value !== null) {
      // Note: by checking the result and passing result.value to the callback,
      // we are claiming that the result sent to the callback will always be truthy
      // and useful, relieving the callback from needing to check the structural
      // validity of result or result.value

      if (result.value.jqueryInjectionRequested === true) {
        // Check if checkVisibleAndClick requested jQuery to be injected
        self.jqueryInjectionRequested = true;
      }

      // If we asked if it's okay to click and got back an all-clear, let's actually do it.
      if (result.value.doSeleniumClick) {
        self.doSeleniumClick(function () {
          callback.call(self, result.value);
        }, result.value.seleniumClickSelector);
      } else {
        callback.call(self, result.value);
      }
    } else {
      console.log(clc.yellowBright("\u2622  Received error result from Selenium. Raw Selenium result object:"));
      var resultDisplay;
      try {
        resultDisplay = stringify(result);
      } catch(e) {
        resultDisplay = result;
      }
      console.log(clc.yellowBright(resultDisplay));
      self.fail();
    }
  });
};

// Optionally take in a different text for expected, but default to "visible"
CheckVisibleAndClick.prototype.pass = function (expected) {
  expected = expected || "visible";
  var elapsed = (new Date()).getTime() - this.startTime;
  this.client.assertion(true, expected, expected, util.format(this.successMessage, elapsed), true);
  if (this.cb) {
    this.cb.apply(this.client.api, []);
  }
  this.emit("complete");
};

// Optionally take in a different text for expected and actual values, but default to "visible", and "not visible".
CheckVisibleAndClick.prototype.fail = function (expected, actual) {
  actual = actual || "not visible";
  expected = expected || "visible";
  var elapsed = (new Date()).getTime() - this.startTime;
  this.client.assertion(false, actual, expected, util.format(this.failureMessage, elapsed), true);
  if (this.cb) {
    this.cb.apply(this.client.api, []);
  }
  this.emit("complete");
};


// Ask if the selector is :visible according to jQuery. Report
// back about selector result length and how much of those
// resulting elements were visible. If shouldClick is set to true,
// then optionally click if the selector result length is 1 (i.e.
// if the selector result is unambigous -- don't click multiple things)
CheckVisibleAndClick.prototype.checkVisibleAndClick = function (sel, shouldClick, jquerySource, acquirejQuery) {
  // In context of browser, ask if the selector is :visible according to jQuery
  var jQueryRef;

  // The non-jQuery click solution has not been tested outside of Chrome and Phantom and
  // likely does not work in IE. This needs to be tested.
  var useJQueryClick = true;

  var jQueryRef = (new Function(acquirejQuery))();

  if (jQueryRef) {
    try {
      var $el = jQueryRef(sel);
      var isVisible = $el.is(":visible") || $el.is("area");
      var selectorVisibleLength;
      if ($el.is("area")) {
        selectorVisibleLength = jQueryRef(sel).length;
      } else {
        selectorVisibleLength = jQueryRef(sel + ":visible").length;
      }

      var doSeleniumClick = false;

      // If selector:visible and we've been told to click then signal back that it's okay to click(),
      // unless we see a selector that is ambiguous (i.e number of results
      // is greater than 1).
      if (isVisible && $el.length === 1) {
        // We avoid using data-automation-id so that we don't accidentally blow away existing attributes.
        var seleniumClickSelectorValue = "magellan_click_" + Math.round(Math.random() * 999999999).toString(16);
        var seleniumClickSelector = "[data-magellan-temp-automation-id='" + seleniumClickSelectorValue + "']";
        $el[0].setAttribute("data-magellan-temp-automation-id", seleniumClickSelectorValue);

        if (shouldClick) {
          // Unfortunately in Thorax applications we have trouble clicking
          if ($el.is("input[type='radio']") || $el.is("input[type='checkbox']")) {
            $el.click();
          } else {
            doSeleniumClick = true;
          }
        }
      }

      return {
        // Note: this is the only case in which we return a boolean for isVisibleStrict
        // In all other cases, we return null because we effectively "don't know yet".
        // This helps cases like waitForElNotPresent that can't have "false" returned
        // unless we've successfully checked if it's not visible.
        seleniumClickSelector: seleniumClickSelector,
        doSeleniumClick: doSeleniumClick,
        isVisibleStrict: isVisible,
        isVisible: isVisible,
        selectorVisibleLength: selectorVisibleLength,
        selectorLength: $el.length
      };
    } catch (e) {
      // if for whatever reason we fail here, we do not want Selenium returning
      // a null result value back to Magellan. For now, we eat this exception.
      return {
        isVisibleStrict: null,
        isVisible: false,
        selectorVisibleLength: 0,
        selectorLength: 0
      };
    }
  } else if (!jQueryRef) {

    // Check if we have the source code available. If not, we will need
    // to request it with jqueryInjectionRequested (see below).
    if (typeof jquerySource === "string" && jquerySource.length > 1000) {
      // jQuery hasn't been loaded. We make sure that we haven't already started
      // loading the script before we try to insert a script tag
      try {
        eval(jquerySource);
        window.____injectedJQuery____ = jQuery;
        jQuery.noConflict();
      } catch (e) {
        return {
          isVisibleStrict: null,
          isVisible: false,
          selectorVisibleLength: 0,
          selectorLength: 0
        };
      }

      return {
        isVisibleStrict: null,
        isVisible: false,
        selectorVisibleLength: 0,
        selectorLength: 0
      };
    } else {
      // Request injection if we don't have the jQuery source but we need it
      return {
        jqueryInjectionRequested: true,
        isVisibleStrict: null,
        isVisible: false,
        selectorVisibleLength: 0,
        selectorLength: 0
      };
    }
  } else {
    return {
      isVisibleStrict: null,
      isVisible: false,
      selectorVisibleLength: 0,
      selectorLength: 0
    };
  }
};


module.exports = CheckVisibleAndClick;
