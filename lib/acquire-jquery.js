module.exports = "\
  var jQueryRef;\
  if (window.jQuery) {\
    jQueryRef = window.jQuery;\
  } else if (window.____injectedJQuery____) {\
    jQueryRef = window.____injectedJQuery____;\
  } else if (window.__webpack_components__) {\
    try {\
      jQueryRef = __webpack_components__.c[\"vendor-thorax\"](\"jquery\");\
    } catch (e) {}\
    try {\
      if (!jQueryRef) {\
        jQueryRef = window.__webpack_components__[\"vendor-thorax\"](\"jquery\");\
      }\
    } catch (e) {}\
  }\
  return jQueryRef;";