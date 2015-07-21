var util = require("util"),
  clickEl = require("./clickEl");

function ClickAutomationSettledElement() {
  clickEl.call(this);
  this.expectedValue = "clicked";
}

util.inherits(ClickAutomationSettledElement, clickEl);

ClickAutomationSettledElement.prototype.command = function(selector, cb) {
  var newSelector = "[data-automation-id='" + selector + "']";
  return clickEl.prototype.command.call(this, newSelector, cb);
};

module.exports = ClickAutomationSettledElement;
