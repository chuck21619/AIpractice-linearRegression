// import { trainModelAndGraphData } from './methods/univariate.js';
import Univarite from './methods/univariate.js';

var method;
function onNavButtonClick(file) {
  console.log("Navigation button clicked", file);
  if (file === 'univariate.js') {
    console.log("test 2");
    // trainModelAndGraphData();
    method = new Univarite(myChart);
  }
}

document.addEventListener('DOMContentLoaded', function() {
    console.log("dom content loaded");

    hookUpNavButtons();
    setupDropArea();
    createChart();
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
        fileInput.click();
    });

    dropArea.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        let dt = e.dataTransfer;
        let files = dt.files;
        handleFiles(files);
    }

    fileInput.addEventListener('change', () => {
        const files = fileInput.files;
        handleFiles(files);
    });
}

function handleFiles(files) {

    console.log("HANDLE FILES");

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
                
                method.trainModelAndGraphData(json);
                //trainModelAndGraphData(json);
            };
        } else {
            reader.readAsText(file);
        }
    });
}
