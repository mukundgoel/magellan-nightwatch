# magellan-nightwatch

The [NightwatchJS](http://nightwatchjs.org/) adapter for [Magellan](https://github.com/TestArmada/magellan)

## Running Tests

For instructions on how to run tests, please see the `magellan` documentation at: https://github.com/TestArmada/magellan

## Writing Tests

Tests are structured as simple modules with a single exported object containing keyed functions. The functions are executed in the order in which they appear in the object source. Each function represents a step in the test, and its key in the test object should represent the name of the step. Each step function gets a `client` as an argument which represents a browser. For more information on writing tests, see the [Nightwatch.js documentation](http://nightwatchjs.org).

```javascript
  var MagellanTest = require("testarmada-magellan-nightwatch/lib/base-test-class");

  module.exports = new MyTest({
    "Load homepage": function (client) {
      client
        .url("http://localhost/");
    },

    "Verify header is visible": function (client) {
      client
        .getEl("#header");
    }

    "Reveal help modal": function (client)
      client
        .clickAutomationEl("show-help")
        .getEl("#help-modal")
        .assert.elContainsText("#help-modal", "This is the help modal");
    }
  });
```

For more examples, see the boilerplate project at: https://github.com/TestArmada/boilerplate

## Command Vocabulary

`magellan-nightwatch` is a wrapper around [Nightwatch.js](http://nightwatchjs.org), but is constrained to a limited subset of Nightwatch vocabulary to promote reliability.

### Enhanced Command List

If you're familiar with Nightwatch or are looking to translate Nightwatch examples into `magellan-nightwatch`, refer to the table below for equivalent enhanced (i.e. more reliable) versions of Nightwatch commands:

<table>
  <tr>
    <td>Nightwatch Command / Assertion</td>
    <td>`magellan-nightwatch` Equivalent</td>
    <td>Description</td>
  </tr>
  <tr>
    <td>click("[data-automation-id="mybutton"])</td>
    <td>clickAutomationEl("mybutton")</td>
  </tr>
  <tr>
    <td>click(selector)</td>
    <td>clickEl(selector)</td>
  </tr>
  <tr>
    <td>waitForElementPresent or waitForElementVisible</td>
    <td>getEl(selector)</td>
  </tr>
  <tr>
    <td>moveToElement</td>
    <td>moveToEl(selector, xoffset, yoffset)</td>
  </tr>
  <tr>
    <td>setValue(selector, value)</td>
    <td>setElValue(selector, value)</td>
  </tr>
  <tr>
    <td>(no nightwatch equivalent)</td>
    <td>setMaskedElValue(selector, value, [fieldLength])</td>
    <td>Set a value on a field that's using a mask (eg: MM/DD/YYYY or (555) 123-4567) with caret control</td>
  </tr>
  <tr>
    <td>waitForElementNotPresent(selector)</td>
    <td>waitForElNotPresent(selector)</td>
  </tr>
  <tr>
    <td>waitForElementNotPresent(selector)</td>
    <td>waitForElNotPresent(selector)</td>
  </tr>
  <tr>
    <td>assert.containsText(selector, text)</td>
    <td>assert.elContainsText(selector, regex or text)</td>
  </tr>
  <tr>
    <td>(no nightwatch equivalent)</td>
    <td>assert.elNotContainsText(selector, text)</td>
  </tr>
  <tr>
    <td>(no nightwatch equivalent)</td>
    <td>assert.selectorHasLength(selector, expectedLength)</td>
  </tr>
  <tr>
  <td>(no nightwatch equivalent)</td>
    <td>assert.elLengthGreaterThan(selector, selectUsing, lengthToCompare)</td>
  </tr>
</table>

#### Custom Commands Examples

The commands included with `magellan-nightwatch` are safer, more reliable and "thrash-resistent" versions of Nightwatch commands. Note that `clickEl()`, `clickAutomationEl()`, and `setElValue()` are safe to call without first waiting for their selector to appear because they execute `getEl()` as part of their internals. Consider the following snippet:

```javascript
  client
    .getEl("#submit_order")
    .clickEl("#submit_order")
```

The above snippet can be shortened to the following form (and will execute faster):

```javascript
  client
    .clickEl("#submit_order")
```

Our custom commands try be as readable and flexible as possible. For example, rather than just accepting text inside the `el(Not?)ContainsText commands, you can also include a [regular expression](https://simple.wikipedia.org/wiki/Regular_expression) to match text in a much more flexible way

```javascript
  client
    .elContainsText("#submit_order", "Price \d+\.\d\d")
```

This would match "Price" followed by one more more digits, a decimal, then two more digits.
You can use [regexper](http://regexper.com/#Price%20%5Cd%2B%5C.%5Cd%5Cd) to help visualize and debug regular expressions


### As-is Supported Nightwatch Vocabulary

Some Nightwatch commands and assertions are supported out of the box.

#### Supported Nightwatch Commands

* `clearValue()`
* `pause()`
* `attributeEquals()`
* `saveScreenshot()`
* `setCookie()`
* `url()`
* `getText()`
* `getValue()`

#### Supported Nightwatch Assertions

* `cssClassPresent()`
* `cssProperty()`
* `elementNotPresent()`
* `elementPresent()`
* `urlContains()`
* `visible()`

(From node):

* `fail`
* `equal`
* `notEqual`
* `deepEqual`
* `notDeepEqual`
* `strictEqual`
* `notStrictEqual`
* `throws`
* `doesNotThrow`
* `ifErro`

#### Custom Commands

`magellan-nightwatch` supports the development of custom commands to allow the re-use of common parts of tests. If you're using the same snippets of code to fill out a form that appears in many tests, or have a common way to sign into your application, etc, then custom commands are for you. Please see the [Nightwatch.js documentation](http://nightwatchjs.org) for more on commands.

#### Migrating Nightwatch Configuration

To migrate an existing vanilla `nightwatch.json` configuration to `magellan-nightwatch`, update the following 

Add Magellan's custom commands to your `custom_commands_path`:

```
  "custom_commands_path": [
    "./node_modules/testarmada-magellan-nightwatch/lib/commands",
```

Add Magellan's custom assertions to your `custom_assertions_path`:

```
  "custom_assertions_path": [
    "./node_modules/testarmada-magellan-nightwatch/lib/assertions",
```

Ensure Selenium server/driver paths are correct:

```
  "selenium": {
    "start_process": true,
    "server_path": "./node_modules/testarmada-magellan-nightwatch/node_modules/selenium-server/lib/runner/selenium-server-standalone-2.46.0.jar",
    "log_path": "reports",
    "host": "127.0.0.1",
    "port": 4444,
    "cli_args": {
      "webdriver.chrome.driver": "./node_modules/testarmada-magellan-nightwatch/node_modules/chromedriver/lib/chromedriver/chromedriver",
      "webdriver.ie.driver": ""
    }
  },
```

**Note: pay special attention to the version number for the selenium server above, currently at version `2.46.0`***

Set up `phantomjs` path:

```
  "phantomjs" : {
    "desiredCapabilities" : {
      "browserName" : "phantomjs",
      "javascriptEnabled" : true,
      "acceptSslCerts" : true,
      "phantomjs.binary.path" : "./node_modules/testarmada-magellan-nightwatch/node_modules/phantomjs/bin/phantomjs"
```
=======
## Version History

### 1.4.23
*Released 06 August 2015*

* Use default node-chromedriver install instead of fork (previously needed to work around firewall issue)

### 1.4.19
*Released 25 July 2015*

* Full refactor

### 1.4.20
*Released 28 July 2015*

* Added `setMaskedElValue()`
* Updated `README` with `nightwatch.json` migration instructions, better base test example.
* Updated `selenium-server` to `2.46.0` (see migration guide on how this affects `nightwatch.json`)

### 1.5.1
*Released 27 August 2015*

* Fixed problem with jQuery injection in some assertions.
