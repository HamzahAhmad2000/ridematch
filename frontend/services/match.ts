// services/match.ts
import api from './api';

export interface Companion {
  user_id: string;
  name: string;
  university: string;
  gender: string;
  similarity_score: number;
  common_interests: string[];
}

export interface ProcessHobbiesResponse {
  message: string;
  keywords: string[];
}

export const MatchService = {
  async getCompanions(): Promise<Companion[]> {
    try {
      const response = await api.get('/matches/companions');
      return response.data;
    } catch (error) {
      console.error('Error fetching companions:', error);
      throw error;
    }
  },
  
  async processHobbies(description: string): Promise<ProcessHobbiesResponse> {
    try {
      const response = await api.post('/matches/process-hobbies', { description });
      return response.data;
    } catch (error) {
      console.error('Error processing hobbies:', error);
      throw error;
    }
  }
};