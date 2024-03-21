'use strict';

// Connect to socket
let io = new IO();

// Subscribe to data stream
io.subscribe('multimodal_stress');
io.subscribe('multimodal_attention');
io.subscribe('multimodal_cognitive_load');
io.subscribe('multimodal_arousal');

// Connect event
io.on('connect', () => {
    console.log('connected');
});

// Load settings from YAML graph
load_settings().then(settings => {
    console.log(settings);
});

// Add event listeners to buttons
document.addEventListener('DOMContentLoaded', function () {
    const startButton = document.getElementById('startButton');
    const stopButton = document.getElementById('stopButton');
    const markButton = document.getElementById('markButton');

    startButton.addEventListener('click', function () {
        sendStartEvent();
    });

    stopButton.addEventListener('click', function () {
        sendStopEvent();
    });

    markButton.addEventListener('click', function () {
        sendMarkerEvent();
    });
});

// Definition of sendStartEvent and sendStopEvent functions
function sendStartEvent() {
    // Logic to send a start event
    io.event('start');
}

function sendStopEvent() {
    // Logic to send a start event
    io.event('stop');
}

function sendMarkerEvent() {
    // Logic to send a start event
    io.event('marker');
}

io.on('multimodal_stress', (data) => {
    // Get last row of data
    //console.log('Received data:', data);
    let keys = Object.keys(data);
    let lastKey = keys[keys.length - 1];
    let stress = data[lastKey].multimodal_stress;
    document.getElementById('stress_absolute').innerText = stress.toFixed(3);
    document.getElementById('stress_progress').value = stress;
    //console.log('Received data:', stress);
    // Update chart data for stress
    chartData.datasets[0].data[0] = stress; // Assuming stress is the first label
    metricsChart.update();
});

io.on('multimodal_attention', (data) => {
    // Get last row of data
    //console.log('Received data:', data);
    let keys = Object.keys(data);
    let lastKey = keys[keys.length - 1];
    let attention = data[lastKey].multimodal_attention;
    document.getElementById('attention_absolute').innerText = attention.toFixed(3);
    document.getElementById('attention_progress').value = attention;
    //console.log('Received data:', attention);
    chartData.datasets[0].data[1] = attention; // Assuming stress is the first label
    metricsChart.update();
});

io.on('multimodal_cognitive_load', (data) => {
    // Get last row of data
    //console.log('Received data:', data);
    let keys = Object.keys(data);
    let lastKey = keys[keys.length - 1];
    let cognitive_load = data[lastKey].multimodal_cognitive_load;
    document.getElementById('cognitive_load_absolute').innerText = cognitive_load.toFixed(3);
    document.getElementById('cognitive_load_progress').value = cognitive_load.toFixed(3);
    //console.log('Received data:', cognitive_load);
    // Update chart data for stress
    chartData.datasets[0].data[2] = cognitive_load; // Assuming stress is the first label
    metricsChart.update();
});

io.on('multimodal_arousal', (data) => {
    // Get last row of data
    //console.log('Received data:', data);
    let keys = Object.keys(data);
    let lastKey = keys[keys.length - 1];
    let arousal = data[lastKey].multimodal_arousal;
    document.getElementById('arousal_absolute').innerText = arousal.toFixed(3);
    document.getElementById('arousal_progress').value = arousal.toFixed(3);
    //console.log('Received data:', arousal);
    // Update chart data for stress
    chartData.datasets[0].data[3] = arousal; // Assuming stress is the first label
    metricsChart.update();
});

// Define initial data for the chart
const chartData = {
    labels: ['Stress', 'Attention', 'Cognitive Load', 'Arousal'],
    datasets: [{
        label: 'Metrics',
        data: [0, 0, 0, 0], // Initial data set to 0
        backgroundColor: [
            'rgba(255, 99, 132, 0.2)',
            'rgba(54, 162, 235, 0.2)',
            'rgba(255, 206, 86, 0.2)',
            'rgba(75, 192, 192, 0.2)'
        ],
        borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)'
        ],
        borderWidth: 1
    }]
};

// Initialize the Chart.js chart
const ctx = document.getElementById('metricsChart').getContext('2d');
const metricsChart = new Chart(ctx, {
    type: 'bar',
    data: chartData,
    options: {
        scales: {
            y: {
                beginAtZero: true
            }
        }
    }
});
