import pandas as pd
import neurokit2 as nk
from timeflux.core.node import Node

class HRVTimeDomainCalculator(Node):
    def __init__(self):
        super().__init__()
        self.last_peak_time = None
        self.rr_intervals = []

    def update(self):
        if self.i.ready():
            for time, row in self.i.data.iterrows():
                if self.last_peak_time is not None:
                    rr_interval = (time - self.last_peak_time).total_seconds() * 100  # Convert to milliseconds
                    self.rr_intervals.append(rr_interval)
                self.last_peak_time = time

            if len(self.rr_intervals) > 1:
                # Convert RR intervals to peak indices
                peak_indices = nk.intervals_to_peaks(self.rr_intervals, sampling_rate=25)

                # Calculate time-domain HRV metrics
                hrv_metrics_time = nk.hrv_time(peak_indices, sampling_rate=25, show=False)

                # Create a DataFrame with the timestamp as the index
                output_df = pd.DataFrame(hrv_metrics_time)
                
                # If you want to use the last peak time as the index for the entire DataFrame
                if self.last_peak_time is not None:
                    output_df.index = [self.last_peak_time]

                # Ensure the index is in UTC datetime format
                # If 'self.last_peak_time' is already a datetime, you might need to convert it to UTC
                # output_df.index = pd.to_datetime(output_df.index).tz_convert('UTC')
                
                # Properly format the output DataFrame
                self.o.data = output_df
