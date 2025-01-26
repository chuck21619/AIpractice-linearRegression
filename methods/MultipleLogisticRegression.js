class MultipleLogisticRegression {

    constructor(chart) {

        this.feature_averages = [];
        this.feature_ranges = [];
        this.weights = [];
        this.model;
        this.chart = chart;

        this.calculateScalers = function (features) {
            this.feature_averages = features.map(feature => feature.reduce((a, b) => a + b, 0) / feature.length);
            this.feature_ranges = features.map(feature => Math.max(...feature) - Math.min(...feature));
        }

        this.parseJsonToData = function parseJsonToData(json, trainingData = true) {
            var keys = Object.keys(json[0]);
            if (!trainingData) {
                keys.push('empty');
            }

            const inputs = json.map(obj => {
                const entries = Object.entries(obj);
                const filteredEntries = entries.filter(([key]) => key !== keys.at(-1));
                const values = filteredEntries.map(([_, value]) => value);
                return values;
            });

            const targets = json.map(obj => {
                const entries = Object.entries(obj);
                const filteredEntries = entries.filter(([key]) => key === keys.at(-1));
                const values = filteredEntries.map(([_, value]) => value);
                return values;
            }).flat();

            return { keys, inputs, targets };
        }

        this.parseJsonAndPredict = function parseJsonAndPredict(json) {
            const jsonData = this.parseJsonToData(json, false);
            const scaled_inputs = this.scaleFeatures(this.transposeArray(jsonData.inputs));
            const predictions = this.predict(scaled_inputs, this.weights);
            return predictions;
        }

        this.trainModelAndGraphData = function (json, initialCallback, finishedCallback) {
            const jsonData = this.parseJsonToData(json);
            const keys = jsonData.keys;
            const inputs = jsonData.inputs;
            const targets = jsonData.targets;

            this.graphInitialData(inputs, targets, keys, initialCallback);
            const transposedFeatures = this.transposeArray(inputs);
            this.calculateScalers(transposedFeatures);
            const scaled_inputs = this.scaleFeatures(transposedFeatures);
            this.trainModel(scaled_inputs, targets, (weights) => {
                this.weights = weights;
                var equationString = keys.map((item, index) => {
                    if (index == keys.length - 1) { return; }
                    return '((' + item + ' - ' + this.feature_averages[index].toFixed(2) + ')/' + this.feature_ranges[index].toFixed(2) + '*' + weights[index].toFixed(2)
                }).join(' + ');
                equationString += weights.at(-1).toFixed(2);
                this.graphModel(keys, inputs, scaled_inputs, weights);
                const featureImpacts = this.calculateFeatureImpact(weights.slice(0, -1));
                finishedCallback(equationString, featureImpacts);
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

        this.computeGradient = function computeGradient(inputs, targets, weights, bias) {
            const numberOfExamples = inputs.length;
            const numberOfFeatures = inputs[0].length;
            let dj_dw = new Array(numberOfFeatures).fill(0);
            let dj_db = 0.0;

            inputs.forEach((input, input_index) => {
                const prediction = this.predict([input], [...weights, bias])[0];
                const dj_dz = prediction - targets[input_index];
                input.forEach((feature, feature_index) => {
                    dj_dw[feature_index] += dj_dz * feature;
                });
                dj_db += dj_dz;
            });

            dj_dw = dj_dw.map(gradient => gradient / numberOfExamples);
            dj_db /= numberOfExamples;

            return { dj_dw, dj_db };
        }

        this.gradientDescent = function gradientDescent(features, targets, wIn, bIn, alpha, numIters) {
            let w = wIn;
            let b = bIn;

            for (let i = 0; i < numIters; i++) {
                let { dj_dw, dj_db } = this.computeGradient(features, targets, w, b);
                for (let j = 0; j < w.length; j++) {
                    w[j] -= alpha * dj_dw[j];
                }
                b -= alpha * dj_db;
            }
            return { w, b };
        }

        this.sigmoid = function sigmoid(z) {
            return 1 / (1 + Math.exp(-z));
        }

        this.predict = function predict(inputs, weights) {
            const bias = weights.at(-1);
            const predictions = inputs.map(input => {
                return this.sigmoid((weights.slice(0, weights.length-1)).reduce((inputPrediction, weight, k) => {
                    return inputPrediction + input[k] * weight;
                }, bias));
            });
            return predictions;
        }

        this.predict_single_feature = function predict_single_feature(m, x, b) {
            return this.sigmoid((m * x) + b)
        }

        this.trainModel = function trainModel(scaled_inputs, targets, callback) {
            let wInit = new Array(scaled_inputs[0].length).fill(0);
            let bInit = 0;
            let iterations = 10000;
            let tmpAlpha = 0.01;
            let { w, b } = this.gradientDescent(scaled_inputs, targets, wInit, bInit, tmpAlpha, iterations);
            callback([...w, b]);
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
            const initialData = datasets.map((dataset, index) => {
                const randomColor = getRandomRGB();
                return {
                    label: keys[index],
                    data: dataset,
                    backgroundColor: randomColor,
                    borderColor: randomColor,
                    pointRadius: 5
                };
            });
            this.chart.data.datasets = initialData;
            this.chart.update();
            if (callback && typeof callback === 'function') {
                callback();
            }
            return;
        }

        this.linSpace = function linSpace(startValue, endValue, numValues) {
            const step = (endValue - startValue) / numValues;
            var values = [];
            for (let i = 0; i <= numValues; i++) {
                values.push(startValue + step * i);
            }
            return values;
        }

        this.graphModel = function graphModel(keys, inputs, scaled_inputs, weights) {
            const numValues = 50;
            const transposedInputs = this.transposeArray(inputs);
            const xValues = transposedInputs.map(arr => this.linSpace(Math.min(...arr), Math.max(...arr), numValues));
            const scaledXValues = this.scaleFeatures(xValues);
            var yValues = [];

            for (let i = 0; i < xValues.length; i++) {
                const scaledXValuesT = this.transposeArray(scaledXValues);
                const current_feature_inputs = this.linSpace(Math.min(...scaledXValuesT[i]), Math.max(...scaledXValuesT[i]), numValues);
                var predictions = current_feature_inputs.map((input) => this.predict_single_feature(weights[i], input, weights.at(-1)));
                yValues.push(predictions);
            }

            xValues.forEach((_, index) => {
                var data = [];
                for (let i = 0; i <= numValues; i++) {
                    const tmpData = { x: xValues[index][i], y: yValues[index][i] }
                    data.push(tmpData);
                }
                const lineData = {
                    label: keys[index],
                    data: data,
                    backgroundColor: this.chart.data.datasets[index].backgroundColor,
                    borderColor: this.chart.data.datasets[index].backgroundColor,
                    showLine: true,
                    pointStyle: false,
                    hidden: index != 0
                };
                this.chart.data.datasets.push(lineData);
            });
            this.chart.update();
        }

        this.calculateFeatureImpact = function calculateFeatureImpact(weights) {
            const absoluteCoefficients = weights.map(coef => Math.abs(coef));
            const totalImportance = absoluteCoefficients.reduce((sum, coef) => sum + coef, 0);
            const normalizedImportance = absoluteCoefficients.map(coef => coef / totalImportance);
            return normalizedImportance;
        }
    }
}


export default MultipleLogisticRegression;