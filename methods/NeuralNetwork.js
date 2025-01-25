class NeuralNetwork {

    constructor(chart) {

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
            const jsonData = this.parseJsonToData(json);
            const keys = jsonData.keys;
            const inputs = jsonData.inputs;
            const targets = jsonData.targets;
            initialCallback();
            const equationString = "";
            const featureImpacts = []
            finishedCallback(equationString, featureImpacts);
        }

        this.parseJsonAndPredict = function parseJsonAndPredict(json) {
            const predictions = [];
            return predictions;
        }
    }
}


export default NeuralNetwork;