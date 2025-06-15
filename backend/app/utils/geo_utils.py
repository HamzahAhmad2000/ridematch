# /backend/app/utils/geo_utils.py
from math import radians, sin, cos, sqrt, atan2

class GeoUtils:
    @staticmethod
    def calculate_distance(point1, point2):
        """
        Calculate the distance between two geographic points using the Haversine formula
        
        Args:
            point1: Dict with 'lat' and 'lng' or 'latitude' and 'longitude' keys
            point2: Dict with 'lat' and 'lng' or 'latitude' and 'longitude' keys
            
        Returns:
            Distance in kilometers
        """
        # Earth's radius in kilometers
        R = 6371.0
        
        # Handle different coordinate formats
        lat1 = point1.get('lat') if 'lat' in point1 else point1.get('latitude')
        lon1 = point1.get('lng') if 'lng' in point1 else point1.get('longitude')
        
        lat2 = point2.get('lat') if 'lat' in point2 else point2.get('latitude')
        lon2 = point2.get('lng') if 'lng' in point2 else point2.get('longitude')
        
        # Convert to radians
        lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
        
        # Haversine formula
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * atan2(sqrt(a), sqrt(1-a))
        distance = R * c
        
        return round(distance, 2)
    
    @staticmethod
    def get_sector_from_coordinates(coordinates):
        """
        Determine the sector (e.g., 'G8') from geographic coordinates
        
        Args:
            coordinates: Dict with 'lat' and 'lng' or 'latitude' and 'longitude' keys
            
        Returns:
            Sector code as a string
        """
        # Comprehensive mapping of Islamabad sectors by their approximate boundaries
        # These boundaries are approximated for the purpose of the application
        sectors = {
            # G Sectors
            'G6': {'min_lat': 33.7126, 'max_lat': 33.7270, 'min_lng': 73.0674, 'max_lng': 73.0861},
            'G7': {'min_lat': 33.7001, 'max_lat': 33.7156, 'min_lng': 73.0674, 'max_lng': 73.0861},
            'G8': {'min_lat': 33.6877, 'max_lat': 33.7032, 'min_lng': 73.0674, 'max_lng': 73.0861},
            'G9': {'min_lat': 33.6752, 'max_lat': 33.6907, 'min_lng': 73.0674, 'max_lng': 73.0861},
            'G10': {'min_lat': 33.6628, 'max_lat': 33.6783, 'min_lng': 73.0674, 'max_lng': 73.0861},
            'G11': {'min_lat': 33.6503, 'max_lat': 33.6658, 'min_lng': 73.0674, 'max_lng': 73.0861},
            'G13': {'min_lat': 33.6254, 'max_lat': 33.6409, 'min_lng': 73.0674, 'max_lng': 73.0861},
            
            # F Sectors
            'F6': {'min_lat': 33.7126, 'max_lat': 33.7270, 'min_lng': 73.0488, 'max_lng': 73.0674},
            'F7': {'min_lat': 33.7001, 'max_lat': 33.7156, 'min_lng': 73.0488, 'max_lng': 73.0674},
            'F8': {'min_lat': 33.6877, 'max_lat': 33.7032, 'min_lng': 73.0488, 'max_lng': 73.0674},
            'F9': {'min_lat': 33.6752, 'max_lat': 33.6907, 'min_lng': 73.0488, 'max_lng': 73.0674},
            'F10': {'min_lat': 33.6628, 'max_lat': 33.6783, 'min_lng': 73.0488, 'max_lng': 73.0674},
            'F11': {'min_lat': 33.6503, 'max_lat': 33.6658, 'min_lng': 73.0488, 'max_lng': 73.0674},
            
            # I Sectors
            'I8': {'min_lat': 33.6877, 'max_lat': 33.7032, 'min_lng': 73.0861, 'max_lng': 73.1047},
            'I9': {'min_lat': 33.6752, 'max_lat': 33.6907, 'min_lng': 73.0861, 'max_lng': 73.1047},
            'I10': {'min_lat': 33.6628, 'max_lat': 33.6783, 'min_lng': 73.0861, 'max_lng': 73.1047},
            'I11': {'min_lat': 33.6503, 'max_lat': 33.6658, 'min_lng': 73.0861, 'max_lng': 73.1047},
            
            # E Sectors
            'E7': {'min_lat': 33.7001, 'max_lat': 33.7156, 'min_lng': 73.0301, 'max_lng': 73.0488},
            'E8': {'min_lat': 33.6877, 'max_lat': 33.7032, 'min_lng': 73.0301, 'max_lng': 73.0488},
            'E9': {'min_lat': 33.6752, 'max_lat': 33.6907, 'min_lng': 73.0301, 'max_lng': 73.0488},
            'E11': {'min_lat': 33.6503, 'max_lat': 33.6658, 'min_lng': 73.0301, 'max_lng': 73.0488},
            
            # H Sectors
            'H8': {'min_lat': 33.6877, 'max_lat': 33.7032, 'min_lng': 73.0114, 'max_lng': 73.0301},
            'H9': {'min_lat': 33.6752, 'max_lat': 33.6907, 'min_lng': 73.0114, 'max_lng': 73.0301},
            'H10': {'min_lat': 33.6628, 'max_lat': 33.6783, 'min_lng': 73.0114, 'max_lng': 73.0301},
            'H11': {'min_lat': 33.6503, 'max_lat': 33.6658, 'min_lng': 73.0114, 'max_lng': 73.0301},
            
            # Blue Area & Other key locations
            'Blue Area': {'min_lat': 33.7126, 'max_lat': 33.7270, 'min_lng': 73.0301, 'max_lng': 73.0488}
        }
        
        lat = coordinates.get('lat') if 'lat' in coordinates else coordinates.get('latitude')
        lng = coordinates.get('lng') if 'lng' in coordinates else coordinates.get('longitude')
        
        # Check which sector the coordinates fall into
        for sector_code, bounds in sectors.items():
            if (bounds['min_lat'] <= lat <= bounds['max_lat'] and 
                bounds['min_lng'] <= lng <= bounds['max_lng']):
                return sector_code
        
        # Default sector if no match
        return 'unknown'