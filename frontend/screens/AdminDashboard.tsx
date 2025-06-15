import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { DriverService, DriverApplication } from '../services/driver';

const AdminDashboard: React.FC = () => {
  const navigation = useNavigation();
  const [applications, setApplications] = useState<DriverApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<DriverApplication | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [reviewAction, setReviewAction] = useState<'approved' | 'rejected' | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const pendingApps = await DriverService.getPendingApplications();
      setApplications(pendingApps);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchApplications();
    setRefreshing(false);
  };

  const handleReview = (application: DriverApplication, action: 'approved' | 'rejected') => {
    setSelectedApplication(application);
    setReviewAction(action);
    setAdminNotes('');
    setModalVisible(true);
  };

  const confirmReview = async () => {
    if (!selectedApplication || !reviewAction) return;

    try {
      await DriverService.reviewApplication(selectedApplication.id, reviewAction, adminNotes);
      
      // Remove the reviewed application from the list
      setApplications(apps => apps.filter(app => app.id !== selectedApplication.id));
      
      Alert.alert(
        'Success',
        `Application has been ${reviewAction} successfully.`
      );
      
      setModalVisible(false);
      setSelectedApplication(null);
      setReviewAction(null);
      setAdminNotes('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to review application');
    }
  };

  const renderApplicationItem = ({ item }: { item: DriverApplication }) => (
    <View style={styles.applicationCard}>
      <View style={styles.applicationHeader}>
        <Text style={styles.applicantName}>{item.user_name}</Text>
        <Text style={styles.applicationDate}>
          {new Date(item.submitted_at).toLocaleDateString()}
        </Text>
      </View>
      
      <View style={styles.applicationDetails}>
        <Text style={styles.detailText}>Email: {item.user_email}</Text>
        <Text style={styles.detailText}>License: {item.license_number}</Text>
        <Text style={styles.detailText}>Vehicle: {item.vehicle_make} {item.vehicle_model} ({item.vehicle_year})</Text>
        <Text style={styles.detailText}>License Plate: {item.license_plate}</Text>
        <Text style={styles.detailText}>License Expiry: {new Date(item.license_expiry).toLocaleDateString()}</Text>
      </View>

      <View style={styles.documentsSection}>
        <Text style={styles.documentsTitle}>Documents:</Text>
        <TouchableOpacity style={styles.documentLink}>
          <Text style={styles.documentLinkText}>View License Image</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.documentLink}>
          <Text style={styles.documentLinkText}>View Vehicle Registration</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.approveButton]}
          onPress={() => handleReview(item, 'approved')}
        >
          <Text style={styles.actionButtonText}>Approve</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => handleReview(item, 'rejected')}
        >
          <Text style={styles.actionButtonText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No pending applications</Text>
      <Text style={styles.emptySubtext}>New driver applications will appear here</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <TouchableOpacity onPress={fetchApplications} style={styles.refreshButton}>
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>Pending Applications: {applications.length}</Text>
      </View>

      <FlatList
        data={applications}
        renderItem={renderApplicationItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={renderEmptyList}
      />

      {/* Review Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {reviewAction === 'approved' ? 'Approve' : 'Reject'} Application
            </Text>
            
            {selectedApplication && (
              <View style={styles.modalApplicationInfo}>
                <Text style={styles.modalApplicationText}>
                  Applicant: {selectedApplication.user_name}
                </Text>
                <Text style={styles.modalApplicationText}>
                  License: {selectedApplication.license_number}
                </Text>
              </View>
            )}

            <View style={styles.notesInputContainer}>
              <Text style={styles.notesLabel}>Admin Notes (Optional):</Text>
              <TextInput
                style={styles.notesInput}
                value={adminNotes}
                onChangeText={setAdminNotes}
                placeholder="Add any notes or feedback..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  reviewAction === 'approved' ? styles.approveButton : styles.rejectButton
                ]}
                onPress={confirmReview}
              >
                <Text style={styles.modalButtonText}>
                  {reviewAction === 'approved' ? 'Approve' : 'Reject'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  refreshButton: {
    padding: 8,
  },
  refreshButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  statsContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statsText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  applicationCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  applicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  applicantName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  applicationDate: {
    fontSize: 14,
    color: '#666',
  },
  applicationDetails: {
    marginBottom: 12,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 18,
  },
  documentsSection: {
    marginBottom: 16,
  },
  documentsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  documentLink: {
    paddingVertical: 4,
  },
  documentLinkText: {
    fontSize: 14,
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    margin: 20,
    minWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalApplicationInfo: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  modalApplicationText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  notesInputContainer: {
    marginBottom: 20,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    minHeight: 80,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: '#666',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default AdminDashboard; 