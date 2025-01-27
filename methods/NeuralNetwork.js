class NeuralNetwork {

    static iterations = "iterations";
    static learning_rate = "learning_rate";
    static hidden_layer_nodes = "hidden_layer_nodes";
    static weights = "weights";
    static bias = "bias";
    static dw = "dw";
    static db = "db";

    constructor(chart) {

        this.chart = chart;
        this.configuration = {
            iterations: 100,
            learning_rate: 0.01,
            hidden_layer_nodes: [3, 5, 2]
        };
        this.cache = [
            //
            //  { //layer 1
            //      "weights":[[0, 0, 0, 0],
            //                 [0, 0, 0, 0],
            //                 [0, 0, 0, 0]],
            //      "bias": [[0],
            //               [0],
            //               [0]],
            //      "dw": [0, 0, 0, 0],
            //      "db": 0
            //  },
            //  { //layer 2
            //      "weights":[[0, 0, 0, 0],
            //                 [0, 0, 0, 0],
            //                 [0, 0, 0, 0],
            //                 [0, 0, 0, 0],
            //                 [0, 0, 0, 0]],
            //      "bias": [[0],
            //               [0],
            //               [0],
            //               [0],
            //               [0]],
            //      "dw": [0, 0, 0, 0],
            //      "db": 0
            //  },,
            //  { //layer 3
            //      "weights":[[0, 0, 0, 0],
            //                 [0, 0, 0, 0]],
            //      "bias": [[0],
            //               [0]],
            //      "dw": [0, 0, 0, 0],
            //      "db": 0
            //  },
            //
        ];

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

        this.trainModelAndGraphData = function(json, initialCallback, finishedCallback) {
            this.initializeParameters(4);
            console.log("cache:", this.cache);
            // const jsonData = this.parseJsonToData(json);
            // const keys = jsonData.keys;
            // const inputs = jsonData.inputs;
            // const targets = jsonData.targets;
            // initialCallback();
            // const equationString = "";
            // const featureImpacts = []
            // finishedCallback(equationString, featureImpacts);
        }

        this.parseJsonAndPredict = function parseJsonAndPredict(json) {
            const predictions = [];
            return predictions;
        }

        this.initializeParameters = function initializeParameters(numberOfFeatures) {
            const numberOfLayers = this.configuration[NeuralNetwork.hidden_layer_nodes].length;
            for (let i = 0; i < numberOfLayers; i++) {
                const numberOfNeurons = this.configuration[NeuralNetwork.hidden_layer_nodes][i];
                const numberOfPreviousLayerNeurons = i == 0 ? numberOfFeatures : this.configuration[NeuralNetwork.hidden_layer_nodes][i-1];
                var tmp_weights_matrix = [];
                for (let k = 0; k < numberOfNeurons; k++) {
                    var tmp_weights_array = [];
                    for (let u = 0; u < numberOfPreviousLayerNeurons; u++) {
                        tmp_weights_array.push((Math.random() * 2 - 1) * 0.01);
                    }
                    tmp_weights_matrix.push(tmp_weights_array);
                }
                const tmp_bias = new Array(numberOfNeurons).fill(0);
                const tmp_layer = {
                    [NeuralNetwork.weights]: tmp_weights_matrix,
                    [NeuralNetwork.bias]: tmp_bias
                };
                this.cache.push(tmp_layer);
            }
        }
    }
}


export default NeuralNetwork;