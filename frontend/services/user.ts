// services/user.ts
import api from './api';

export interface UserProfile {
  user_id: string;
  name: string;
  email: string;
  university: string;
  gender: string;
  gender_preference: string;
  emergency_contact: string;
  likes: string;
  dislikes: string;
}

export interface UpdateProfileResponse {
  message: string;
}

export const UserService = {
  async getProfile(): Promise<UserProfile> {
    try {
      const response = await api.get('/users/profile');
      return response.data;
    } catch (error) {
      const err = error as any;
      console.error('Error fetching user profile:', err.response?.data || err);
      
      // Extract meaningful error message
      const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch profile';
      throw new Error(errorMessage);
    }
  },
  
  async updateProfile(data: Partial<UserProfile>): Promise<UpdateProfileResponse> {
    try {
      const response = await api.put('/users/profile', data);
      return response.data;
    } catch (error) {
      const err = error as any;
      console.error('Error updating profile:', err.response?.data || err);
      
      // Extract meaningful error message
      const errorMessage = err.response?.data?.error || err.message || 'Failed to update profile';
      throw new Error(errorMessage);
    }
  }
};