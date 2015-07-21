var util = require("util");
var EventEmitter = require("events").EventEmitter;
var settings = require("../settings");
var sanitizeFilename = require("sanitize-filename");


function Screenshot() {
  EventEmitter.call(this);
}

util.inherits(Screenshot, EventEmitter);

Screenshot.prototype.pass = function () {
  var elapsed = (new Date()).getTime() - this.startTime;
  this.client.assertion(true, "save screenshot", "save screenshot", "Took a screenshot.", true);
  if (this.cb) {
    this.cb.apply(this.client.api, []);
  }
  this.emit("complete");
};

Screenshot.prototype.fail = function () {
  var elapsed = (new Date()).getTime() - this.startTime;
  this.client.assertion(false, "could not save screenshot", "save screenshot", "Failed to take a screenshot.", true);
  if (this.cb) {
    this.cb.apply(this.client.api, []);
  }
  this.emit("complete");
};


Screenshot.prototype.command = function (title, cb) {
  this.cb = cb;

  var filename = sanitizeFilename(title) + ".png";
  var path = settings.screenshotPath + "/" + filename;

  this.client.api.saveScreenshot(path);

  if (this.cb) {
    this.cb.apply(this.client.api, []);
  }
  
  process.nextTick(function () {
    this.pass();
  }.bind(this));

  return this;
};

module.exports = Screenshot;
