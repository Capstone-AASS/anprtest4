import re
from collections import Counter, deque


class NumberPlatePredictor:
    def __init__(self, history_length=100):
        """
        Initialize the NumberPlatePredictor with an optional history length.

        Parameters:
        history_length (int): Number of most recent OCR results to consider. Default is 100.
        """
        self.history_length = history_length
        self.ocr_stream = deque(maxlen=history_length)
        self.plate_counts = Counter()

    def normalize_plate(self, plate):
        """
        Normalize the number plate text by converting to uppercase,
        removing non-alphanumeric characters, and standardizing format.

        Parameters:
        plate (str): The raw OCR detected text of the number plate.

        Returns:
        str: The normalized number plate text.
        """
        # Convert to uppercase and remove non-alphanumeric characters
        normalized = re.sub(r"[^A-Za-z0-9]", "", plate).upper()
        return normalized

    def update_stream(self, new_plate):
        """
        Update the OCR stream with a new detected plate.

        Parameters:
        new_plate (str): The new OCR detected number plate value.
        """
        normalized_plate = self.normalize_plate(new_plate)
        if normalized_plate:
            self._add_plate_to_stream(normalized_plate)

    def _add_plate_to_stream(self, plate):
        """
        Helper function to add a plate to the stream and update the counter.

        Parameters:
        plate (str): The normalized plate to add to the stream.
        """
        if len(self.ocr_stream) == self.history_length:
            # Remove the oldest plate from the counter
            oldest_plate = self.ocr_stream.popleft()
            self.plate_counts[oldest_plate] -= 1
            if self.plate_counts[oldest_plate] == 0:
                del self.plate_counts[oldest_plate]

        # Add the new plate to the stream
        self.ocr_stream.append(plate)
        self.plate_counts[plate] += 1

    def get_most_likely_plate(self):
        """
        Get the most likely number plate from the current stream.

        Returns:
        str: The most likely number plate value.
        """
        if self.plate_counts:
            most_common_plate, _ = self.plate_counts.most_common(1)[0]
            return most_common_plate
        return f"No valid plates detected {self.plate_counts}"
