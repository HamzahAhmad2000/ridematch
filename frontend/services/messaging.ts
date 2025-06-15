// services/messaging.ts
import api from './api';

export interface Conversation {
  id: string;
  user_id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
}

export interface Message {
  id: string;
  text: string;
  sent: boolean;
  timestamp: Date;
}

export const MessagingService = {
  async getConversations(): Promise<Conversation[]> {
    try {
      const response = await api.get('/messages/conversations');
      return response.data;
    } catch (error) {
      console.error('Error getting conversations:', error);
      throw error;
    }
  },
  
  async getMessages(userId: string): Promise<Message[]> {
    try {
      const response = await api.get(`/messages/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting messages:', error);
      throw error;
    }
  },
  
  async sendMessage(userId: string, text: string): Promise<Message> {
    try {
      const response = await api.post('/messages/send', {
        receiver_id: userId,
        content: text
      });
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }
};