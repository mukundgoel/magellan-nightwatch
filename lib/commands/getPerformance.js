var util = require("util");
var EventEmitter = require("events").EventEmitter;


function PerformanceMetrics() {
    EventEmitter.call(this);
}

util.inherits(PerformanceMetrics, EventEmitter);

PerformanceMetrics.prototype.command = function(cb) {
    this.cb = cb;
    var self = this;
    this.client.api
        .execute(function() {
                try {
                    var performanceMetrics = [];
                    var performance = window.performance || window.webkitPerformance || window.mozPerformance || window.msPerformance || {}

                    // feature check
                    if (!!performance) {

                        var timingObj = performance.timing;
                        var navigationObj = performance.navigation;

                        var now = new Date().getTime();
                        var loadTime = now - timingObj.fetchStart;
                        var domContentLoad = timingObj.domContentLoadedEventStart - timingObj.domLoading;
                        var firstPaint = 0;
                        if (window.chrome && window.chrome.loadTimes) {
                            firstPaint = window.chrome.loadTimes().firstPaintTime * 1000 - timingObj.navigationStart;
                        }

                        if (typeof window.performance.timing.msFirstPaint === 'number') {
                            firstPaint = window.performance.timing.msFirstPaint - timingObj.navigationStart;
                        }

                        var dnsLookup = window.performance.timing.domainLookupEnd - window.performance.timing.domainLookupStart;
                        var domInteractive = window.performance.timing.domInteractive - window.performance.timing.navigationStart;

                        //TO-DO, sometimes loadEventEnd is coming out to be ZERO, hence displaying the fullPageLoad in negavtive, especially in Chrome

                        //get resource times
                        var resourceList = window.performance.getEntriesByType("resource");
                        var countImg=0;
                        for (i = 0; i < resourceList.length; i++) {
                            if (resourceList[i].initiatorType == "img") {
                                countImg++;
                            }
                        }
                        if(firstPaint == 0){
                            firstPaint = "Not available";
                        }else{
                            firstPaint = parseFloat(Math.round(firstPaint).toFixed(3)) / 1000 + ' seconds';
                        }
                    var redirectCount =  navigationObj.redirectCount;
                    performanceMetrics.push("DNS Lookup: " + dnsLookup / 1000 + ' seconds');
                    performanceMetrics.push("DomContentLoad: " + domContentLoad / 1000 + ' seconds');
                    performanceMetrics.push("First Paint: " + firstPaint);
                    performanceMetrics.push("DomInteractive: " + domInteractive / 1000 + ' seconds');
                    performanceMetrics.push("Page Load (onLoad): " + loadTime / 1000 + ' seconds');
                    performanceMetrics.push("Redirect Counts: " + redirectCount);
                    performanceMetrics.push("Number of Resources: " + resourceList.length);
                    performanceMetrics.push("Number of Images: " + countImg);
                    return performanceMetrics;

                } else {
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