// components/EnhancedTimePicker.tsx - Fixed TypeScript errors
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
// Use the cross-platform date time picker if available, otherwise fallback
let DateTimePicker: any;
try {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
} catch (e) {
  console.warn("DateTimePicker native module not found. Using fallback.");
  // Define a simple fallback component if needed, or handle it within the component logic
  DateTimePicker = ({ onChange }: any) => {
    // Minimal fallback for web or if native module fails
    const handleWebChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newDate = new Date();
        if (event.target.type === 'time') {
            const [hours, minutes] = event.target.value.split(':');
            newDate.setHours(parseInt(hours), parseInt(minutes));
        }
        // Pass a mock event structure similar to the native one if possible
        onChange({ type: 'set', nativeEvent: { timestamp: newDate.getTime() } }, newDate);
    };
    return (
        <input type="time" onChange={handleWebChange} style={styles.webInputFallback}/>
    );
  };
}
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// Define interface for time options
interface TimeOption {
  label: string;
  value: Date;
}

interface EnhancedTimePickerProps {
  isVisible: boolean;
  onClose: () => void;
  onTimeSelect: (time: Date) => void;
  initialTime?: Date;
  minimumTime?: Date;
}


const EnhancedTimePicker: React.FC<EnhancedTimePickerProps> = ({
  isVisible,
  onClose,
  onTimeSelect,
  initialTime,
  minimumTime,
}) => {
  // Set default minimumTime to 1 hour from now if not provided
  const defaultMinimumTime = new Date();
  defaultMinimumTime.setHours(defaultMinimumTime.getHours() + 1);

  const [selectedTime, setSelectedTime] = useState<Date>(
    initialTime || new Date(Math.max(
      defaultMinimumTime.getTime(),
      minimumTime ? minimumTime.getTime() : 0
    ))
  );

  const [showIOSPicker, setShowIOSPicker] = useState(false); // State for iOS picker visibility
  const [showAndroidTimePicker, setShowAndroidTimePicker] = useState(false); // State for Android time picker
  const [showAndroidDatePicker, setShowAndroidDatePicker] = useState(false); // State for Android date picker

  const [activeTab, setActiveTab] = useState<'today' | 'tomorrow' | 'custom'>('today');

  // Quick time options (relative to now) - Explicitly typed return value and array
  const getQuickTimeOptions = (): TimeOption[] => {
    const now = new Date();
    const options: TimeOption[] = []; // Explicitly type the array

    // Start with current hour + 1 hour (minimum time)
    let startHour = now.getHours() + 1;

    // For today's options
    if (activeTab === 'today') {
      // Add options for every hour until midnight
      for (let hour = startHour; hour < 24; hour++) {
        const time = new Date();
        time.setHours(hour, 0, 0, 0); // Set to the beginning of the hour

        // Skip if time is earlier than minimum time
        if (minimumTime && time < minimumTime) continue;

        options.push({ // No TypeScript error here now
          label: formatTimeOption(time),
          value: time,
        });

        // Add half-hour option
        const halfHourTime = new Date(time);
        halfHourTime.setMinutes(30);

        // Skip if time is earlier than minimum time
        if (minimumTime && halfHourTime < minimumTime) continue;

        options.push({ // No TypeScript error here now
          label: formatTimeOption(halfHourTime),
          value: halfHourTime,
        });
      }
    }
    // For tomorrow's options
    else if (activeTab === 'tomorrow') {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Add options for every hour from 6 AM to midnight
      for (let hour = 6; hour < 24; hour++) {
        const time = new Date(tomorrow);
        time.setHours(hour, 0, 0, 0);

        options.push({ // No TypeScript error here now
          label: formatTimeOption(time),
          value: time,
        });

        // Add half-hour option
        const halfHourTime = new Date(time);
        halfHourTime.setMinutes(30);

        options.push({ // No TypeScript error here now
          label: formatTimeOption(halfHourTime),
          value: halfHourTime,
        });
      }
    }

    return options;
  };

  // Format time for display in quick options
  const formatTimeOption = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Format date for display in header
  const formatDateForHeader = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Format as "Today" or "Tomorrow" or the full date
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'short', // Use short weekday
        month: 'short', // Use short month
        day: 'numeric',
      });
    }
  };

  // Format time for display in header
  const formatTimeForHeader = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Determine active tab based on selected date
  useEffect(() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (selectedTime.toDateString() === today.toDateString()) {
      setActiveTab('today');
    } else if (selectedTime.toDateString() === tomorrow.toDateString()) {
      setActiveTab('tomorrow');
    } else {
      setActiveTab('custom');
    }
  }, [selectedTime]);

  // Handle iOS date picker change
  const handleIOSChange = (event: any, selectedDate?: Date) => {
      // Keep the picker visible for date selection if mode is 'datetime'
      if (event.type === 'dismissed') {
          setShowIOSPicker(false);
          return;
      }
      if (selectedDate) {
          // Ensure the selected time is not before the minimum time
          if (minimumTime && selectedDate < minimumTime) {
              setSelectedTime(new Date(minimumTime));
          } else {
              setSelectedTime(new Date(selectedDate));
          }
      }
  };


  // Handle Android date picker change
    const handleAndroidChange = (event: any, selectedDate?: Date) => {
        // Close the specific picker that triggered the event
        if (event.type === 'set') {
            if (showAndroidDatePicker) setShowAndroidDatePicker(false);
            if (showAndroidTimePicker) setShowAndroidTimePicker(false);

            if (selectedDate) {
                // Ensure the selected time is not before the minimum time
                if (minimumTime && selectedDate < minimumTime) {
                    setSelectedTime(new Date(minimumTime));
                } else {
                    setSelectedTime(new Date(selectedDate));
                }
            }
        } else { // Dismissed
             if (showAndroidDatePicker) setShowAndroidDatePicker(false);
             if (showAndroidTimePicker) setShowAndroidTimePicker(false);
        }
    };

  // Handle selection of a quick time option
  const handleQuickTimeSelect = (time: Date) => {
    setSelectedTime(new Date(time));
  };

  // Set tab and update date accordingly
  const handleTabChange = (tab: 'today' | 'tomorrow' | 'custom') => {
    setActiveTab(tab);

    const now = new Date(); // Use a single 'now' reference for consistency
    if (tab === 'today') {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // Preserve current time but set date to today
      const newDate = new Date(selectedTime);
      newDate.setFullYear(today.getFullYear(), today.getMonth(), today.getDate());

      // If the new time would be earlier than minimum time, adjust to minimum time
      if (minimumTime && newDate < minimumTime) {
        setSelectedTime(new Date(minimumTime));
      } else {
        setSelectedTime(newDate);
      }
    } else if (tab === 'tomorrow') {
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0); // Start of tomorrow

      // Preserve current time but set date to tomorrow
      const newDate = new Date(selectedTime);
      newDate.setFullYear(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());

      // If the new time would be earlier than minimum time (which is unlikely for tomorrow), adjust
      if (minimumTime && newDate < minimumTime) {
         setSelectedTime(new Date(minimumTime));
      } else {
        setSelectedTime(newDate);
      }
    } else {
      // For custom, open the native date picker
      if (Platform.OS === 'ios') {
        setShowIOSPicker(true); // Show iOS combined picker
      } else if (Platform.OS === 'android') {
        setShowAndroidDatePicker(true); // Start with date picker on Android
      }
    }
  };

  // Handle confirmation of selected time
  const handleConfirm = () => {
    // Ensure final selected time is not before minimum time
    if (minimumTime && selectedTime < minimumTime) {
        onTimeSelect(new Date(minimumTime));
    } else {
        onTimeSelect(selectedTime);
    }
    onClose();
  };

  // Get expected travel time (for display purposes)
  const getEstimatedTimeToLeave = () => {
    // This would typically come from a calculated route
    // Using dummy calculations for demonstration
    const estimatedTravelTime = 25; // minutes

    const departureTime = new Date(selectedTime);
    departureTime.setMinutes(departureTime.getMinutes() - estimatedTravelTime);

    return departureTime;
  };

  // Convert date to time string
  const formatTimeString = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#113a78" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Arrival Time</Text>
          <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
            <Text style={styles.confirmButtonText}>Confirm</Text>
          </TouchableOpacity>
        </View>

        {/* Selected Time Display */}
        <View style={styles.selectedTimeContainer}>
          <Text style={styles.selectedDateText}>
            {formatDateForHeader(selectedTime)}
          </Text>
          <Text style={styles.selectedTimeText}>
            {formatTimeForHeader(selectedTime)}
          </Text>

          {/* Estimated departure time */}
          <View style={styles.estimatedTimeContainer}>
            <Text style={styles.estimatedTimeLabel}>Estimated time to leave:</Text>
            <Text style={styles.estimatedTimeValue}>
              {formatTimeString(getEstimatedTimeToLeave())}
            </Text>
          </View>
        </View>

        {/* Date Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'today' && styles.activeTab]}
            onPress={() => handleTabChange('today')}
          >
            <Text style={[styles.tabText, activeTab === 'today' && styles.activeTabText]}>
              Today
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'tomorrow' && styles.activeTab]}
            onPress={() => handleTabChange('tomorrow')}
          >
            <Text style={[styles.tabText, activeTab === 'tomorrow' && styles.activeTabText]}>
              Tomorrow
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'custom' && styles.activeTab]}
            onPress={() => handleTabChange('custom')}
          >
            <Text style={[styles.tabText, activeTab === 'custom' && styles.activeTabText]}>
              Custom
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Time Options */}
        {(activeTab === 'today' || activeTab === 'tomorrow') && (
          <ScrollView style={styles.quickOptionsContainer}>
            {getQuickTimeOptions().map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.quickTimeOption,
                  selectedTime.getTime() === option.value.getTime() && styles.selectedQuickTimeOption,
                ]}
                onPress={() => handleQuickTimeSelect(option.value)}
                // Disable options before minimum time
                disabled={minimumTime && option.value < minimumTime}
              >
                <Text style={[
                  styles.quickTimeText,
                  selectedTime.getTime() === option.value.getTime() && styles.selectedQuickTimeText,
                  (minimumTime && option.value < minimumTime) && styles.disabledQuickTimeText // Style disabled options
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Native Date/Time Picker */}
        {/* Android Date Picker */}
        {Platform.OS === 'android' && showAndroidDatePicker && (
             DateTimePicker && <DateTimePicker
                value={selectedTime}
                mode="date"
                display="default"
                onChange={(event, date) => {
                    handleAndroidChange(event, date);
                    // If date is set, show time picker next
                    if (event.type === 'set' && date) {
                         setShowAndroidTimePicker(true);
                    }
                }}
                minimumDate={minimumTime} // Apply minimum date constraint
            />
        )}

         {/* Android Time Picker */}
        {Platform.OS === 'android' && showAndroidTimePicker && (
            DateTimePicker && <DateTimePicker
                value={selectedTime}
                mode="time"
                is24Hour={false}
                display="default"
                onChange={handleAndroidChange}
                minimumDate={minimumTime} // Apply minimum time constraint
            />
        )}

         {/* iOS Combined Picker */}
        {Platform.OS === 'ios' && showIOSPicker && (
             <View style={styles.iosPickerContainer}>
                {DateTimePicker && <DateTimePicker
                    value={selectedTime}
                    mode="datetime" // Use datetime mode for combined picker
                    is24Hour={false}
                    display="spinner" // Or "compact", "inline"
                    onChange={handleIOSChange}
                    minimumDate={minimumTime}
                /> }
            </View>
        )}

         {/* Button to open custom picker if needed (mainly for iOS when not initially shown) */}
        {activeTab === 'custom' && Platform.OS === 'ios' && !showIOSPicker && (
          <TouchableOpacity
            style={styles.customTimeButton}
            onPress={() => setShowIOSPicker(true)}
          >
            <Text style={styles.customTimeButtonText}>
              Select Custom Date & Time
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 12 : 16, // Adjust padding for platform
    paddingTop: Platform.OS === 'ios' ? 40 : 16, // Safe area for iOS
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#113a78',
  },
  confirmButton: {
    padding: 8,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#113a78',
  },
  selectedTimeContainer: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedDateText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#666',
    marginBottom: 5,
  },
  selectedTimeText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#113a78',
    marginBottom: 15,
  },
  estimatedTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f0f6ff',
    borderRadius: 8,
  },
  estimatedTimeLabel: {
    fontSize: 14,
    color: '#5a87c9',
    marginRight: 5,
  },
  estimatedTimeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#113a78',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#113a78',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    fontWeight: '600',
    color: '#113a78',
  },
  quickOptionsContainer: {
    flex: 1,
    padding: 15,
  },
  quickTimeOption: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedQuickTimeOption: {
    backgroundColor: '#e6effc',
  },
  quickTimeText: {
    fontSize: 16,
    color: '#333',
  },
  selectedQuickTimeText: {
    fontWeight: '600',
    color: '#113a78',
  },
  disabledQuickTimeText: {
      color: '#aaa', // Gray out disabled options
  },
  iosPickerContainer: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff', // Ensure background for picker
  },
  customTimeButton: {
    margin: 20,
    padding: 15,
    backgroundColor: '#e6effc',
    borderRadius: 8,
    alignItems: 'center',
  },
  customTimeButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#113a78',
  },
   webInputFallback: { // Basic style for web fallback input
    padding: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    margin: 10,
  }
});

export default EnhancedTimePicker;