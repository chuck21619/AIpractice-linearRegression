class NeuralNetworkBinaryClassification {

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

    constructor(chart) {

        this.chart = chart;
        this.configuration = {
            [NeuralNetworkBinaryClassification.iterations]: 100,
            [NeuralNetworkBinaryClassification.learning_rate]: 0.0075,
            [NeuralNetworkBinaryClassification.layer_nodes]: [5, 1]
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
            this.forwardPropagation(jsonData.inputs);
            const predictions = this.cache[this.configuration[NeuralNetworkBinaryClassification.layer_nodes].length - 1][NeuralNetworkBinaryClassification.activations];
            return predictions[0];
        }

        this.trainModelAndGraphData = function (json, initialCallback, finishedCallback) {
            console.log("config:", this.configuration);
            this.cache = [];
            console.log("cache:", this.cache);
            const jsonData = this.parseJsonToData(json);
            const keys = jsonData.keys;
            const inputs = jsonData.inputs;
            const targets = jsonData.targets;
            this.initializeParameters(inputs[0].length);
            //console.log("after initializing parameters:", JSON.parse(JSON.stringify(this.cache)));
            //console.log("keys:", JSON.parse(JSON.stringify(keys)));
            //console.log("inputs:", JSON.parse(JSON.stringify(inputs)));
            //console.log("targets:", JSON.parse(JSON.stringify(targets)));

            for (let i = 0; i < this.configuration[NeuralNetworkBinaryClassification.iterations]; i++) {
                // //console.log("-------------------");
                ////console.log("before forward propagation ", i, ":", JSON.parse(JSON.stringify(this.cache)));
                this.forwardPropagation(inputs);
                //console.log("before compute cost ", i, ":", JSON.parse(JSON.stringify(this.cache)));
                const cost = this.compute_cost(targets);
                //console.log("before backward propagation ", i, ":", JSON.parse(JSON.stringify(this.cache)));
                this.backwardPropagation(inputs, targets);
                //console.log("before update parameters propagation ", i, ":", JSON.parse(JSON.stringify(this.cache)));
                this.updateParameters();                
                // if ( (i == this.configuration[NeuralNetworkBinaryClassification.iterations] - 1) || (i % (this.configuration[NeuralNetworkBinaryClassification.iterations] / 10) == 0) ) {
                //     console.log("iteration:", i, " cost:", cost);
                //     console.log("cache ", i, ":", JSON.parse(JSON.stringify(this.cache)));
                // }
            }
            finishedCallback("", []);

            // const equationString = "";
            // const featureImpacts = []
            // finishedCallback(equationString, featureImpacts);
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
            const numberOfLayers = this.configuration[NeuralNetworkBinaryClassification.layer_nodes].length;
            for (let i = 0; i < numberOfLayers; i++) {
                const numberOfNeurons = this.configuration[NeuralNetworkBinaryClassification.layer_nodes][i];
                const numberOfPreviousLayerNeurons = i == 0 ? numberOfFeatures : this.configuration[NeuralNetworkBinaryClassification.layer_nodes][i - 1];
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
                    [NeuralNetworkBinaryClassification.weights]: tmp_weights_matrix,
                    [NeuralNetworkBinaryClassification.bias]: tmp_bias
                };
                this.cache.push(tmp_layer);
            }
        }

        this.forwardPropagation = function forwardPropagation(features) {
            //console.log("forwardPropagation---------");
            const numberOfLayers = this.configuration[NeuralNetworkBinaryClassification.layer_nodes].length;
            for (let i = 0; i < numberOfLayers; i++) {
                //console.log("                  ---------layer:", i);
                const weights = this.cache[i][NeuralNetworkBinaryClassification.weights];
                //console.log("weights:", weights);
                const bias = this.cache[i][NeuralNetworkBinaryClassification.bias];
                //console.log("bias:", bias);
                const previousActivations = i == 0 ? this.transposeArray(features) : this.cache[i - 1][NeuralNetworkBinaryClassification.activations];
                //console.log("previousActivations:", previousActivations);
                const Z = this.addScaler(this.dotProduct(weights, previousActivations), bias);
                //console.log("Z:", Z);
                const activations = i + 1 == numberOfLayers ? this.sigmoid(Z) : this.relu(Z);
                //console.log("activations:", activations);
                this.cache[i][NeuralNetworkBinaryClassification.Z] = Z;
                this.cache[i][NeuralNetworkBinaryClassification.activations] = activations;
            }
            //console.log("end forwardPropagation-----");
        }

        this.compute_cost = function compute_cost(targets) {
            const numberOfLayers = this.configuration[NeuralNetworkBinaryClassification.layer_nodes].length;
            const activations = this.cache[numberOfLayers - 1][NeuralNetworkBinaryClassification.activations];
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
            const numberOfLayers = this.configuration[NeuralNetworkBinaryClassification.layer_nodes].length;
            const activations = this.cache[numberOfLayers - 1][NeuralNetworkBinaryClassification.activations][0];
            const numberOfExamples = activations.length;
            const one_minus_activations = activations.map(value => 1 - value);
            const one_minus_targets = targets.map(value => 1 - value);
            const dALfirstPart = this.divideArraysElementWise(targets, activations).map(value => -value);
            const dALsecondPart = this.divideArraysElementWise(one_minus_targets, one_minus_activations);
            const dAL = this.addArraysElementWise(dALfirstPart, dALsecondPart);

            // s = 1/(1+np.exp(-Z))
            // dZ = dA * s * (1-s)
            const Z = this.cache[numberOfLayers - 1][NeuralNetworkBinaryClassification.Z];
            // //console.log("Z:", JSON.parse(JSON.stringify(Z)));
            const ones = new Array(Z[0].length).fill(1);
            // //console.log("ones:", JSON.parse(JSON.stringify(ones)));
            const onePlusExpNegZ = Z[0].map(value => 1 + Math.exp(-value));
            // //console.log("onePlusExpNegZ:", JSON.parse(JSON.stringify(onePlusExpNegZ)));
            const s = this.divideArraysElementWise(ones, onePlusExpNegZ);
            // //console.log("s:", JSON.parse(JSON.stringify(s)));
            const dZ = this.multiplyArraysElementWise(this.multiplyArraysElementWise(dAL, s), s.map(value => 1 - value));
            // //console.log("dZ:", JSON.parse(JSON.stringify(dZ)));

            // dW = np.dot(dZ, A_prev.T)/m
            const A_prev = this.cache[numberOfLayers - 2][NeuralNetworkBinaryClassification.activations];
            // //console.log("A_prev:", JSON.parse(JSON.stringify(A_prev)));
            const A_prevT = this.transposeArray(A_prev);
            // //console.log("A_prevT:", JSON.parse(JSON.stringify(A_prevT)));
            var dW = this.dotProduct([dZ], A_prevT);
            // //console.log("dW1:", JSON.parse(JSON.stringify(dW)));
            dW = this.broadcastDivide(dW, [[numberOfExamples]]);
            // //console.log("dW2:", JSON.parse(JSON.stringify(dW)));

            // db = np.sum(dZ, axis=1, keepdims=True)/m
            const db = dZ.reduce((accumulator, currentValue) => accumulator + currentValue, 0) / numberOfExamples;

            // dA_prev = np.dot(W.T, dZ)
            const W = this.cache[numberOfLayers - 1][NeuralNetworkBinaryClassification.weights];
            const WT = this.transposeArray(W);
            const dA_prev = this.dotProduct(WT, [dZ]);

            this.cache[numberOfLayers - 1][NeuralNetworkBinaryClassification.dA] = [dAL]; //       <------ i just put dAL inside of brackets.
            this.cache[numberOfLayers - 2][NeuralNetworkBinaryClassification.dA] = dA_prev;
            this.cache[numberOfLayers - 1][NeuralNetworkBinaryClassification.dW] = dW;
            this.cache[numberOfLayers - 1][NeuralNetworkBinaryClassification.db] = [[db]];
            //console.log("dAL:", JSON.parse(JSON.stringify(this.cache[numberOfLayers - 1][NeuralNetwork.dA])));

            //console.log("cache after Lth layer backprop:", JSON.parse(JSON.stringify(this.cache)));
            for (let i = numberOfLayers - 2; i >= 0; i--) {
                //console.log("    --------------LAYER ", i, ":");
                //console.log("dA:", JSON.parse(JSON.stringify(this.cache[i][NeuralNetwork.dA])));
                const Z = this.cache[i][NeuralNetworkBinaryClassification.Z];
                //console.log("Z:", JSON.parse(JSON.stringify(Z)));

                // # When z <= 0, you should set dz to 0 as well. 
                // dZ[Z <= 0] = 0
                const dZ = this.cache[i][NeuralNetworkBinaryClassification.dA].map((row, rowIndex) => row.map((value, valueIndex) => Z[rowIndex][valueIndex] < 0 ? 0 : value));
                //console.log("dZ:", JSON.parse(JSON.stringify(dZ)));

                // dW = np.dot(dZ, A_prev.T)/m
                const A_prevT = i == 0 ? inputs : this.transposeArray(this.cache[i - 1][NeuralNetworkBinaryClassification.activations]);
                //console.log("A_prevT:", JSON.parse(JSON.stringify(A_prev)));
                var dW = this.dotProduct(dZ, A_prevT);
                //console.log("dW1:", JSON.parse(JSON.stringify(dW)));
                dW = dW.map(row => row.map(value => value/numberOfExamples));
                //console.log("dW2:", JSON.parse(JSON.stringify(dW)));

                // db = np.sum(dZ, axis=1, keepdims=True)/m
                const db = this.transposeArray([this.sumRows(dZ).map(value => value/numberOfExamples)]);

                // dA_prev = np.dot(W.T, dZ)
                const W = this.cache[i][NeuralNetworkBinaryClassification.weights];
                const WT = this.transposeArray(W);
                const dA_prev = this.dotProduct(WT, dZ);

                if (i > 0) {
                    this.cache[i-1][NeuralNetworkBinaryClassification.dA] = dA_prev;
                }
                this.cache[i][NeuralNetworkBinaryClassification.dW] = dW;
                this.cache[i][NeuralNetworkBinaryClassification.db] = db;
            }
        }

        this.updateParameters = function updateParameters() {
            
            // //console.log("------update parameters start-----", JSON.parse(JSON.stringify(this.cache)));
            for (let i = 0; i < this.cache.length; i++) {
                for (let k = 0; k < this.cache[i][NeuralNetworkBinaryClassification.weights].length; k ++) {
                    for (let j = 0; j < this.cache[i][NeuralNetworkBinaryClassification.weights][k].length; j++) {
                        // this.cache[i][NeuralNetwork.weights][k][j] = this.cache[i][NeuralNetwork.weights][k][j] - (this.cache[i][NeuralNetwork.dW][k][j] * this.configuration[NeuralNetwork.learning_rate]);
                        // i dont know why the below line doesnt work. instead i have to use the line above
                        // hmmm. maybe the below line does work and i debugged incorrectly
                        this.cache[i][NeuralNetworkBinaryClassification.weights][k][j] -= this.configuration[NeuralNetworkBinaryClassification.learning_rate] * this.cache[i][NeuralNetworkBinaryClassification.dW][k][j];
                    }
                }
                for (let k = 0; k < this.cache[i][NeuralNetworkBinaryClassification.bias].length; k++ ) {
                    this.cache[i][NeuralNetworkBinaryClassification.bias][k][0] -= this.configuration[NeuralNetworkBinaryClassification.learning_rate] * this.cache[i][NeuralNetworkBinaryClassification.db][k][0];
                }
            }
            
            // //console.log("------update parameters end-------", JSON.parse(JSON.stringify(this.cache)));
        }
    }
}


export default NeuralNetworkBinaryClassification;