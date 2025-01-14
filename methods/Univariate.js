class Univarite {

    constructor(chart) {

        this.feature_average;
        this.feature_range;
        this.model;
        this.chart = chart;

        this.calculateScalers = function(features) {
            this.feature_average = features.reduce((a, b) => a + b, 0) / features.length;
            this.feature_range = Math.max(...features) - Math.min(...features)
        }

        this.trainModelAndGraphData = function(json, callback) {
            const keys = Object.keys(json[0]);
            const inputs = json.map(item => item[keys[0]]);
            const targets = json.map(item => item[keys[1]]);
            this.graphInitialData(inputs, targets, callback);
            this.calculateScalers(inputs);
            const scaled_inputs = this.scaleFeatures(inputs);
            this.trainModel(inputs, scaled_inputs, targets);
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

        this.graphInitialData = function graphInitialData(inputs, targets, callback) {
            const initialData = {
                label: 'Data',
                data: inputs.map((input, index) => ({ x: input, y: targets[index] }))
            };
            this.chart.data.datasets = [initialData];
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

export default Univarite;
