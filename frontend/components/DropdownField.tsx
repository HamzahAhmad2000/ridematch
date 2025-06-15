// components/DropdownField.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList } from 'react-native';

interface DropdownFieldProps {
  label: string;
  value: string;
  onSelect: (item: string) => void;
  options: string[];
  error?: string;
}

const DropdownField: React.FC<DropdownFieldProps> = ({ label, value, onSelect, options, error }) => {
  const [modalVisible, setModalVisible] = React.useState(false);

  const handleSelect = (item: string) => {
    onSelect(item);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={[styles.dropdown, error && styles.dropdownError]} onPress={() => setModalVisible(true)}>
        <Text style={value ? styles.text : styles.placeholder}>{value || `Select ${label}`}</Text>
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal visible={modalVisible} transparent>
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <View style={styles.modalContent}>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalItem} onPress={() => handleSelect(item)}>
                  <Text style={styles.modalItemText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
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
  dropdown: {
    height: 48,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#113a78',
    borderRadius: 21.276,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
  },
  dropdownError: {
    borderColor: 'red',
  },
  placeholder: {
    fontSize: 14,
    color: '#aaa',
  },
  text: {
    fontSize: 14,
    color: '#113a78',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    maxHeight: '60%',
  },
  modalItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  modalItemText: {
    fontSize: 16,
    color: '#113a78',
  },
});

export default DropdownField;
