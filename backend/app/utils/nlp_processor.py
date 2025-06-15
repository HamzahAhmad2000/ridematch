# /backend/app/utils/nlp_processor.py
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from string import punctuation

class NLPProcessor:
    # Common hobbies to help with matching even when exact words aren't used
    HOBBY_CATEGORIES = {
        'sports': ['football', 'soccer', 'basketball', 'tennis', 'cricket', 'baseball', 'volleyball', 
                  'badminton', 'swimming', 'running', 'cycling', 'gym', 'fitness', 'workout', 
                  'exercise', 'yoga', 'jogging', 'athletics', 'sports'],
        'music': ['music', 'singing', 'guitar', 'piano', 'drums', 'violin', 'flute', 'saxophone', 
                 'concert', 'band', 'orchestra', 'choir', 'composer', 'song', 'instrument'],
        'arts': ['painting', 'drawing', 'sketching', 'art', 'craft', 'sculpture', 'pottery', 
               'photography', 'design', 'creative', 'artist', 'artistic', 'canvas'],
        'reading': ['reading', 'books', 'literature', 'novel', 'fiction', 'nonfiction', 'poetry', 
                   'comic', 'manga', 'library', 'bookstore', 'author', 'writer'],
        'technology': ['programming', 'coding', 'software', 'computer', 'technology', 'tech', 'developer', 
                      'engineering', 'hardware', 'app', 'application', 'website', 'internet', 'digital'],
        'cooking': ['cooking', 'baking', 'food', 'recipe', 'chef', 'cuisine', 'kitchen', 'culinary', 
                   'barbecue', 'grill', 'restaurant', 'meal', 'dinner'],
        'outdoor': ['hiking', 'camping', 'trekking', 'fishing', 'hunting', 'climbing', 'mountaineering', 
                   'biking', 'adventure', 'nature', 'outdoor', 'wilderness', 'backpacking'],
        'gaming': ['gaming', 'videogame', 'game', 'playstation', 'xbox', 'nintendo', 'pc', 'console', 
                  'esport', 'multiplayer', 'mmorpg', 'rpg', 'fps'],
        'movies': ['movie', 'film', 'cinema', 'theater', 'actor', 'actress', 'director', 'hollywood', 
                  'bollywood', 'series', 'television', 'tv', 'netflix', 'streaming'],
        'travel': ['travel', 'tourism', 'touring', 'backpacking', 'vacation', 'trip', 'journey', 
                  'adventure', 'sightseeing', 'exploration', 'wanderlust', 'tourist']
    }
    
    @staticmethod
    def extract_keywords(text):
        """
        Extract meaningful keywords from user's hobby/interest descriptions
        and categorize them for better matching
        """
        # Download necessary NLTK resources if not already downloaded
        try:
            nltk.data.find('tokenizers/punkt')
        except LookupError:
            nltk.download('punkt', quiet=True)
        
        try:
            nltk.data.find('corpora/stopwords')
        except LookupError:
            nltk.download('stopwords', quiet=True)
        
        if not text or not isinstance(text, str):
            return []
            
        # Process text
        stop_words = set(stopwords.words('english'))
        
        # Clean and tokenize
        text = text.lower()
        # Remove punctuation
        for p in punctuation:
            text = text.replace(p, ' ')
        
        tokens = word_tokenize(text)
        
        # Filter tokens
        keywords = [token for token in tokens 
                   if token.isalpha() and 
                   token not in stop_words and 
                   len(token) > 2]
        
        # Add category labels for better matching
        enhanced_keywords = keywords.copy()
        
        # Find hobby categories that match any of the keywords
        for category, related_terms in NLPProcessor.HOBBY_CATEGORIES.items():
            if any(keyword in related_terms for keyword in keywords):
                enhanced_keywords.append(category)
        
        # Remove duplicates while preserving order
        unique_keywords = list(dict.fromkeys(enhanced_keywords))
        
        return unique_keywords

    @staticmethod
    def categorize_keywords(keywords):
        """Return a list of hobby categories that match the given keywords"""
        categories = []
        for category, related_terms in NLPProcessor.HOBBY_CATEGORIES.items():
            if any(keyword in related_terms for keyword in keywords):
                categories.append(category)

        # Remove duplicates while preserving order
        return list(dict.fromkeys(categories))
