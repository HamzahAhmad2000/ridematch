// components/InputField.tsx
import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';

interface InputFieldProps extends TextInputProps {
  label: string;
  error?: string;
}

const InputField: React.FC<InputFieldProps> = ({ label, error, ...inputProps }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput 
        style={[styles.input, error && styles.inputError]} 
        {...inputProps} 
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 20,
  },
  label: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#113a78',
    marginBottom: 5,
  },
  input: {
    height: 48,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#113a78',
    borderRadius: 21.276,
    backgroundColor: '#ffffff',
    fontSize: 14,
    color: '#113a78',
  },
  inputError: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 5,
  },
});

export default InputField;
