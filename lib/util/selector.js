var _ = require("lodash"),
  BaseTestClass = require('../base-test-class');

module.exports = {
  /**
   * Allow {token} to be used in selectors to extract to an arbitrary selector to make
   * automation-oriented elements easier to select.
   * This is a noop unless the BaseTestClass.selectorToken is implemented.  This should
   * be set as a function with a single param (the token to be replaced) and return the replacement value.
   * ex:
   * require('testarmada-magellan-nightwatch/lib/base-test-class').selectorToken = function (value) {
   *   return '[data-selector-id="' + value + '"]';
   * }
   */
  normalize: function (selector) {
    if (BaseTestClass.selectorToken) {
      selector = selector.replace(/(\{[^\}]+\})/g, function (val) {
        // remove {} wrapper
        val = val.substring(1, val.length - 1);
        return BaseTestClass.selectorToken(val);
      });
    }
    return selector;
  },

  depageobjectize: function (selector, locateStrategy) {
    if (locateStrategy === 'recursion') {
      // selector defined in page object structure
      var innerArgs = _.cloneDeep(selector);
      var selector = innerArgs.shift().pop().selector;
      innerArgs.unshift(selector);
      return innerArgs;
    } else {
      return selector;
    }
  }
}
