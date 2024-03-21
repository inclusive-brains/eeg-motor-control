'use strict';

let io = new IO();
io.on('connect', function () {
    console.log('Connected');
});

// Souscrire aux flux de données brutes EEG et PPG
io.subscribe('eeg_raw');
io.subscribe('ppg_raw');
io.subscribe('eda_raw');
io.subscribe('audio');

document.addEventListener('DOMContentLoaded', function () {
    var charts = {};
    var timeSeries = {};

    // Créer un graphique et une série temporelle pour la PPG
    var ppgChart = new SmoothieChart({
        millisPerPixel: 10,
        responsive: true,
        grid: { fillStyle: '#ffffff', strokeStyle: 'rgba(201,201,201,0.38)', millisPerLine: 7000 },
        labels: { fillStyle: 'rgba(0,0,0,0.68)' },
        tooltipLine: { strokeStyle: '#000000' },
        title: { fillStyle: '#ff6347', text: 'PPG_0', fontSize: 21,verticalAlign: 'top'}
    });
    var ppgTimeSeries = new TimeSeries();
    ppgChart.streamTo(document.getElementById("ppgChart"), 1000);
    ppgChart.addTimeSeries(ppgTimeSeries, { lineWidth: 2, strokeStyle: '#ff6347', interpolation: 'bezier' });

    // Créer un graphique et une série temporelle pour l'audio
    var audioChart = new SmoothieChart({
        millisPerPixel: 10,
        responsive: true,
        grid: { fillStyle: '#ffffff', strokeStyle: 'rgba(201,201,201,0.38)', millisPerLine: 7000 },
        labels: { fillStyle: 'rgba(0,0,0,0.68)' },
        tooltipLine: { strokeStyle: '#000000' },
        title: { fillStyle: '#8a2be2', text: 'Audio_0', fontSize: 21, verticalAlign: 'top' }
    });
    var audioTimeSeries = new TimeSeries();
    audioChart.streamTo(document.getElementById("audioChart"), 1000);
    audioChart.addTimeSeries(audioTimeSeries, { lineWidth: 2, strokeStyle: '#8a2be2', interpolation: 'bezier' });

    io.on('eeg_raw', (message) => {
        var data = message;
        for (var timestamp in data) {
            for (var sensor in data[timestamp]) {
                // Vérifier si le graphique pour l'électrode existe déjà, sinon le créer.
                if (!charts[sensor]) {
                    // Créer un nouvel élément canvas pour l'électrode
                    var canvas = document.createElement('canvas');
                    canvas.id = 'eegChart' + sensor;
                    canvas.style.width = '100%';
                    canvas.style.height = '100px';
                    document.getElementById('eegChartsContainer').appendChild(canvas);

                    // Initialiser le graphique Smoothie pour l'électrode
                    charts[sensor] = new SmoothieChart({
                        millisPerPixel: 10,
                        responsive: true,
                        grid: { fillStyle: '#ffffff', strokeStyle: 'rgba(201,201,201,0.38)', millisPerLine: 7000 },
                        labels: { fillStyle: 'rgba(0,0,0,0.68)' },
                        tooltipLine: { strokeStyle: '#000000' },
                        title: { fillStyle: '#012030', text: sensor, fontSize: 21, verticalAlign: 'top' }
                    });
                    timeSeries[sensor] = new TimeSeries();
                    charts[sensor].streamTo(document.getElementById('eegChart' + sensor), 1000);
                    charts[sensor].addTimeSeries(timeSeries[sensor], { lineWidth: 1, strokeStyle: '#012030', interpolation: 'bezier' });
                }

                // Ajouter les données à la série temporelle de l'électrode
                if (timeSeries[sensor]) {
                    timeSeries[sensor].append(parseInt(timestamp), data[timestamp][sensor]);
                }
            }
        }
    });

    // Créer un graphique et une série temporelle pour l'EDA
    var edaChart = new SmoothieChart({
        millisPerPixel: 10,
        responsive: true,
        grid: { fillStyle: '#ffffff', strokeStyle: 'rgba(201,201,201,0.38)', millisPerLine: 7000 },
        labels: { fillStyle: 'rgba(0,0,0,0.68)' },
        tooltipLine: { strokeStyle: '#000000' },
        title: { fillStyle: '#3cb371', text: 'EDA_0', fontSize: 21, verticalAlign: 'top' }
    });
    var edaTimeSeries = new TimeSeries();
    edaChart.streamTo(document.getElementById("edaChart"), 1000);
    edaChart.addTimeSeries(edaTimeSeries, { lineWidth: 2, strokeStyle: '#3cb371', interpolation: 'bezier' });

    // Traiter les données EDA brutes
    io.on('eda_raw', (message) => {
        var data = message;
        for (var timestamp in data) {
            if (edaTimeSeries) {
                edaTimeSeries.append(parseInt(timestamp), data[timestamp]['0']);
            }
        }
    });


    // Traiter les données PPG brutes
    io.on('ppg_raw', (message) => {
        var data = message;
        for (var timestamp in data) {
            if (ppgTimeSeries) {
                ppgTimeSeries.append(parseInt(timestamp), data[timestamp]['0']);
            }
        }
    });

    io.on('audio', (message) => {
        var data = message;
        for (var timestamp in data) {
            if (audioTimeSeries) {
                audioTimeSeries.append(parseInt(timestamp), data[timestamp]['0']);
            }
        }
    });

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