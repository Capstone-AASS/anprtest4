import datetime
import difflib  # To calculate similarity using sequence matching

class NumberPlatePredictor:
    def __init__(self, existing_plates=None):
        # Initialize with an empty history and existing valid number plates
        self.history = {}
        """ 
        key: number plate id
        value: dict {
            number_plate: str
            similarity: float
            last_time_stamp: datetime
        }
        """
        self.existing_plates = existing_plates if existing_plates else []

    def _calculate_similarity(self, plate1, plate2):
        """Calculates the similarity between two number plates using sequence matching."""
        return difflib.SequenceMatcher(None, plate1, plate2).ratio()

    def add_existing_plate(self, plates:list[str]):
        """Adds a valid plates to the list of existing plates."""
        for plate in plates:
            self.existing_plates.append(plate.upper())
    
    # todo:Imporve this function
    def is_plate_text_valid(self,plate_text):
        """Checks if the given plate text is valid."""
        return plate_text.isalnum() and len(plate_text) >=7
    
    def get_similar_plate(self, plate_text):
        """Returns the most similar plate from existing plates."""
        highest_similarity = 0.0
        most_similar_plate = None

        for existing_plate in self.existing_plates:
            similarity = self._calculate_similarity(plate_text, existing_plate)
            if similarity > highest_similarity:
                highest_similarity = similarity
                most_similar_plate = existing_plate

        return most_similar_plate, highest_similarity

    def update_history(self, plate_id, plate_text) ->str:
        """Updates the history dictionary with a new plate and its most similar existing plate."""
        if not plate_text:
            return "" 
        plate_text = plate_text.upper()
        if not self.is_plate_text_valid(plate_text):
            return ""

        if plate_id in self.history and self.history[plate_id]["similarity"]>0.95:
            return self.history[plate_id]["number_plate"]
        
        # Find the most similar plate from existing plates
        most_similar_plate = None
        highest_similarity = 0.0

        most_similar_plate, highest_similarity = self.get_similar_plate(plate_text)

        if plate_id in self.history and self.history[plate_id]["similarity"] >highest_similarity:
            return self.history[plate_id]["number_plate"]
            
        
        # Update the history with the most similar plate and current timestamp
        if most_similar_plate and highest_similarity > 0.75:
            self.history[plate_id] = {
                'number_plate': most_similar_plate,
                'similarity': highest_similarity,
                'last_time_stamp': datetime.datetime.now()
            }
            return most_similar_plate
        else:
            return plate_text

    def get_history(self):
        """Returns the history dictionary."""
        return self.history

    
