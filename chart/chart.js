exports.__esModule = true;
exports.Chart = void 0;

createChart = require('lightweight-charts');

let chart;
let lineSeries;

export function addDataToChart(date, value) {
	lineSeries.update({
		time: date,
		value: value
	});
	chart.timeScale().fitContent();
}
exports.addDataToChart = addDataToChart;

var Chart;
(function (Chart) {
	let chart = createChart(document.body, {
		width: 700,
		height: 700,
		layout: {
			backgroundColor: '#000000',
			textColor: '#ffffff',
		},
		grid: {
			vertLines: {
				color: '#404040',
			},
			horzLines: {
				color: '#404040',
			},
		},
		timeScale: {
			borderColor: '#cccccc',
			timeVisible: true,
		},
	});
})(Chart = exports.Chart || (exports.Chart = {}));