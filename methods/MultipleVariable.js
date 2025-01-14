class MultipleVariable {

    constructor(chart) {

        this.feature_average;
        this.feature_range;
        this.model;
        this.chart = chart;

        this.calculateScalers = function (features) {
            this.feature_average = features.reduce((a, b) => a + b, 0) / features.length;
            this.feature_range = Math.max(...features) - Math.min(...features)
        }

        this.trainModelAndGraphData = function (json, callback) {
            const keys = Object.keys(json[0]);
            const inputs = json.map(obj => Object.entries(obj)    // Get key-value pairs
                .filter(([key]) => key !== keys.at(-1)) // Remove the last key which should be the ground truth Y
                .map(([_, value]) => value)             // Get only the values
            );
            console.log("inputs:", inputs);
            const targets = json.map(obj => Object.entries(obj)   // Get key-value pairs
                .filter(([key]) => key == keys.at(-1)) // Remove all but the last key which should be the ground truth Y
                .map(([_, value]) => value)            // Get only the values
            )
                .flat();
            console.log("targets:", targets);

            this.graphInitialData(inputs, targets, callback);
            // this.calculateScalers(inputs);
            // const scaled_inputs = this.scaleFeatures(inputs);
            // this.trainModel(inputs, scaled_inputs, targets);
        }

        this.scaleFeatures = function scaleFeatures(features) {
            return features.map(a => (a - this.feature_average) / this.feature_range)
        }

        this.trainModel = async function trainModel(inputs, scaled_inputs, targets) {
            this.model = tf.sequential();
            this.model.add(tf.layers.dense({ units: 1, inputShape: [1] }));
            const optimizer = tf.train.sgd(0.1);
            this.model.compile({ optimizer: optimizer, loss: 'meanSquaredError' });
            const xs = tf.tensor2d(scaled_inputs, [scaled_inputs.length, 1]);
            const ys = tf.tensor2d(targets, [targets.length, 1]);
            await this.model.fit(xs, ys, { epochs: 100 });

            this.graphModel(inputs, scaled_inputs);
        }

        this.transposeArray = function transposeArray(arr) {
            return arr[0].map((_, colIndex) => arr.map(row => row[colIndex]));
        }

        this.graphInitialData = function graphInitialData(inputs, targets, callback) {

            const transposedInputs = this.transposeArray(inputs);
            var datasets = [];
            transposedInputs.forEach(function (value) {
                datasets.push(value.map((input, index) => ({ x: input, y: targets[index] })));
            });

            console.log("datasets:", datasets);

            const initialData = [
                {
                    label: 'Dataset 1',  // Label for the first dataset
                    data: datasets[0],
                    backgroundColor: 'rgba(75, 192, 192, 1)',  // Color of points in dataset 1
                    borderColor: 'rgb(75, 192, 192)',  // Border color of points in dataset 1
                    pointRadius: 5  // Radius of points
                },
                {
                    label: 'Dataset 2',  // Label for the second dataset
                    data: datasets[1],
                    backgroundColor: 'rgba(255, 99, 132, 1)',  // Color of points in dataset 2
                    borderColor: 'rgb(255, 99, 132)',  // Border color of points in dataset 2
                    pointRadius: 5  // Radius of points
                },
                {
                    label: 'Dataset 3',  // Label for the second dataset
                    data: datasets[2],
                    backgroundColor: 'rgb(51, 0, 255)',  // Color of points in dataset 2
                    borderColor: 'rgb(51, 0, 255)',  // Border color of points in dataset 2
                    pointRadius: 5  // Radius of points
                }
            ]
            // const initialData = {
            //     label: 'Data',
            //     data: inputs.map((input, index) => ({ x: input, y: targets[index] }))
            // };
            this.chart.data.datasets = initialData;
            this.chart.update();
            if (callback && typeof callback === 'function') {
                callback();
            }
            return;
        }

        this.graphModel = function graphModel(inputs, scaled_inputs) {
            const xValues = [Math.min(...inputs), Math.max(...inputs)];
            const yValues = [(this.model.predict(tf.tensor2d([Math.min(...scaled_inputs)], [1, 1]))).dataSync()[0],
            (this.model.predict(tf.tensor2d([Math.max(...scaled_inputs)], [1, 1]))).dataSync()[0]];
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

            this.chart.data.datasets.push(lineData);
            this.chart.update();
        }
    }
}

export default MultipleVariable;