// components/RatingComponent.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  TouchableWithoutFeedback,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';

interface RatingComponentProps {
  onSubmit: (rating: number, feedback: string) => void;
  onClose: () => void;
}

const RatingComponent: React.FC<RatingComponentProps> = ({ onSubmit, onClose }) => {
  const [rating, setRating] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>('');

  const handleRatingPress = (value: number) => {
    setRating(value);
  };

  const handleSubmit = () => {
    if (rating === 0) {
      return;
    }
    onSubmit(rating, feedback);
  };

  return (
    <Modal
      transparent
      animationType="fade"
      visible={true}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.keyboardAvoidingContainer}
            >
              <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Rate Your Ride</Text>
                  <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                    <Text style={styles.closeButtonText}>×</Text>
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.ratingLabel}>How was your experience?</Text>
                
                <View style={styles.starsContainer}>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <TouchableOpacity
                      key={value}
                      onPress={() => handleRatingPress(value)}
                      style={styles.starButton}
                    >
                      <Image
                        source={require('../assets/images/Yellow Star Icon.png')}
                        style={[
                          styles.starIcon,
                          value > rating && { tintColor: '#ccc' }
                        ]}
                        resizeMode="contain"
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                
                <Text style={styles.feedbackLabel}>Any feedback? (Optional)</Text>
                <TextInput
                  style={styles.feedbackInput}
                  placeholder="Share your thoughts on the ride..."
                  placeholderTextColor="#aaa"
                  multiline
                  value={feedback}
                  onChangeText={setFeedback}
                  maxLength={200}
                />
                
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    rating === 0 && styles.disabledButton
                  ]}
                  onPress={handleSubmit}
                  disabled={rating === 0}
                >
                  <Text style={styles.submitButtonText}>Submit Rating</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.skipButton}
                  onPress={onClose}
                >
                  <Text style={styles.skipButtonText}>Skip</Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardAvoidingContainer: {
    width: '100%',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  modalTitle: {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '600',
    color: '#113a78',
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    padding: 5,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
    fontWeight: '300',
  },
  ratingLabel: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  starButton: {
    padding: 5,
  },
  starIcon: {
    width: 35,
    height: 35,
  },
  feedbackLabel: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#333',
    alignSelf: 'flex-start',
    marginBottom: 5,
  },
  feedbackInput: {
    width: '100%',
    height: 100,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#333',
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  submitButton: {
    width: '100%',
    backgroundColor: '#113a78',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  skipButton: {
    padding: 10,
  },
  skipButtonText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#666',
  },
});

export default RatingComponent;