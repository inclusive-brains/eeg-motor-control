'use strict';

let io = new IO();
io.on('connect', function () {
    console.log('Connected');
});

// Souscrire aux flux de données brutes EEG et PPG
io.subscribe('eeg_filtered');
io.subscribe('eeg_stress_metric');
io.subscribe('eeg_cognitiveload_metric');
io.subscribe('eeg_attention_metric');
io.subscribe('eeg_arousal_metric');

document.addEventListener('DOMContentLoaded', function () {
    var charts = {};
    var timeSeries = {};

    io.on('eeg_filtered', (message) => {
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
    
    io.on('eeg_stress_metric', (data) => {
        let keys = Object.keys(data);
        let lastKey = keys[keys.length - 1];
        let stress = data[lastKey].eeg_stress;

        // Limiter le pourcentage de stress à deux décimales
        let stressPercentage = (stress * 100).toFixed(2); // Convertir en pourcentage et formater
        document.querySelector('#stress_title span').textContent = `${stressPercentage}%`;
        let stressProgressBar = document.querySelector('#stress_progress');
        stressProgressBar.style.width = `${stressPercentage}%`;
        stressProgressBar.setAttribute('aria-valuenow', stressPercentage);
        stressProgressBar.textContent = `${stressPercentage}%`; // Mise à jour du texte pour les lecteurs d'écran
    });

    io.on('eeg_cognitiveload_metric', (data) => {
        let keys = Object.keys(data);
        let lastKey = keys[keys.length - 1];
        let cognitiveLoad = data[lastKey].eeg_cognitive_load;

        // Limiter le pourcentage de stress à deux décimales
        let cognitiveLoadPercentage = (cognitiveLoad * 100).toFixed(2); // Convertir en pourcentage et formater
        document.querySelector('#cognitive_load_title span').textContent = `${cognitiveLoadPercentage}%`;
        let cognitiveLoadProgressBar = document.querySelector('#cognitive_load_progress');
        cognitiveLoadProgressBar.style.width = `${cognitiveLoadPercentage}%`;
        cognitiveLoadProgressBar.setAttribute('aria-valuenow', cognitiveLoadPercentage);
        cognitiveLoadProgressBar.textContent = `${cognitiveLoadPercentage}%`; // Mise à jour du texte pour les lecteurs d'écran
    });

    
    io.on('eeg_attention_metric', (data) => {
        let keys = Object.keys(data);
        let lastKey = keys[keys.length - 1];
        let attention = data[lastKey].eeg_attention; // Assurez-vous que cela correspond à la clé réelle

        // Limiter le pourcentage d'attention à deux décimales
        let attentionPercentage = (attention * 100).toFixed(2); // Convertir en pourcentage et formater
        document.querySelector('#attention_title span').textContent = `${attentionPercentage}%`;
        let attentionProgressBar = document.querySelector('#attention_progress');
        attentionProgressBar.style.width = `${attentionPercentage}%`;
        attentionProgressBar.setAttribute('aria-valuenow', attentionPercentage);
        attentionProgressBar.textContent = `${attentionPercentage}%`; // Mise à jour du texte pour les lecteurs d'écran
    });

    io.on('eeg_arousal_metric', (data) => {
        let keys = Object.keys(data);
        let lastKey = keys[keys.length - 1];
        let arousal = data[lastKey].eeg_arousal; // Assurez-vous que cela correspond à la clé réelle

        // Limiter le pourcentage d'arousal à deux décimales
        let arousalPercentage = (arousal * 100).toFixed(2); // Convertir en pourcentage et formater
        document.querySelector('#arousal_title span').textContent = `${arousalPercentage}%`;
        let arousalProgressBar = document.querySelector('#arousal_progress');
        arousalProgressBar.style.width = `${arousalPercentage}%`;
        arousalProgressBar.setAttribute('aria-valuenow', arousalPercentage);
        arousalProgressBar.textContent = `${arousalPercentage}%`; // Mise à jour du texte pour les lecteurs d'écran
    });

    var metricsChart = new SmoothieChart({
        millisPerPixel: 50,
        responsive: true,
        timestampFormatter: SmoothieChart.timeFormatter,
        grid: { fillStyle: '#ffffff', strokeStyle: 'rgba(201,201,201,0.38)', millisPerLine: 7000 },
        labels: { fillStyle: 'rgba(0,0,0,0.68)' },
        maxValue: 1, // Les métriques sont normalement de 0 à 1
        minValue: 0
    });

    // Créer des séries temporelles pour chaque métrique
    var stressSeries = new TimeSeries();
    var cognitiveLoadSeries = new TimeSeries();
    var attentionSeries = new TimeSeries();
    var arousalSeries = new TimeSeries();

    // Associer les séries temporelles au graphique avec différentes couleurs
    metricsChart.addTimeSeries(stressSeries, { lineWidth: 2, strokeStyle: '#ff6347', interpolation: 'bezier' });
    metricsChart.addTimeSeries(cognitiveLoadSeries, { lineWidth: 2, strokeStyle: '#ffa500', interpolation: 'bezier' });
    metricsChart.addTimeSeries(attentionSeries, { lineWidth: 2, strokeStyle: '#012030', interpolation: 'bezier' });
    metricsChart.addTimeSeries(arousalSeries, { lineWidth: 2, strokeStyle: '#4682b4', interpolation: 'bezier' });

    // Diffuser le graphique dans l'élément HTML correspondant
    metricsChart.streamTo(document.getElementById("metricsChart"), 1000);

    // Fonctions pour traiter et afficher les données de chaque métrique dans le graphique
    function processMetric(data, series, metricName) {
        let keys = Object.keys(data);
        let lastKey = keys[keys.length - 1];
        let metricValue = data[lastKey][metricName];
        if (metricValue !== undefined) { // Vérifiez si la valeur de la métrique est définie
            series.append(new Date().getTime(), metricValue);
        }
    }

    // Écouteurs pour chaque métrique
    io.on('eeg_stress_metric', (data) => {
        processMetric(data, stressSeries, 'eeg_stress');
    });

    io.on('eeg_cognitiveload_metric', (data) => {
        processMetric(data, cognitiveLoadSeries, 'eeg_cognitive_load');
    });

    io.on('eeg_attention_metric', (data) => {
        processMetric(data, attentionSeries, 'eeg_attention');
    });

    io.on('eeg_arousal_metric', (data) => {
        processMetric(data, arousalSeries, 'eeg_arousal');
    });

});