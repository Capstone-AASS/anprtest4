import re
from collections import Counter, deque
from difflib import get_close_matches


class NumberPlatePredictor:
    def __init__(self, valid_plates=None, history_length=100):
        """
        Initialize the NumberPlatePredictor with an optional history length and valid plates database.

        Parameters:
        valid_plates (set): A set of valid number plates to validate against. Default is None.
        history_length (int): Number of most recent OCR results to consider. Default is 100.
        """
        self.history_length = history_length
        self.ocr_stream = deque(maxlen=history_length)
        self.plate_counts = Counter()
        self.valid_plates = valid_plates if valid_plates else set()

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

    def validate_plate(self, plate):
        """
        Validate the normalized plate against the database.

        Parameters:
        plate (str): The normalized number plate text.

        Returns:
        str: The valid plate from the database if found, otherwise None.
        """
        if plate in self.valid_plates:
            return plate

        # If exact match is not found, use get_close_matches to suggest a correction
        closest_matches = get_close_matches(plate, self.valid_plates, n=1, cutoff=0.8)
        return closest_matches[0] if closest_matches else None

    def update_stream(self, new_plate):
        """
        Update the OCR stream with a new detected plate.

        Parameters:
        new_plate (str): The new OCR detected number plate value.
        """
        normalized_plate = self.normalize_plate(new_plate)
        if normalized_plate:
            validated_plate = self.validate_plate(normalized_plate)
            if validated_plate:
                # Update the deque with the validated plate
                if len(self.ocr_stream) == self.history_length:
                    # Remove the oldest plate from the counter
                    oldest_plate = self.ocr_stream.popleft()
                    self.plate_counts[oldest_plate] -= 1
                    if self.plate_counts[oldest_plate] == 0:
                        del self.plate_counts[oldest_plate]

                # Add the new validated plate to the stream
                self.ocr_stream.append(validated_plate)
                self.plate_counts[validated_plate] += 1

    def get_most_likely_plate(self):
        """
        Get the most likely number plate from the current stream.

        Returns:
        str: The most likely number plate value.
        """
        print(self.plate_counts)
        if self.plate_counts:
            most_common_plate, _ = self.plate_counts.most_common(1)[0]
            return most_common_plate
        return "No valid plates detected."
