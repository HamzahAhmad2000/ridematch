import api from './api';

export interface DriverApplicationForm {
  license_number: string;
  license_expiry: string; // YYYY-MM-DD
  license_image_url: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: number;
  license_plate: string;
  vehicle_reg_url: string;
}

export interface DriverApplicationStatus {
  status: 'not_submitted' | 'pending' | 'approved' | 'rejected';
  submitted_at?: string;
  reviewed_at?: string;
  admin_notes?: string;
}

export interface DriverApplication {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  license_number: string;
  license_expiry: string;
  license_image_url: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: number;
  license_plate: string;
  vehicle_reg_url: string;
  status: string;
  submitted_at: string;
}

export const DriverService = {
  async submitApplication(data: DriverApplicationForm): Promise<{ message: string; application_id: string }> {
    try {
      const response = await api.post('/drivers/apply', data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to submit driver application');
    }
  },
  
  async getApplicationStatus(): Promise<DriverApplicationStatus> {
    try {
      const response = await api.get('/drivers/status');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to get application status');
    }
  },

  // Admin functions
  async getPendingApplications(): Promise<DriverApplication[]> {
    try {
      const response = await api.get('/drivers/applications');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to get pending applications');
    }
  },

  async reviewApplication(applicationId: string, status: 'approved' | 'rejected', adminNotes: string = ''): Promise<{ message: string }> {
    try {
      const response = await api.put(`/drivers/applications/${applicationId}`, {
        status,
        admin_notes: adminNotes
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to review application');
    }
  }
}; 