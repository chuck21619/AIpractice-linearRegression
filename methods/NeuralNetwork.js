class NeuralNetwork {

    static iterations = "iterations";
    static learning_rate = "learning_rate";
    static layer_nodes = "layer_nodes";
    static weights = "weights";
    static bias = "bias";
    static Z = "Z";
    static activations = "activations";
    static dw = "dw";
    static db = "db";

    constructor(chart) {

        this.chart = chart;
        this.configuration = {
            [NeuralNetwork.iterations]: 10000,
            [NeuralNetwork.learning_rate]: 0.01,
            [NeuralNetwork.layer_nodes]: [3, 5, 2, 1]
        };
        this.cache = [];

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
            console.log("cache:", this.cache);
            const jsonData = this.parseJsonToData(json);
            const keys = jsonData.keys;
            const inputs = jsonData.inputs;
            const targets = jsonData.targets;
            this.initializeParameters(inputs[0].length);
            console.log("keys:", keys);
            console.log("inputs:", inputs);
            console.log("targets:", targets);
            this.forwardPropagation(inputs);
            // const equationString = "";
            // const featureImpacts = []
            // finishedCallback(equationString, featureImpacts);
        }

        this.parseJsonAndPredict = function parseJsonAndPredict(json) {
            const predictions = [];
            return predictions;
        }

        this.transposeArray = function transposeArray(arr) {
            return arr[0].map((_, colIndex) => arr.map(row => row[colIndex]));
        }

        this.relu = function relu(Z) {
            return Z.map(arr => arr.map(value => Math.max(0, value)));
        }

        this.sigmoid = function sigmoid(Z) {
            return Z.map(arr => arr.map(value => 1 / (1 + Math.exp(-value))));
        }

        this.log = function log(A) {
            return A.map(value => Math.log(value));
        }

        this.dotProduct = function dotProduct(matrixA, matrixB) {
            return matrixA.map(rowA =>
                matrixB[0].map((_, colIndex) =>
                    rowA.reduce((sum, _, rowIndex) =>
                        sum + rowA[rowIndex] * matrixB[rowIndex][colIndex], 0)
                )
            );
        }

        this.broadcastDivide = function broadcastDivide(matrixA, matrixB) {
            return matrixA.map((rowA, i) =>
                rowA.map((valueA) => {
                    const valueB = matrixB[i][0];
                    return valueA / valueB;
                })
            );
        }

        this.sumRows = function sumRows(matrix) {
            return matrix.map(row => [row.reduce((sum, value) => sum + value, 0)]);
        }

        this.broadcastMultiply = function broadcastMultiply(matrixA, matrixB) {
            return matrixA.map((rowA, i) =>
                rowA.map((valueA) => {
                    const valueB = matrixB[i][0];
                    return valueA * valueB;
                })
            );
        }

        this.multiply = function multiply(matrixA, matrixB) {
            return matrixA.map((rowA, i) =>
                rowA.map((valueA, j) => {
                    const valueB = matrixB[i][j];
                    return valueA * valueB;
                })
            );
        }

        this.addScaler = function addScalar(matrix, scalarArray) {
            for (let i = 0; i < matrix.length; i++) {
                let scalar = scalarArray[i][0];
                for (let j = 0; j < matrix[i].length; j++) {
                    matrix[i][j] += scalar;
                }
            }
            return matrix;
        }

        this.initializeParameters = function initializeParameters(numberOfFeatures) {
            const numberOfLayers = this.configuration[NeuralNetwork.layer_nodes].length;
            for (let i = 0; i < numberOfLayers; i++) {
                const numberOfNeurons = this.configuration[NeuralNetwork.layer_nodes][i];
                const numberOfPreviousLayerNeurons = i == 0 ? numberOfFeatures : this.configuration[NeuralNetwork.layer_nodes][i - 1];
                var tmp_weights_matrix = [];
                for (let k = 0; k < numberOfNeurons; k++) {
                    var tmp_weights_array = [];
                    for (let u = 0; u < numberOfPreviousLayerNeurons; u++) {
                        tmp_weights_array.push((Math.random() * 2 - 1) * 0.01);
                    }
                    tmp_weights_matrix.push(tmp_weights_array);
                }
                const tmp_bias = new Array(numberOfNeurons).fill([0]);
                const tmp_layer = {
                    [NeuralNetwork.weights]: tmp_weights_matrix,
                    [NeuralNetwork.bias]: tmp_bias
                };
                this.cache.push(tmp_layer);
            }
        }

        this.forwardPropagation = function forwardPropagation(features) {
            const numberOfLayers = this.configuration[NeuralNetwork.layer_nodes].length;
            for (let i = 0; i < numberOfLayers; i++) {
                const weights = this.cache[i][NeuralNetwork.weights];
                const bias = this.cache[i][NeuralNetwork.bias];
                const previousActivations = i == 0 ? this.transposeArray(features) : this.cache[i - 1][NeuralNetwork.activations];
                const Z = this.addScaler(this.dotProduct(weights, previousActivations), bias);
                const activations = i + 1 == numberOfLayers ? this.sigmoid(Z) : this.relu(Z);
                this.cache[i][NeuralNetwork.Z] = Z;
                this.cache[i][NeuralNetwork.activations] = activations;
            }
        }

        this.compute_cost = function compute_cost(targets) {
            const numberOfLayers = this.configuration[NeuralNetwork.layer_nodes].length;
            const activations = this.cache[numberOfLayers][NeuralNetwork.activations];
            const firstPart = this.dotProduct(this.log(activations), this.transposeArray(targets));
            one_minus_activations = activations.map(value => 1 - value);
            one_minus_targets = targets.map(value => 1 - value);
            const secondPart = this.dotProduct(this.log(one_minus_activations), this.transposeArray(one_minus_targets));
            const cost = -(firstPart + secondPart) / targets.length
            //cost = np.squeeze(cost)
            return cost;
        }

        this.backwardPropagation = function backwardPropagation(targets) {
            // const numberOfLayers = this.configuration[NeuralNetwork.layer_nodes].length;
            // const activations = this.cache[numberOfLayers-1][NeuralNetwork.activations];
            // const numberOfExamples = activations[0].length;
            // one_minus_activations = activations.map(value => 1 - value);
            // one_minus_targets = targets.map(value => 1 - value);
            // const dAL = - (this.broadcastDivide(targets, activations) - this.broadcastDivide(one_minus_targets, one_minus_activations))

            // Z = this.cache[numberOfLayers-1][NeuralNetwork.Z];
            // sigmoid = this.sigmoid(Z);
            // one_minus_sigmoid = this.sigmoid.map(value => 1 - value);
            // const dZ = this.multiply(dAL, this.multiply(this.sigmoid, one_minus_sigmoid));

            // dW = this.broadcastDivide(this.dotProduct(dZ, this.transposeArray(activations)), numberOfExamples);
            // db = this.broadcastDivide(this.sumRows(dZ), numberOfExamples);
            // const weights = this.cache[numberOfLayers-1][NeuralNetwork.weights];
            // dA = this.dotProduct(this.transposeArray(weights), dZ);

            // for (let i = 0; i < numberOfLayers; i++) {
            //     //
            // }
        }
    }
}


export default NeuralNetwork;