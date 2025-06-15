// services/report.ts
import api from './api';

export interface ReportSubmission {
  category: string;
  description: string;
  anonymous: boolean;
  evidenceUrl: string | null;
  rideId?: string;
}

export interface ReportResponse {
  success: boolean;
  message: string;
  reportId?: string;
}

export const ReportService = {
  async submitReport(data: ReportSubmission): Promise<ReportResponse> {
    try {
      const response = await api.post('/safety/report', data);
      return response.data;
    } catch (error) {
      console.error('Error submitting report:', error);
      throw error;
    }
  },
  
  async uploadEvidence(imageUri: string): Promise<string> {
    try {
      // Create a FormData object to send the image
      const formData = new FormData();
      
      // Extract the filename and type from the URI
      const uriParts = imageUri.split('.');
      const fileType = uriParts[uriParts.length - 1];
      
      // Append the image to the FormData object
      formData.append('evidence', {
        uri: imageUri,
        name: `photo.${fileType}`,
        type: `image/${fileType}`
      } as any);
      
      // Create custom headers for FormData
      const headers = {
        'Content-Type': 'multipart/form-data',
      };
      
      // Send the request to the server
      const response = await api.post('/safety/upload-evidence', formData, { headers });
      
      // Return the URL of the uploaded image
      return response.data.url;
    } catch (error) {
      console.error('Error uploading evidence:', error);
      throw error;
    }
  }
};