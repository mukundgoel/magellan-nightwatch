var util = require("util");
var EventEmitter = require("events").EventEmitter;


function PerformanceMetrics() {
    EventEmitter.call(this);
}

util.inherits(PerformanceMetrics, EventEmitter);

PerformanceMetrics.prototype.command = function(url) {
    var cb = function (result) {
        // Send a message to Magellan about this page
        process.send({
          type: "performance-metrics",
          url: url,
          metrics: result
        });
      };
    this.cb=cb;
    var self = this;
    this.client.api
        .execute(function() {
                try {
                    var performanceMetrics = [];
                    var performance = window.performance || window.webkitPerformance || window.mozPerformance || window.msPerformance || {}
                    
                    // feature check
                    if (!!performance) {  
                        var timingObj = performance.timing;

                        var now = new Date().getTime();
                        var loadTime = now - timingObj.fetchStart;
                        var domContentLoad = timingObj.domContentLoadedEventStart - timingObj.domLoading;
                        var firstPaint=0;
                        if (window.chrome && window.chrome.loadTimes) { 
                           firstPaint= window.chrome.loadTimes().firstPaintTime * 1000 - timingObj.navigationStart;
                        }

                        if (typeof window.performance.timing.msFirstPaint === 'number') { 
                            firstPaint = window.performance.timing.msFirstPaint - timingObj.navigationStart;
                        }

                        var fullPageLoad = window.performance.timing.loadEventEnd - window.performance.timing.responseEnd;

                        //TO-DO, sometimes loadEventEnd is coming out to be ZERO, hence displaying the fullPageLoad in negavtive, especially in Chrome

                        var numOfRequests = window.performance.getEntries().length;
                       
                        performanceMetrics.push("DomContentLoad: " + domContentLoad / 1000 + ' seconds');
                        performanceMetrics.push("Page Load (onLoad): " + loadTime / 1000 + ' seconds');
                        performanceMetrics.push("Full Page Load: " + fullPageLoad / 1000 + ' seconds');
                        performanceMetrics.push("Number of Requests: " + numOfRequests);
                        performanceMetrics.push("First Paint: " + firstPaint/1000 + ' seconds');

                        return performanceMetrics;

                    }else{
                        return "Performance API is not supported by this browser or browser version";
                    }

                } catch (e) {
                    return "Couldnt get timing, it is possible that the browser selected does not support performance API. Recieved error : " + e.message;
                }
            }, [],
            function(result) {
                cb.call(this, result.value);
                console.log('Load Time : ', result.value);
                self.emit("complete");

            });

    return this;
};

module.exports = PerformanceMetrics;