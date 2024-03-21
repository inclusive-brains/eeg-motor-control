'use strict';

let io = new IO();
io.on('connect', function () {
    console.log('Connected');
});

// Souscrire aux flux de données brutes EDA et Température
io.subscribe('eda_raw');
io.subscribe('temperature_raw');

document.addEventListener('DOMContentLoaded', function () {
    var charts = {};
    var timeSeries = {};

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

    // Créer un graphique et une série temporelle pour la température
    var tempChart = new SmoothieChart({
        millisPerPixel: 10,
        responsive: true,
        grid: { fillStyle: '#ffffff', strokeStyle: 'rgba(201,201,201,0.38)', millisPerLine: 7000 },
        labels: { fillStyle: 'rgba(0,0,0,0.68)' },
        tooltipLine: { strokeStyle: '#000000' },
        title: { fillStyle: '#f08080', text: 'Temp_0', fontSize: 21, verticalAlign: 'top' }
    });
    var tempTimeSeries = new TimeSeries();
    tempChart.streamTo(document.getElementById("tempChart"), 1000);
    tempChart.addTimeSeries(tempTimeSeries, { lineWidth: 2, strokeStyle: '#f08080', interpolation: 'bezier' });

    // Traiter les données de température brutes
    io.on('temperature_raw', (message) => {
        var data = message;
        for (var timestamp in data) {
            if (tempTimeSeries) {
                tempTimeSeries.append(parseInt(timestamp), data[timestamp]['0']);
            }
        }
    });

});