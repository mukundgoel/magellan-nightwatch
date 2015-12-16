var Test = require("./../lib/base-test-class");

module.exports = new Test({

  "Load google page": function (client) {
    client.page
      .google()
      .navigate()
      .assert.title('Google')
      .assert.elContainsText('@description', 'See')
    //   .assert.visible('@searchBar')
    //   .setValue('@searchBar', 'nightwatch')
    //   .click('@submit');

    client.end();
  }
});
