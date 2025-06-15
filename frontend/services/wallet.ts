// services/wallet.ts
import api from './api';

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: 'topup' | 'payment' | 'refund';
  description: string;
  payment_method?: string;
  ride_id?: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
}

export interface WalletInfo {
  balance: number;
  transactions: Transaction[];
}

export interface TopUpRequest {
  amount: number;
  payment_method: string;
  card_details?: {
    card_number: string;
    expiry: string;
    cvv: string;
    name_on_card: string;
  };
}

export interface PaymentRequest {
  ride_id: string;
  amount: number;
}

export interface WalletResponse {
  success: boolean;
  message: string;
  transaction_id?: string;
}

export const WalletService = {
  async getWalletInfo(): Promise<WalletInfo> {
    try {
      const response = await api.get('/wallet/info');
      return response.data;
    } catch (error) {
      console.error('Error fetching wallet info:', error);
      throw error;
    }
  },
  
  async topUpWallet(data: TopUpRequest): Promise<WalletResponse> {
    try {
      const response = await api.post('/wallet/topup', data);
      return response.data;
    } catch (error) {
      console.error('Error topping up wallet:', error);
      throw error;
    }
  },
  
  async payForRide(data: PaymentRequest): Promise<WalletResponse> {
    try {
      const response = await api.post('/wallet/pay', data);
      return response.data;
    } catch (error) {
      console.error('Error paying for ride:', error);
      throw error;
    }
  }
};