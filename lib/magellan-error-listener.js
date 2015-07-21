module.exports = function () {
  // Magellan harvests as often as possible to prevent loss to URL changes 
  // (i.e. before interaction command, before 
  // change URL command).
  if (window && window.addEventListener) {
    var Magellan = window.__Magellan__;

    // Initialize Magellan's error listener if it's not present
    if (!Magellan) {
      window.__Magellan__ = {
        startTime: (new Date()).getTime(),
        errors: []
      };
      Magellan = window.__Magellan__;

      window.addEventListener("error", function (err) {
        // Normalize errors that don't seem to be in the right format
        var normalized = false;

        if (!(err && err.message && typeof err.message === "string")) {
          if (!err) {
            err = new Error("unknown error, error object undefined or null or falsy");
            normalized = true;
          } else if (typeof err === "string") {
            err = new Error(err);
            normalized = true;
          } else {
            // something else entirely
            err = new Error(String(err));
            normalized = true;
          }
        }

        Magellan.errors.push({
          normalized: normalized,
          time: ((new Date()).getTime() - Magellan.startTime) + "ms",
          name: err.name || "",
          message: err.message || "",
          filename: err.fileName || "",
          line: err.lineNumber || 0,
          column: err.columnNumber || 0,
          stack: err.stack
        });
      });
    }

    // harvest and clear
    var errors = Magellan.errors;
    Magellan.errors = [];
    return errors;
  } else {
    return [];
  }
};