var Base = require("../lib/base-test-class");
var util = require("util");

var MyExampleBaseClass = function (steps) {
  // call super-constructor
  Base.call(this, steps);
};

util.inherits(MyExampleBaseClass, Base);

MyExampleBaseClass.prototype = {
  before: function (client) {
    // call super-before
    Base.prototype.before.call(this, client);
  },

  after: function (client, callback) {
    // call super-after
    Base.prototype.after.call(this, client, callback);
  },

  // Note: This method will not be mistaken by nightwatch for a step because
  // it is not enumerable (since it's on the prototype)
  getMySecretURL: function () {
    return "http://en.wikipedia.org/";
  }
};

module.exports = new MyExampleBaseClass({
  "Load page": function (client) {
    client.url(this.getMySecretURL());
  },

  "Verify page is visible": function (client) {
    client.getEl("html");
  }
});