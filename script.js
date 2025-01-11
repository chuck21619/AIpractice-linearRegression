const dropArea = document.getElementById('drop-area');

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false)
});

function preventDefaults(e) {
    e.preventDefault()
    e.stopPropagation()
}

['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, highlight, false)
});

['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, unhighlight, false)
});

function highlight(e) {
    dropArea.classList.add('highlight')
}

function unhighlight(e) {
    dropArea.classList.remove('highlight')
}

dropArea.addEventListener('drop', handleDrop, false);

function handleDrop(e) {
    let dt = e.dataTransfer
    let files = dt.files

    handleFiles(files)
}

var inputs = [];
var targets = [];
function handleFiles(files) {
    ([...files]).forEach(file => {
        const reader = new FileReader();
        reader.onload = function (e) {
            console.log(e.target.result);
        };
        if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            reader.readAsArrayBuffer(file);
            reader.onload = function (e) {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet);
                console.log(json);
                const keys = Object.keys(json[0]);
                inputs = json.map(item => item[keys[0]]);
                targets = json.map(item => item[keys[1]]);
                console.log(inputs);
                console.log(targets);
                trainModel();
            };
        } else {
            reader.readAsText(file);
        }
    });
}

async function trainModel() {
    // Create a simple model
    const model = tf.sequential();
    model.add(tf.layers.dense({ units: 1, inputShape: [1] }));

    // Compile the model
    model.compile({ optimizer: 'sgd', loss: 'meanSquaredError' });

    // Generate some training data
    const xs = tf.tensor2d(inputs, [inputs.length, 1]);
    const ys = tf.tensor2d(targets, [targets.length, 1]);

    // Train the model
    await model.fit(xs, ys, { epochs: 5 });

    // Make a prediction
    const prediction = model.predict(tf.tensor2d([1], [1, 1]));
    prediction.print();
}