import Univarite from './methods/Univariate.js';
import MultipleVariable from './methods/MultipleVariable.js';

var method;
function onNavButtonClick(file) {
    console.log("nav button clicked", file);

    // Get all navigation links
    const navLinks = document.querySelectorAll('nav ul li a');

    // Remove active class from all links
    navLinks.forEach(link => link.classList.remove('active'));

    // Add active class to the clicked link
    const clickedLink = document.querySelector(`nav ul li a[data-jsFile="${file}"]`);
    clickedLink.classList.add('active');

    document.getElementById('drop-area').hidden = false;
    setChartVisible(false);
    if (file == 'univariate.js') {
        method = new Univarite(myChart);
        document.getElementById('title').innerHTML = "Univariate<br>Linear Regression";
        document.getElementById('subtitle').innerHTML = "something about univariate linear regression";
    }
    else if (file == 'multipleVariable.js') {
        document.getElementById('title').innerHTML = "Multiple Variable<br>Linear Regression";
        document.getElementById('subtitle').innerHTML = "something about multiple variable linear regression";
        method = new MultipleVariable(myChart);
    }
}

window.addEventListener('resize', function () {
    updateChartMaxHeight();
});

function updateChartMaxHeight() {
    const chartElement = document.getElementById('myChart');
    const chartBottom = chartElement.getBoundingClientRect().top;
    const windowHeight = window.innerHeight;
    const maxChartHeight = windowHeight - chartBottom;
    chartElement.style.maxHeight = maxChartHeight + 'px';
}

document.addEventListener('DOMContentLoaded', function () {
    console.log("dom content loaded");

    hookUpNavButtons();
    setupDropArea();
    createChart();
    setChartVisible(false);
});

var myChart;
function createChart() {
    const ctx = document.getElementById('myChart').getContext('2d');
    myChart = new Chart(ctx, {
        type: 'scatter',
        data: { datasets: [] },
        options: {
            backgroundColor: 'rgb(255, 255, 255)',
            color: 'rgb(255, 255, 255)',
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    grid: { color: 'rgb(0, 0, 0)' },
                    ticks: { color: 'rgb(0, 0, 0)' }
                },
                y: {
                    type: 'linear',
                    position: 'left',
                    grid: { color: 'rgb(0, 0, 0)' },
                    ticks: { color: 'rgb(0, 0, 0)' }
                }
            }
        }
    });
    updateChartMaxHeight();
}

function hookUpNavButtons() {
    console.log("hook up nav buttons");

    const navLinks = document.querySelectorAll('nav ul li a');
    navLinks.forEach(link => {
        const jsFile = link.getAttribute('data-jsFile');
        link.addEventListener('click', () => onNavButtonClick(jsFile));
    });
}

function setupDropArea() {
    console.log("setup drop area");
    const dropArea = document.getElementById('drop-area');

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });

    function highlight(e) {
        dropArea.classList.add('highlight');
    }

    function unhighlight(e) {
        dropArea.classList.remove('highlight');
    }

    const fileInput = document.getElementById('fileInput');

    dropArea.addEventListener('click', () => {
        console.log("file click");
        fileInput.click();
    });

    dropArea.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        console.log("handle drop");
        let dt = e.dataTransfer;
        let files = dt.files;
        handleFiles(files);
    }

    fileInput.addEventListener('change', () => {
        console.log("file change");
        const files = fileInput.files;
        handleFiles(files);
        fileInput.value = '';
    });
}

function handleFiles(files) {
    console.log("handle files:", files);

    ([...files]).forEach(file => {
        const reader = new FileReader();
        reader.onload = function (e) {
            console.log(e.target.result);
        };
        if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            reader.readAsArrayBuffer(file);
            reader.onload = function (e) {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet);

                setChartVisible(true);
                method.trainModelAndGraphData(json);
            };
        } else {
            reader.readAsText(file);
        }
    });
}

function setChartVisible(showChart) {
    if ( showChart ) {
        console.log("show chart");
        document.getElementById('myChart').style.visibility = 'visible';
    }
    else {
        console.log("hide chart");
        document.getElementById('myChart').style.visibility = 'hidden';
        myChart.clear();
    }
}
