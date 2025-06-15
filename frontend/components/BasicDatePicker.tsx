// components/BasicDatePicker.tsx
import React, { useState, useEffect } from 'react';
import { 
  TouchableOpacity, 
  Text, 
  View,
  Modal,
  StyleSheet,
  ScrollView
} from 'react-native';

// Define props interface
interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  error?: string;
  label: string;
}

// Use regular function declaration instead of FC type
const BasicDatePicker = ({ 
  value, 
  onChange, 
  error, 
  label 
}: DatePickerProps) => {
  const [showModal, setShowModal] = useState(false);
  
  // Selected date parts for the picker
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState(1);
  const [selectedYear, setSelectedYear] = useState(2000);
  
  // Generate arrays for days, months, and years
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];
  
  // Generate years from current year - 100 to current year - 18
  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: 83 }, 
    (_, i) => currentYear - 18 - i
  );
  
  // Initialize selected values when component mounts or when value changes
  useEffect(() => {
    if (value) {
      const [year, month, day] = value.split('-').map(Number);
      setSelectedYear(year);
      setSelectedMonth(month);
      setSelectedDay(day);
    } else {
      // Default to 18 years ago
      const date = new Date();
      date.setFullYear(date.getFullYear() - 18);
      setSelectedYear(date.getFullYear());
      setSelectedMonth(date.getMonth() + 1);
      setSelectedDay(date.getDate());
    }
  }, [value]);
  
  const formatDate = () => {
    // Ensure correct number of days for month
    let maxDays = 31;
    if ([4, 6, 9, 11].includes(selectedMonth)) {
      maxDays = 30;
    } else if (selectedMonth === 2) {
      // Check for leap year
      maxDays = ((selectedYear % 4 === 0 && selectedYear % 100 !== 0) || selectedYear % 400 === 0) ? 29 : 28;
    }
    
    // Adjust day if necessary
    const finalDay = Math.min(selectedDay, maxDays);
    
    // Format as YYYY-MM-DD string
    return `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(finalDay).padStart(2, '0')}`;
  };
  
  const confirmDate = () => {
    onChange(formatDate());
    setShowModal(false);
  };
  
  const getDisplayDate = () => {
    if (!value) return 'Select your date of birth';
    
    const [year, month, day] = value.split('-');
    const monthName = months.find(m => m.value === parseInt(month))?.label;
    return `${monthName} ${parseInt(day)}, ${year}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity 
        style={[styles.dateButton, error ? styles.inputError : null]} 
        onPress={() => setShowModal(true)}
      >
        <Text>{getDisplayDate()}</Text>
      </TouchableOpacity>
      
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      
      <Modal
        visible={showModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Your Date of Birth</Text>
            
            <View style={styles.pickerContainer}>
              {/* Month Picker */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Month</Text>
                <ScrollView 
                  style={styles.pickerScroll}
                  showsVerticalScrollIndicator={false}
                >
                  {months.map((month) => (
                    <TouchableOpacity
                      key={month.value}
                      style={[
                        styles.pickerItem,
                        selectedMonth === month.value && styles.selectedItem
                      ]}
                      onPress={() => setSelectedMonth(month.value)}
                    >
                      <Text 
                        style={[
                          styles.pickerItemText,
                          selectedMonth === month.value && styles.selectedItemText
                        ]}
                      >
                        {month.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              {/* Day Picker */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Day</Text>
                <ScrollView 
                  style={styles.pickerScroll}
                  showsVerticalScrollIndicator={false}
                >
                  {days.map((day) => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.pickerItem,
                        selectedDay === day && styles.selectedItem
                      ]}
                      onPress={() => setSelectedDay(day)}
                    >
                      <Text 
                        style={[
                          styles.pickerItemText,
                          selectedDay === day && styles.selectedItemText
                        ]}
                      >
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              {/* Year Picker */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Year</Text>
                <ScrollView 
                  style={styles.pickerScroll}
                  showsVerticalScrollIndicator={false}
                >
                  {years.map((year) => (
                    <TouchableOpacity
                      key={year}
                      style={[
                        styles.pickerItem,
                        selectedYear === year && styles.selectedItem
                      ]}
                      onPress={() => setSelectedYear(year)}
                    >
                      <Text 
                        style={[
                          styles.pickerItemText,
                          selectedYear === year && styles.selectedItemText
                        ]}
                      >
                        {year}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
            
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.confirmButton} 
                onPress={confirmDate}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    color: '#113a78',
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 12,
    backgroundColor: '#f9f9f9',
  },
  inputError: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#113a78',
  },
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    height: 200,
    marginBottom: 20,
  },
  pickerColumn: {
    flex: 1,
    marginHorizontal: 5,
  },
  pickerLabel: {
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#113a78',
  },
  pickerScroll: {
    height: 160,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 5,
  },
  pickerItem: {
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedItem: {
    backgroundColor: '#e6f0ff',
  },
  pickerItemText: {
    fontSize: 16,
  },
  selectedItemText: {
    fontWeight: 'bold',
    color: '#113a78',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    padding: 15,
    marginRight: 5,
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    borderRadius: 5,
  },
  confirmButton: {
    flex: 1,
    padding: 15,
    marginLeft: 5,
    alignItems: 'center',
    backgroundColor: '#113a78',
    borderRadius: 5,
  },
  cancelButtonText: {
    color: '#113a78',
    fontWeight: 'bold',
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: 'bold',
  }
});

export default BasicDatePicker;