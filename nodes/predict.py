import json
import numpy as np
from timeflux.core.node import Node
from timeflux.helpers.port import make_event


class Accumulate(Node):
    """Accumulation of probabilities

    This node accumulates the probabilities of single-trial classifications from a ML node.
    When enough confidence is reached for a specific class, a final prediction is made.
    Confidence is defined by the threshold ratio between the two best candidates, after summing the probabilities for each class.

    Attributes:
        i_model (Port): Single-trial predictions from the ML node, expects DataFrame.
        o_events (Port): Final predictions, provides DataFrame

    Args:
        threshold (float): ratio between the two best candidates to reach confidence (default: 2).
        buffer_size (int): number of predictions to accumulate for each class (default: 10).
        recovery (int): number of predictions to ignore after a final decision, to avoid classifying twice the same event (default: 5).
    """

    def __init__(self, threshold=2, buffer_size=10, recovery=5):
        self._threshold = threshold
        self._buffer_size = buffer_size
        self._recovery = recovery
        self._buffer = []
        self._ignore = 0

    def update(self):

        # Loop through the model events
        if self.i_model.ready():
            for timestamp, row in self.i_model.data.iterrows():
                # Check if the model is fitted and forward the event
                if row.label == "ready":
                    self.o.data = make_event("ready", False)
                    return
                # Check probabilities
                elif row.label == "predict_proba":
                    # Check the recovery counter
                    if self._ignore > 0:
                        self._ignore -= 1
                        continue
                    # Append to buffer
                    proba = json.loads(row["data"])["result"]
                    self._buffer.append(proba)
                    if len(self._buffer) > self._buffer_size:
                        self._buffer.pop(0)
                    # Sort
                    scores = np.sum(np.array(self._buffer), axis=0)
                    indices = np.flip(np.argsort(scores))
                    if len(indices) < 2:
                        return
                    if (indices[1] * self._threshold) < indices[0]:
                        # Make a final decision and reset the buffer
                        self.o.data = make_event("predict", {"target": int(indices[0])}, False)
                        self.logger.debug(f"Predicted: {indices[0]}")
                        self._buffer = []
                        self._ignore = self._recovery
