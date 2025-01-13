const dropArea = document.getElementById('drop-area');

window.addEventListener('resize', function () {
    updateChartMaxHeight();
});

function updateChartMaxHeight() {
    const chartElement = document.getElementById('myChart');
    const chartBottom = chartElement.getBoundingClientRect().top;
    const windowHeight = window.innerHeight;
    const maxChartHeight = windowHeight - chartBottom;
    chartElement.style.maxHeight = maxChartHeight + 'px';
}

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
});

function handleFiles(files) {

    ([...files]).forEach(file => {
        const reader = new FileReader();
        reader.onload = function (e) {
            console.log(e.target.result);
        };
        if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            reader.readAsArrayBuffer(file);
            reader.onload = function (e) {
                updateChartMaxHeight();
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet);
                const keys = Object.keys(json[0]);
                var inputs = json.map(item => item[keys[0]]);
                var targets = json.map(item => item[keys[1]]);

                graphInitialData(inputs, targets);
                calculateScalers(inputs);
                scaled_inputs = scaleFeatures(inputs);
                trainModel(inputs, scaled_inputs, targets);
            };
        } else {
            reader.readAsText(file);
        }
    });
}

var feature_average;
var feature_range;
function calculateScalers(features) {
     feature_average = features.reduce((a, b) => a + b, 0) / features.length;
     feature_range = Math.max(...features) - Math.min(...features)
}

function scaleFeatures(features) {
    return features.map(a => (a - feature_average) / feature_range)
}

var model;
async function trainModel(inputs, scaled_inputs, targets) {
    model = tf.sequential();
    model.add(tf.layers.dense({ units: 1, inputShape: [1] }));
    const optimizer = tf.train.sgd(0.1);
    model.compile({ optimizer: optimizer, loss: 'meanSquaredError' });
    const xs = tf.tensor2d(scaled_inputs, [scaled_inputs.length, 1]);
    const ys = tf.tensor2d(targets, [targets.length, 1]);
    await model.fit(xs, ys, { epochs: 100 });

    graphModel(inputs, scaled_inputs);
}

var myChart;
function graphInitialData(inputs, targets) {
    const initialData = {
        label: 'Data',
        data: inputs.map((input, index) => ({ x: input, y: targets[index] }))
    };
    const ctx = document.getElementById('myChart').getContext('2d');
    if (myChart != null) {
        myChart.data.datasets = [initialData];
        myChart.update();
        return;
    }
    myChart = new Chart(ctx, {
        type: 'scatter',
        data: {datasets: [initialData] },
        options: {
            backgroundColor: 'rgb(255, 255, 255)',
            color: 'rgb(255, 255, 255)',
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

function graphModel(inputs, scaled_inputs) {
    const xValues = [Math.min(...inputs), Math.max(...inputs)];
    const yValues = [(model.predict(tf.tensor2d([Math.min(...scaled_inputs)], [1, 1]))).dataSync()[0],
                     (model.predict(tf.tensor2d([Math.max(...scaled_inputs)], [1, 1]))).dataSync()[0]];

    console.log("line graph- firstCoord:", xValues[0], ",", yValues[0], " lastCoord:", xValues[1], ",", yValues[1]);
    const lineData = {
        label: 'Model',
        data: [
            { x: xValues[0], y: yValues[0] },
            { x: xValues[1], y: yValues[1] }
        ],
        backgroundColor: 'rgba(255, 99, 132, 1)',
        borderColor: 'rgba(255, 99, 132, 1)',
        showLine: true,
        pointStyle: false
    };

    myChart.data.datasets.push(lineData);
    myChart.update();
}
