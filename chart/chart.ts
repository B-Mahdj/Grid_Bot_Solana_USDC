import { createChart } from "lightweight-charts";

var chart;
var lineSeries;

export function addDataToChart(date, value) {
	lineSeries.update({
		time: date,
		value: value
	});
	chart.timeScale().fitContent();
}
exports.addDataToChart = addDataToChart;

export module Chart{
	chart = createChart(document.body, {
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
	lineSeries = chart.addLineSeries();
	lineSeries.setData([]);
}
