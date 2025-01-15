class MultipleVariable {

    constructor(chart) {

        this.feature_averages = [];
        this.feature_ranges = [];
        this.model;
        this.chart = chart;

        this.calculateScalers = function (features) {
            this.feature_averages = features.map(feature => feature.reduce((a, b) => a + b, 0) / feature.length);
            this.feature_ranges = features.map(feature => Math.max(...feature) - Math.min(...feature));
        }

        this.trainModelAndGraphData = function (json, initialCallback, finishedCallback) {
            const keys = Object.keys(json[0]);
            const inputs = json.map(obj => Object.entries(obj)    // Get key-value pairs
                .filter(([key]) => key !== keys.at(-1)) // Remove the last key which should be the ground truth Y
                .map(([_, value]) => value)             // Get only the values
            );
            console.log("inputs:", inputs);
            const targets = json.map(obj => Object.entries(obj)   // Get key-value pairs
                .filter(([key]) => key == keys.at(-1)) // Remove all but the last key which should be the ground truth Y
                .map(([_, value]) => value)            // Get only the values
            ).flat();
            console.log("targets:", targets);

            this.graphInitialData(inputs, targets, keys, initialCallback);
            const transposedFeatures = this.transposeArray(inputs);
            this.calculateScalers(transposedFeatures);
            const scaled_inputs = this.scaleFeatures(transposedFeatures);
            this.trainModel(scaled_inputs, targets, (weights) => {

                // ((x - average)/range)*
                var equationString = keys.map((item, index) => {
                    if (index == keys.length - 1) {
                        return;
                    }
                    return '((' + item + ' - ' + this.feature_averages[index].toFixed(2) + ')/' + this.feature_ranges[index].toFixed(2) + '*' + weights[index].toFixed(2)
                }).join(' + ');
                equationString += weights.at(-1);
                this.graphModel(keys, inputs, scaled_inputs, weights);
                finishedCallback(equationString);
            });
        }

        this.scaleFeatures = function scaleFeatures(features) {
            return this.transposeArray(
                features.map((feature, index) =>
                    feature.map(instance =>
                        (instance - this.feature_averages[index]) / this.feature_ranges[index]
                    )
                )
            )
        }

        this.trainModel = async function trainModel(scaled_inputs, targets, callback) {
            this.model = tf.sequential();
            this.model.add(tf.layers.dense({ units: 1, inputShape: [scaled_inputs[0].length] }));
            const optimizer = tf.train.sgd(0.1);
            this.model.compile({ optimizer: optimizer, loss: 'meanSquaredError' });
            const xs = tf.tensor2d(scaled_inputs);
            const ys = tf.tensor2d(targets, [targets.length, 1]);
            await this.model.fit(xs, ys, { epochs: 100 });

            const weights = this.model.getWeights()[0].dataSync();
            const weights1 = this.model.getWeights()[1].dataSync();
            if (callback && typeof callback === 'function') {
                callback([...weights, ...weights1]);
            }
        }

        this.transposeArray = function transposeArray(arr) {
            return arr[0].map((_, colIndex) => arr.map(row => row[colIndex]));
        }

        this.graphInitialData = function graphInitialData(inputs, targets, keys, callback) {

            const transposedInputs = this.transposeArray(inputs);
            var datasets = [];
            transposedInputs.forEach(function (value) {
                datasets.push(value.map((input, index) => ({ x: input, y: targets[index] })));
            });

            function getRandomRGB() {
                const r = Math.floor(Math.random() * 200) + 56;
                const g = Math.floor(Math.random() * 200) + 56;
                const b = Math.floor(Math.random() * 200) + 56;
                return `rgb(${r}, ${g}, ${b})`;
            }
            console.log("datasets:", datasets);
            const initialData = datasets.map((dataset, index) => {
                const randomColor = 'rgba(255, 99, 132, 1)';//getRandomRGB();
                return {
                    label: keys[index],
                    data: dataset,
                    backgroundColor: randomColor,
                    borderColor: randomColor,
                    pointRadius: 5
                };
            });
            console.log("initialData:", initialData);
            this.chart.data.datasets = initialData;
            this.chart.update();
            if (callback && typeof callback === 'function') {
                callback();
            }
            return;
        }

        this.graphModel = function graphModel(keys, inputs, scaled_inputs, weights) {

            const transposedInputs = this.transposeArray(inputs);
            const xValues = transposedInputs.map(arr => [Math.min(...arr), Math.max(...arr)]);
            const transposed_scaled_inputs = this.transposeArray(scaled_inputs);
            const min_max_tci = transposed_scaled_inputs.map(arr => [Math.min(...arr), Math.max(...arr)]);
            const yValues = min_max_tci.map( (feature, index) => feature.map(value => (value * weights[index]) + weights.at(-1)));

            xValues.forEach((value, index) => {
                const lineData = {
                    label: keys[index],
                    data: [
                        { x: xValues[index][0], y: yValues[index][0] },
                        { x: xValues[index][1], y: yValues[index][1] }
                    ],
                    backgroundColor: 'rgba(255, 99, 132, 1)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    showLine: true,
                    pointStyle: false,
                    hidden: index != 0
                };
    
                this.chart.data.datasets.push(lineData);
            });
            this.chart.update();
        }
    }
}

export default MultipleVariable;
