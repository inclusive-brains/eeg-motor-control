import pandas as pd
from timeflux.core.node import Node
import numpy as np

class AttentionMetric(Node):

    def __init__(self, weights=None):
        super().__init__()
        if weights is None:
            weights = {'HRV_RMSSD': 0.34, 'HRV_SDNN': 0.33, 'HRV_pNN50': 0.33}
        self.weights = weights
        self.last_peak_time = None

        # Définir les valeurs min et max pour la normalisation
        self.hrv_rmssd_min = 20
        self.hrv_rmssd_max = 100
        self.hrv_sdnn_min = 20
        self.hrv_sdnn_max = 100
        self.hrv_pnn50_min = 0
        self.hrv_pnn50_max = 20

    def update(self):
        if self.i.ready():
            attention_metrics = []

            for time, row in self.i.data.iterrows():
                # Récupérer les indices HRV
                hrv_rmssd = row['HRV_RMSSD']
                hrv_sdnn = row['HRV_SDNN']
                hrv_pnn50 = row['HRV_pNN50']

                # Normaliser les indices
                normalized_hrv_rmssd = max(min(1 - ((hrv_rmssd - self.hrv_rmssd_min) / (self.hrv_rmssd_max - self.hrv_rmssd_min)), 1), 0)
                normalized_hrv_sdnn = max(min(1 - ((hrv_sdnn - self.hrv_sdnn_min) / (self.hrv_sdnn_max - self.hrv_sdnn_min)), 1), 0)
                normalized_hrv_pnn50 = max(min((hrv_pnn50 - self.hrv_pnn50_min) / (self.hrv_pnn50_max - self.hrv_pnn50_min), 1), 0)

                # Calculer la métrique
                attention_metric = (self.weights['HRV_RMSSD'] * normalized_hrv_rmssd +
                                    self.weights['HRV_SDNN'] * normalized_hrv_sdnn +
                                    self.weights['HRV_pNN50'] * normalized_hrv_pnn50)

                attention_metrics.append(attention_metric)

                self.last_peak_time = time

            if attention_metrics:
                # Créer un DataFrame avec les métriques calculées
                output_df = pd.DataFrame(attention_metrics, columns=['PPG_Attention_Metric'])
                if self.last_peak_time is not None:
                    output_df.index = [self.last_peak_time] * len(attention_metrics)

                # Fournir les données pour le nœud suivant
                self.o.data = output_df