import pandas as pd
from timeflux.core.node import Node
import numpy as np

class CognitiveLoadMetric(Node):

    def __init__(self, weights=None):
        super().__init__()
        if weights is None:
            weights = {'HRV_SDNN': 0.5, 'HRV_RMSSD': 0.5}
        self.weights = weights
        self.last_peak_time = None

        # Définir les valeurs min et max pour la normalisation
        self.hrv_sdnn_min = 30
        self.hrv_sdnn_max = 140
        self.hrv_rmssd_min = 20
        self.hrv_rmssd_max = 100

    def update(self):
        if self.i.ready():
            cognitive_load_metrics = []

            for time, row in self.i.data.iterrows():
                # Récupérer les indices HRV adaptés au temps réel
                hrv_sdnn = row['HRV_SDNN']
                hrv_rmssd = row['HRV_RMSSD']

                # Normalized HRV indices within [0, 1]
                normalized_hrv_sdnn = max(min(1 - ((hrv_sdnn - self.hrv_sdnn_min) / (self.hrv_sdnn_max - self.hrv_sdnn_min)), 1), 0)
                normalized_hrv_rmssd = max(min(1 - ((hrv_rmssd - self.hrv_rmssd_min) / (self.hrv_rmssd_max - self.hrv_rmssd_min)), 1), 0)

                # Calculer la métrique de charge cognitive
                cognitive_load_metric = (self.weights['HRV_SDNN'] * normalized_hrv_sdnn +
                                         self.weights['HRV_RMSSD'] * normalized_hrv_rmssd)

                cognitive_load_metrics.append(cognitive_load_metric)

                self.last_peak_time = time

            if cognitive_load_metrics:
                # Créer un DataFrame avec les métriques calculées
                output_df = pd.DataFrame(cognitive_load_metrics, columns=['PPG_Cognitive_Load_Metric'])

                # Use the last detected peak time as the index for the DataFrame
                if self.last_peak_time is not None:
                    output_df.index = [self.last_peak_time] * len(cognitive_load_metrics)

                # Fournir les données pour le nœud suivant
                self.o.data = output_df