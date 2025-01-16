import Univarite from './methods/Univariate.js';
import MultipleVariable from './methods/MultipleVariable.js';

var method;
function onNavButtonClick(file) {
    const navLinks = document.querySelectorAll('nav ul li a');
    navLinks.forEach(link => link.classList.remove('active'));
    const clickedLink = document.querySelector(`nav ul li a[data-jsFile="${file}"]`);
    clickedLink.classList.add('active');

    document.getElementById('drop-area').hidden = false;
    setChartVisible(false);
    document.getElementById('equation').innerText = '';
    document.getElementById('predictions').innerHTML = '';
    if (file == 'univariate.js') {
        method = new Univarite(myChart);
        document.getElementById('title').innerHTML = "Univariate<br>Linear Regression";
        document.getElementById('subtitle').innerHTML = "Mean Normalized. Non-polynomial";
    }
    else if (file == 'multipleVariable.js') {
        document.getElementById('title').innerHTML = "Multiple Variable<br>Linear Regression";
        document.getElementById('subtitle').innerHTML = "Mean Normalized. Non-polynomial with no feature interaction";
        method = new MultipleVariable(myChart);
    }
}

window.addEventListener('resize', function () {
    updateChartMaxHeight();
});

function updateChartMaxHeight() {
    const chartElement = document.getElementById('myChart');
    const chartBottom = chartElement.getBoundingClientRect().top;
    const windowHeight = window.innerHeight - 20;
    const maxChartHeight = windowHeight - chartBottom;
    chartElement.style.maxHeight = maxChartHeight + 'px';
}

document.addEventListener('DOMContentLoaded', function () {
    hookUpNavButtons();
    setupDropArea();
    createChart();
    setChartVisible(false);
});


var myChart;
function createChart() {
    const ctx = document.getElementById('myChart').getContext('2d');
    myChart = new Chart(ctx, {
        type: 'scatter',
        data: { datasets: [] },
        options: {
            backgroundColor: 'rgb(255, 255, 255)',
            color: 'rgb(255, 255, 255)',
            responsive: true,
            plugins: {
                legend: {
                    onClick: function (event, legendItem) {
                        if (method instanceof MultipleVariable) {
                            const index = legendItem.datasetIndex;
                            const dataset = myChart.data.datasets[index];
                            const label = dataset.label;
                            myChart.data.datasets.forEach((dataset) => {
                                dataset.hidden = dataset.label != label;
                            });
                            myChart.update();
                        }
                        else {
                            const datasetIndex = legendItem.datasetIndex;
                            const dataset = myChart.data.datasets[datasetIndex];
                            dataset.hidden = !dataset.hidden;
                            myChart.update();
                        }
                    },
                    labels: {
                        // Use a custom legend label to combine the line and scatter appearance
                        generateLabels: (chart) => {
                            const uniqueLabels = chart.data.datasets.filter((dataset, index, self) => {
                                return self.findIndex(d => d.label === dataset.label) === index;
                            });
                            return uniqueLabels.map(function (dataset, i) {
                                // Retrieve the dataset label
                                var meta = chart.getDatasetMeta(i);
                                var style = meta.controller.getStyle(0);

                                return {
                                    text: dataset.label,  // The dataset's label (e.g., "Sales", "Revenue")
                                    fillStyle: style.backgroundColor || style.borderColor,  // Dataset's fill color
                                    strokeStyle: style.borderColor,  // Border color
                                    lineWidth: style.borderWidth,  // Border width
                                    hidden: !chart.isDatasetVisible(i),  // Whether the dataset is visible or hidden
                                    datasetIndex: i,  // Index of the dataset
                                };
                            });
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    grid: { color: 'rgb(0, 0, 0)' },
                    ticks: { color: 'rgb(0, 0, 0)' }
                },
                y: {
                    type: 'linear',
                    position: 'left',
                    grid: { color: 'rgb(0, 0, 0)' },
                    ticks: { color: 'rgb(0, 0, 0)' }
                }
            }
        }
    });
}

function hookUpNavButtons() {
    const navLinks = document.querySelectorAll('nav ul li a');
    navLinks.forEach(link => {
        const jsFile = link.getAttribute('data-jsFile');
        link.addEventListener('click', () => onNavButtonClick(jsFile));
    });
}

function setupDropArea() {
    const dropArea = document.getElementById('drop-area');

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });

    function highlight(e) {
        dropArea.classList.add('highlight');
    }

    function unhighlight(e) {
        dropArea.classList.remove('highlight');
    }

    const fileInput = document.getElementById('fileInput');

    dropArea.addEventListener('click', () => {
        fileInput.click();
    });

    dropArea.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        let dt = e.dataTransfer;
        let files = dt.files;
        handleFiles(files);
    }

    fileInput.addEventListener('change', () => {
        const files = fileInput.files;
        handleFiles(files);
        fileInput.value = '';
    });
}

function handleFiles(files) {
    ([...files]).forEach(file => {
        const reader = new FileReader();
        reader.onload = function (e) {
            console.log(e.target.result);
        };
        if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            reader.readAsArrayBuffer(file);
            reader.onload = function (e) {
                document.getElementById('predictions').innerHTML = '';
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet, { blankrows: true });
                const emptyRowIndex = json.findIndex(row => Object.values(row).every(value => value === null || value === '' || value === undefined));
                const trainingData = json.slice(0, emptyRowIndex);
                const dataToPredict = json.slice(emptyRowIndex + 1);
                
                method.trainModelAndGraphData(trainingData, () => {
                    updateChartMaxHeight();
                    setChartVisible(true);
                    myChart.update();
                    if (method instanceof MultipleVariable) {
                        for (let i = 1; i < myChart.data.datasets.length; i++) {
                            myChart.data.datasets[i].hidden = true;
                        }
                    }
                }, function (equationString, featureImpacts) {
                    const keys = Object.keys(json[0]);
                    var featureImpactsString = ""
                    if (method instanceof MultipleVariable) {
                        featureImpactsString = featureImpacts.reduce((string, impact, index) => {
                            return string + keys[index] + "=" + (impact * 100).toFixed(0) + "% ";
                        }, "feature importance: ");
                    }
                    document.getElementById('equation').innerHTML = "prediction = " + equationString + "<br><br>" + featureImpactsString;
                    updateChartMaxHeight();

                    function generateTableHTML(data, lastColumnData) {
                        if (data.length === 0) return '';
                        const headers = Object.keys(data[0]);
                        headers.push(keys.at(-1) + " prediction");
                        const headerHTML = headers.map(header => `<th>${header}</th>`).join('');
                        const rowsHTML = data.map((row, index) => {
                            return `<tr>` +
                                headers.slice(0, -1).map(header => `<td>${row[header]}</td>`).join('') +
                                `<td>${lastColumnData[index].toFixed(2)}</td>` +
                                `</tr>`;
                        }).join('');
                        const tableHTML = `
                            <table border="1">
                                <thead>
                                    <tr>${headerHTML}</tr>
                                </thead>
                                <tbody>
                                    ${rowsHTML}
                                </tbody>
                            </table>
                        `;
                    
                        return tableHTML;
                    }
                    if ( emptyRowIndex != -1 ) {
                        const predictions = method.parseJsonAndPredict(dataToPredict);
                        const tableHTML = generateTableHTML(dataToPredict, predictions);
                        document.getElementById('predictions').innerHTML = tableHTML;    
                    }                
                });
            };
        } else {
            reader.readAsText(file);
        }
    });
}

function setChartVisible(showChart) {
    if (showChart) {
        document.getElementById('myChart').style.visibility = 'visible';
    }
    else {
        document.getElementById('myChart').style.visibility = 'hidden';
        myChart.clear();
    }
}
