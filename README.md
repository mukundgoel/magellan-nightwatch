# magellan-nightwatch

The [NightwatchJS](http://nightwatchjs.org/) adapter for [Magellan](https://github.com/TestArmada/magellan)

## Running Tests

For instructions on how to run tests, please see the `magellan` documentation at: https://github.com/TestArmada/magellan

## Writing Tests

Tests are structured as simple modules with a single exported object containing keyed functions. The functions are executed in the order in which they appear in the object source. Each function represents a step in the test, and its key in the test object should represent the name of the step. Each step function gets a `client` as an argument which represents a browser. For more information on writing tests, see the [Nightwatch.js documentation](http://nightwatchjs.org).

```javascript
  module.exports = {
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
  }
```

## Command Vocabulary

`magellan-nightwatch` is a wrapper around [Nightwatch.js](http://nightwatchjs.org), but is constrained to a limited subset of Nightwatch vocabulary to promote reliability.

### Command Equivalent List

If you're familiar with Nightwatch or are looking to translate Nightwatch examples into `magellan-nightwatch`, refer to the table below for equivalent support commands:

<table>
  <tr>
    <td>Nightwatch Command / Assertion</td>
    <td>`magellan-nightwatch` Equivalent</td>
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
    <td>_(no nightwatch equivalent)_</td>
    <td>assert.elNotContainsText(selector, text)</td>
  </tr>
  <tr>
    <td>_(no nightwatch equivalent)_</td>
    <td>assert.selectorHasLength(selector, expectedLength)</td>
  </tr>
  <tr>
  <td>_(no nightwatch equivalent)_</td>
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

#### Custom Commands

`magellan-nightwatch` supports the development of custom commands to allow the re-use of common parts of tests. If you're using the same snippets of code to fill out a form that appears in many tests, or have a common way to sign into your application, etc, then custom commands are for you. Please see the [Nightwatch.js documentation](http://nightwatchjs.org) for more on commands.

