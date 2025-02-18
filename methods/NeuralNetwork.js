class NeuralNetwork {

    static iterations = "iterations";
    static learning_rate = "learning_rate";
    static layer_nodes = "layer_nodes";
    static Z = "Z";
    static weights = "weights";
    static dW = "dw";
    static bias = "bias";
    static db = "db";
    static activations = "activations";
    static dA = "dA";
    static dA_prev = "dA_prev";

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
            const cost = this.compute_cost(targets);
            console.log("cost:", cost);
            this.backwardPropagation(inputs, targets);
            this.updateParameters();
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
            return A.map(arr => arr.map(value => Math.log(value)));
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

        this.multiplyArraysElementWise = function divideArraysElementWise(arr1, arr2) {
            return arr1.map((value1, index) => value1 * arr2[index]);
        }

        this.divideArraysElementWise = function divideArraysElementWise(arr1, arr2) {
            return arr1.map((value1, index) => value1 / arr2[index]);
        }

        this.addArraysElementWise = function addArraysElementWise(arr1, arr2) {
            return arr1.map((value1, index) => value1 + arr2[index]);
        }

        this.divide = function divide(matrixA, matrixB) {
            return matrixA.map((rowA, i) =>
                rowA.map((valueA, j) => {
                    const valueB = matrixB[i][j];
                    return valueA / valueB;
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
            const activations = this.cache[numberOfLayers - 1][NeuralNetwork.activations];
            const transposedTargets = targets.map(value => [value]);
            const firstPart = this.dotProduct(this.log(activations), transposedTargets)[0][0];
            const one_minus_activations = activations.map(arr => arr.map(value => 1 - value));
            const one_minus_targets = targets.map(value => 1 - value);
            const tranposed_one_minus_targets = one_minus_targets.map(value => [value]);
            const secondPart = this.dotProduct(this.log(one_minus_activations), tranposed_one_minus_targets)[0][0];
            const cost = -(firstPart + secondPart) / targets.length;
            return cost;
        }

        this.backwardPropagation = function backwardPropagation(inputs, targets) {
            console.log("back prop ---------------------------");
            const numberOfLayers = this.configuration[NeuralNetwork.layer_nodes].length;
            const activations = this.cache[numberOfLayers - 1][NeuralNetwork.activations][0];
            const numberOfExamples = activations.length;
            const one_minus_activations = activations.map(value => 1 - value);
            const one_minus_targets = targets.map(value => 1 - value);
            const dALfirstPart = this.divideArraysElementWise(targets, activations).map(value => -value);
            const dALsecondPart = this.divideArraysElementWise(one_minus_targets, one_minus_activations);
            const dAL = this.addArraysElementWise(dALfirstPart, dALsecondPart);
            console.log("dAL:", dAL);


            // s = 1/(1+np.exp(-Z))
            // dZ = dA * s * (1-s)
            const Z = this.cache[numberOfLayers - 1][NeuralNetwork.Z];
            const ones = new Array(Z[0].length).fill(1);
            const onePlusExpNegZ = Z[0].map(value => 1 + Math.exp(-value));
            const s = this.divideArraysElementWise(ones, onePlusExpNegZ);
            const dZ = this.multiplyArraysElementWise(this.multiplyArraysElementWise(dAL, s), s.map(value => 1 - value));
            console.log("dZ:", dZ);

            // dW = np.dot(dZ, A_prev.T)/m
            const A_prev = this.cache[numberOfLayers - 2][NeuralNetwork.activations];
            const A_prevT = this.transposeArray(A_prev);
            var dW = this.dotProduct([dZ], A_prevT);
            dW = this.broadcastDivide(dW, [[numberOfExamples]]);
            console.log("dW:", dW);

            // db = np.sum(dZ, axis=1, keepdims=True)/m
            const db = dZ.reduce((accumulator, currentValue) => accumulator + currentValue, 0) / numberOfExamples;
            console.log("db:", db);

            // dA_prev = np.dot(W.T, dZ)
            const W = this.cache[numberOfLayers - 1][NeuralNetwork.weights];
            const WT = this.transposeArray(W);
            const dA_prev = this.dotProduct(WT, [dZ]);
            console.log("dA_prev:", dA_prev);

            this.cache[numberOfLayers - 1][NeuralNetwork.dA] = dAL;
            this.cache[numberOfLayers - 2][NeuralNetwork.dA_prev] = dA_prev;
            this.cache[numberOfLayers - 1][NeuralNetwork.dW] = dW;
            this.cache[numberOfLayers - 1][NeuralNetwork.db] = [[db]];


            for (let i = numberOfLayers - 2; i >= 0; i--) {
                console.log("backprop layer ::: ", i);
                const Z = this.cache[i][NeuralNetwork.Z];
                console.log("Z:", Z);


                // # When z <= 0, you should set dz to 0 as well. 
                // dZ[Z <= 0] = 0
                const dZ = Z.map(row => row.map(value => value < 0 ? 0 : value));
                console.log("dZ:", dZ);

                // dW = np.dot(dZ, A_prev.T)/m
                const A_prev = i == 0 ? inputs : this.transposeArray(this.cache[i - 1][NeuralNetwork.activations]);
                var dW = this.dotProduct(dZ, A_prev);
                dW = dW.map(row => row.map(value => value/numberOfExamples));
                console.log("dW:", dW);

                // db = np.sum(dZ, axis=1, keepdims=True)/m
                const db = this.transposeArray([this.sumRows(dZ).map(value => value/numberOfExamples)]);
                console.log("db:", db);

                // dA_prev = np.dot(W.T, dZ)
                const W = this.cache[i][NeuralNetwork.weights];
                const WT = this.transposeArray(W);
                const dA_prev = this.dotProduct(WT, dZ);
                console.log("dA_prev:", dA_prev);

                if (i > 0) {
                    this.cache[i-1][NeuralNetwork.dA] = dA_prev;
                }
                this.cache[i][NeuralNetwork.dW] = dW;
                this.cache[i][NeuralNetwork.db] = db;
            }
        }

        this.updateParameters = function updateParameters() {
            
            console.log("update parameters ---------------------------");
            for (let i = 0; i < this.cache.length; i++) {
                console.log("layer:", i);
                for (let k = 0; k < this.cache[i][NeuralNetwork.weights].length; k ++) {
                    console.log("    weight:", k);
                    for (let j = 0; j < this.cache[i][NeuralNetwork.weights][k].length; j++) {
                        console.log("        index:", j);
                        this.cache[i][NeuralNetwork.weights][k][j] -= this.configuration[NeuralNetwork.learning_rate] * this.cache[i][NeuralNetwork.dW][k][j];
                    }
                }
                for (let k = 0; k < this.cache[i][NeuralNetwork.bias].length; k++ ) {
                    console.log("    bias:", k);
                    this.cache[i][NeuralNetwork.bias][k][0] -= this.configuration[NeuralNetwork.learning_rate] * this.cache[i][NeuralNetwork.db][k][0];
                }
            }
        }
    }
}


export default NeuralNetwork;