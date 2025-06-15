
// services/ride.ts
import api from './api';

export interface CreateRideForm {
  pickup_location: {
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  dropoff_location: {
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  car_type: string;
  passenger_slots: number;
  match_social: boolean;
  time_to_reach: string;
  payment_method: string;
  promo_code?: string;
  group_join?: boolean;
  fare: number;
  distance: number;
  sector?: string;
}

export interface JoinRideForm {
  ride_id: string;
  pickup_location: {
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  group_join?: boolean;
  seat_count?: number;
}

export const RideService = {
  async createRide(data: CreateRideForm) {
    const response = await api.post('/rides/create', data);
    return response.data;
  },
  
  async getAvailableRides(sector?: string) {
    const params = sector ? { sector } : {};
    const response = await api.get('/rides/available', { params });
    return response.data;
  },
  
  async joinRide(data: JoinRideForm) {
    const response = await api.post('/rides/join', data);
    return response.data;
  },
  
  async setArrivalStatus(ride_id: string, has_arrived: boolean = true) {
    const response = await api.post('/rides/arrival', { ride_id, has_arrived });
    return response.data;
  },
  
  async updateRideStatus(ride_id: string, status: string) {
    const response = await api.post('/rides/status', { ride_id, status });
    return response.data;
  },
  
  async getRideDetails(ride_id: string) {
    const response = await api.get(`/rides/${ride_id}`);
    return response.data;
  }
};