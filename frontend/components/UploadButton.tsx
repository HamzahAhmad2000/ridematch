// components/UploadButton.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';

interface UploadButtonProps {
  onPress: () => void;
}

const UploadButton: React.FC<UploadButtonProps> = ({ onPress }) => {
  return (
    <TouchableOpacity style={styles.uploadButton} onPress={onPress}>
      <ImageBackground
        style={styles.icon}
        source={require('../assets/images/upload.png')} // Replace with your image path
      />
      <Text style={styles.uploadText}>Upload Student Card</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  uploadButton: {
    height: 48,
    paddingHorizontal: 24,
    borderRadius: 21.276,
    backgroundColor: '#1559bf',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    justifyContent: 'center',
  },
  icon: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  uploadText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '400',
    color: '#ffffff',
  },
});

export default UploadButton;
