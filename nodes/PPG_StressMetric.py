import pandas as pd
from timeflux.core.node import Node
import numpy as np

class StressMetric(Node):

    def __init__(self, weights=None):
        super().__init__()
        if weights is None:
            weights = {'HRV_SDNN': 0.33, 'HRV_RMSSD': 0.33, 'HRV_pNN50': 0.34}
        self.weights = weights
        self.last_peak_time = None

        # Définir les valeurs min et max pour la normalisation
        self.hrv_sdnn_min = 30
        self.hrv_sdnn_max = 140
        self.hrv_rmssd_min = 20
        self.hrv_rmssd_max = 100
        self.hrv_pnn50_min = 0
        self.hrv_pnn50_max = 20

    def update(self):
        if self.i.ready():
            stress_metrics = []

            for time, row in self.i.data.iterrows():
                # Récupérer les indices HRV
                hrv_sdnn = row['HRV_SDNN']
                hrv_rmssd = row['HRV_RMSSD']
                hrv_pnn50 = row['HRV_pNN50']

                # Normalized HRV indices within [0, 1]
                normalized_hrv_sdnn = max(min(1 - ((hrv_sdnn - self.hrv_sdnn_min) / (self.hrv_sdnn_max - self.hrv_sdnn_min)), 1), 0)
                normalized_hrv_rmssd = max(min(1 - ((hrv_rmssd - self.hrv_rmssd_min) / (self.hrv_rmssd_max - self.hrv_rmssd_min)), 1), 0)
                normalized_hrv_pnn50 = max(min((hrv_pnn50 - self.hrv_pnn50_min) / (self.hrv_pnn50_max - self.hrv_pnn50_min), 1), 0)

                # Calculate stress metric
                stress_metric = (self.weights['HRV_SDNN'] * normalized_hrv_sdnn +
                                 self.weights['HRV_RMSSD'] * normalized_hrv_rmssd +
                                 self.weights['HRV_pNN50'] * normalized_hrv_pnn50)

                stress_metrics.append(stress_metric)

                self.last_peak_time = time

            if stress_metrics:
                output_df = pd.DataFrame(stress_metrics, columns=['PPG_Stress_Metric'])
                if self.last_peak_time is not None:
                    output_df.index = [self.last_peak_time] * len(stress_metrics)
                self.o.data = output_df