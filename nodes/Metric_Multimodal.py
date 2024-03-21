import pandas as pd
from timeflux.core.node import Node

class MultimodalStressMetric(Node):
    def __init__(self, metrics_weights=None, multimodal_metric='Average_Multimodal_Stress_Metric'):
        super().__init__()
        # Définir les poids par défaut si aucun n'est fourni
        if metrics_weights is None:
            metrics_weights = {'PPG_Stress_Metric': 0.5, 'EEG_Stress': 0.5}
        self.metrics_weights = metrics_weights
        self.multimodal_metric = multimodal_metric
        self.last_peak_time = None

    def update(self):
        stress_metrics_multimodal = []

        # Itérer sur tous les ports qui correspondent au motif "i_*"
        for port_id, suffix, port_data in self.iterate("i_*"):
            if port_data.ready():
                for time, row in port_data.data.iterrows():
                    stress_metric_multimodal = 0
                    for metric, weight in self.metrics_weights.items():
                        try:
                            value = float(row.get(metric, 0))  # Utiliser .get() pour gérer les clés manquantes
                            stress_metric_multimodal += weight * value
                        except ValueError:
                            self.logger.error(f"Impossible de convertir {row.get(metric, 'N/A')} en float pour la métrique {metric}")
                            continue

                    stress_metrics_multimodal.append(stress_metric_multimodal)
                    self.last_peak_time = time

        if stress_metrics_multimodal:
            # Calculer la moyenne des métriques de stress multimodal
            average_stress_metric = sum(stress_metrics_multimodal) / len(stress_metrics_multimodal)
            
            # Créer un DataFrame avec la moyenne calculée
            output_df = pd.DataFrame([average_stress_metric], columns=[self.multimodal_metric])
            
            # Utiliser le dernier temps de pic détecté comme index pour le DataFrame, si applicable
            if self.last_peak_time is not None:
                output_df.index = pd.to_datetime([self.last_peak_time])
            
            # Fournir les données pour le noeud suivant
            self.o.data = output_df