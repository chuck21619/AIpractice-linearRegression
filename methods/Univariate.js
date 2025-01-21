class Univarite {

    constructor(chart) {

        this.feature_average;
        this.feature_range;
        this.model;
        this.chart = chart;
        this.weight;
        this.bias;

        this.calculateScalers = function(features) {
            this.feature_average = features.reduce((a, b) => a + b, 0) / features.length;
            this.feature_range = Math.max(...features) - Math.min(...features)
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
            }).flat();

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
            const scaled_inputs = this.scaleFeatures(jsonData.inputs);
            const predictions = this.predict(scaled_inputs, this.weight, this.bias);
            return predictions;
        }

        this.trainModelAndGraphData = function(json, initialCallback, finishedCallback) {
            const jsonData = this.parseJsonToData(json);
            const keys = jsonData.keys;
            const inputs = jsonData.inputs;
            const targets = jsonData.targets;
            this.graphInitialData(inputs, targets, initialCallback);
            this.calculateScalers(inputs);
            const scaled_inputs = this.scaleFeatures(inputs);
            
            this.trainModel(scaled_inputs, targets, (results) => {
                this.weight = results.w;
                this.bias = results.b;
                var equationString = keys.map((item, index) => {
                    if (index == keys.length - 1) { return; }
                    return '((' + item + ' - ' + this.feature_average.toFixed(2) + ')/' + this.feature_range.toFixed(2) + ')*' + this.weight.toFixed(2)
                }).join(' + ');
                equationString += this.bias.toFixed(2);
                this.graphModel(inputs, scaled_inputs, this.weight, this.bias);
                finishedCallback(equationString, []);
            });
        }

        this.scaleFeatures = function scaleFeatures(features) {
            return features.map(a => (a - this.feature_average) / this.feature_range)
        }

        this.trainModel = function trainModel(scaled_inputs, targets, callback) {
            let wInit = 0;
            let bInit = 0;
            let iterations = 10000;
            let tmpAlpha = 0.01;
            let { w, b } = this.gradientDescent(scaled_inputs, targets, wInit, bInit, tmpAlpha, iterations);
            callback({ w, b });
        }

        this.computeGradient = function computeGradient(x, y, w, b) {
            const m = x.length;
            const predictions = this.predict(x, w, b);
            const costs = predictions.map( (prediction, index) => prediction - y[index] );
            const dj_dw = costs.reduce( (accumulator, cost, index) => { return accumulator + 2*(cost * x[index]) }, 0 ) / m;
            const dj_db = costs.reduce( (accumulator, cost)        => { return accumulator + 2*cost              }, 0 ) / m;
            return [dj_dw, dj_db];
        }        

        this.gradientDescent = function gradientDescent(x, y, w_in, b_in, alpha, num_iters) {
            let w = w_in;
            let b = b_in;
        
            for (let i = 0; i < num_iters; i++) {
                let [dj_dw, dj_db] = this.computeGradient(x, y, w, b);
                w = w - alpha * dj_dw;
                b = b - alpha * dj_db;
            }
        
            return { w, b };
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

        this.predict = function predict(inputs, weight, bias) {
            return inputs.map( input => input*weight + bias );
        }

        this.graphModel = function graphModel(inputs, scaled_inputs, weight, bias) {
            const xValues = [Math.min(...scaled_inputs), Math.max(...scaled_inputs)];
            const yValues = this.predict(xValues, weight, bias);
            const lineData = {
                label: 'Model',
                data: [
                    { x: Math.min(...inputs), y: yValues[0] },
                    { x: Math.max(...inputs), y: yValues[1] }
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
