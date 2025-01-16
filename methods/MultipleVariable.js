class MultipleVariable {

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
            const predictions = this.predict(jsonData.inputs, this.weights);
            return predictions;
        }

        this.trainModelAndGraphData = function (json, initialCallback, finishedCallback) {
            console.log("json:", json);
            const jsonData = this.parseJsonToData(json);
            console.log("jsonData:", jsonData);
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

        this.computeGradient = function computeGradient(features, targets, weights, bias) {
            const numberOfExamples = features.length;
            const numberOfFeatures = features[0].length;
            let dj_dw = new Array(numberOfFeatures).fill(0);
            let dj_db = 0.0;

            for (let m = 0; m < numberOfExamples; m++) {
                for (let n = 0; n < numberOfFeatures; n++) {
                    let prediction = features[m].reduce((sum, feature, idx) => sum + feature * weights[idx], 0) + bias;
                    dj_dw[n] += (prediction - targets[m]) * features[m][n];
                }
                let prediction = features[m].reduce((sum, feature, idx) => sum + feature * weights[idx], 0) + bias;
                dj_db += (prediction - targets[m]);
            }

            dj_dw = dj_dw.map(grad => grad / numberOfExamples);
            dj_db /= numberOfExamples;

            return { dj_dw, dj_db };
        }

        this.gradientDescent = function gradientDescent(features, targets, wIn, bIn, alpha, numIters, gradientFunction) {
            let w = wIn;
            let b = bIn;

            for (let i = 0; i < numIters; i++) {
                let { dj_dw, dj_db } = gradientFunction(features, targets, w, b);
                for (let j = 0; j < w.length; j++) {
                    w[j] -= alpha * dj_dw[j];
                }
                b -= alpha * dj_db;
            }
            return { w, b };
        }

        this.predict = function predict(inputs, weights) {
            const scaled_inputs = this.scaleFeatures(this.transposeArray(inputs));
            const bias = weights.pop();
            const predictions = scaled_inputs.map(input => {
                return weights.reduce((inputPrediction, weight, k) => {
                    return inputPrediction + input[k] * weight;
                }, bias);
            });
            return predictions;
        }

        this.predict_single_feature = function predict_single_feature(m, x, b) {
            return (m * x) + b
        }

        this.trainModel = function trainModel(scaled_inputs, targets, callback) {
            let wInit = new Array(scaled_inputs[0].length).fill(0);
            let bInit = 0;
            let iterations = 10000;
            let tmpAlpha = 0.01;
            let { w, b } = this.gradientDescent(scaled_inputs, targets, wInit, bInit, tmpAlpha, iterations, this.computeGradient);
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

        this.graphModel = function graphModel(keys, inputs, scaled_inputs, weights) {

            const transposedInputs = this.transposeArray(inputs);
            const xValues = transposedInputs.map(arr => [Math.min(...arr), Math.max(...arr)]);
            const transposed_scaled_inputs = this.transposeArray(scaled_inputs);
            const min_max_tci = transposed_scaled_inputs.map(arr => [Math.min(...arr), Math.max(...arr)]);
            const yValues = min_max_tci.map((feature, index) => feature.map(value => this.predict_single_feature(value, weights[index], weights.at(-1))));
            xValues.forEach((_, index) => {
                const lineData = {
                    label: keys[index],
                    data: [
                        { x: xValues[index][0], y: yValues[index][0] },
                        { x: xValues[index][1], y: yValues[index][1] }
                    ],
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

export default MultipleVariable;
