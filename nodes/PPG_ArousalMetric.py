import pandas as pd
from timeflux.core.node import Node
import numpy as np

class ArousalMetric(Node):

    def __init__(self, weights=None):
        super().__init__()
        if weights is None:
            weights = {'HRV_MeanNN': 0.33, 'HRV_RMSSD': 0.33, 'HRV_SDSD': 0.34}
        self.weights = weights
        self.last_peak_time = None

        # Définir les valeurs min et max pour la normalisation
        self.hrv_meanNN_min = 50
        self.hrv_meanNN_max = 120
        self.hrv_rmssd_min = 20
        self.hrv_rmssd_max = 100
        self.hrv_sdsd_min = 20
        self.hrv_sdsd_max = 100

    def update(self):
        if self.i.ready():
            arousal_metrics = []

            for time, row in self.i.data.iterrows():
                # Récupérer les indices HRV pertinents pour l'éveil
                hrv_meanNN = row['HRV_MeanNN']
                hrv_rmssd = row['HRV_RMSSD']
                hrv_sdsd = row['HRV_SDSD']

                # Normalized HRV indices within [0, 1]
                normalized_hrv_meanNN = max(min(1 - ((hrv_meanNN - self.hrv_meanNN_min) / (self.hrv_meanNN_max - self.hrv_meanNN_min)), 1), 0)
                normalized_hrv_rmssd = max(min(1 - ((hrv_rmssd - self.hrv_rmssd_min) / (self.hrv_rmssd_max - self.hrv_rmssd_min)), 1), 0)
                normalized_hrv_sdsd = max(min(1 - ((hrv_sdsd - self.hrv_sdsd_min) / (self.hrv_sdsd_max - self.hrv_sdsd_min)), 1), 0)

                # Calculer la métrique d'éveil
                arousal_metric = (self.weights['HRV_MeanNN'] * normalized_hrv_meanNN +
                                  self.weights['HRV_RMSSD'] * normalized_hrv_rmssd +
                                  self.weights['HRV_SDSD'] * normalized_hrv_sdsd)

                arousal_metrics.append(arousal_metric)

                self.last_peak_time = time

            if arousal_metrics:
                # Créer un DataFrame avec les métriques calculées
                output_df = pd.DataFrame(arousal_metrics, columns=['PPG_Arousal_Metric'])

                # Use the last detected peak time as the index for the DataFrame
                if self.last_peak_time is not None:
                    output_df.index = [self.last_peak_time] * len(arousal_metrics)

                # Fournir les données pour le nœud suivant
                self.o.data = output_df