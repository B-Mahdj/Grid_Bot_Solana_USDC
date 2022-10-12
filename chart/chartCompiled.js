"use strict";
exports.__esModule = true;
exports.Chart = void 0;
var lightweight_charts_1 = require("lightweight-charts");
var Chart;
(function (Chart) {
    var chart = (0, lightweight_charts_1.createChart)(document.body, {
        width: 700,
        height: 700,
        layout: {
            backgroundColor: '#000000',
            textColor: '#ffffff'
        },
        grid: {
            vertLines: {
                color: '#404040'
            },
            horzLines: {
                color: '#404040'
            }
        },
        timeScale: {
            borderColor: '#cccccc',
            timeVisible: true
        }
    });
    var lineSeries = chart.addLineSeries();
    lineSeries.setData([]);
    function addDataToChart(date, value) {
        lineSeries.update({
            time: date,
            value: value
        });
        chart.timeScale().fitContent();
    }
    Chart.addDataToChart = addDataToChart;
    exports.addDataToChart = addDataToChart;
})(Chart = exports.Chart || (exports.Chart = {}));
