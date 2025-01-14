class MultipleVariable {

    constructor(chart) {

        console.log("MULTIPLE VARIABLE");
        this.chart = chart;

        this.trainModelAndGraphData = function(json) {
            console.log("train model and graph data:", json);
        }
    }    
}

export default MultipleVariable;