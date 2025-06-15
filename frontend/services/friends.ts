import { api } from './api';

export interface Friend {
  friendship_id: string;
  user_id: string;
  name: string;
  email: string;
  created_at: string;
}

export interface FriendRequest {
  id: string;
  sender_id?: string;
  receiver_id?: string;
  sender_name?: string;
  receiver_name?: string;
  sender_email?: string;
  receiver_email?: string;
  created_at: string;
  status: string;
}

export interface SearchResult {
  user_id: string;
  name: string;
  email: string;
  can_add: boolean;
}

export interface RideInvitation {
  id: string;
  ride_id: string;
  inviter_name: string;
  ride_from: string;
  ride_to: string;
  ride_date: string;
  ride_time: string;
  created_at: string;
}

export interface FriendRequestsResponse {
  received_requests: FriendRequest[];
  sent_requests: FriendRequest[];
}

export interface FriendsListResponse {
  friends: Friend[];
  count: number;
}

export interface SearchResponse {
  results: SearchResult[];
  count: number;
}

export interface InvitationsResponse {
  invitations: RideInvitation[];
  count: number;
}

class FriendsService {
  // Friend Requests
  async sendFriendRequest(receiverId: string): Promise<{ message: string; request_id: string }> {
    const response = await api.post('/friends/requests/send', {
      receiver_id: receiverId
    });
    return response.data;
  }

  async getFriendRequests(): Promise<FriendRequestsResponse> {
    const response = await api.get('/friends/requests');
    return response.data;
  }

  async respondToFriendRequest(requestId: string, response: 'accepted' | 'declined'): Promise<{ message: string; friendship_id?: string }> {
    const apiResponse = await api.put(`/friends/requests/${requestId}/respond`, {
      response
    });
    return apiResponse.data;
  }

  // Friends Management
  async getFriendsList(): Promise<FriendsListResponse> {
    const response = await api.get('/friends/');
    return response.data;
  }

  async removeFriend(friendId: string): Promise<{ message: string }> {
    const response = await api.delete(`/friends/${friendId}`);
    return response.data;
  }

  async searchUsers(query: string): Promise<SearchResponse> {
    const response = await api.get(`/friends/search?q=${encodeURIComponent(query)}`);
    return response.data;
  }

  // Companions
  async getCompanionsList(): Promise<FriendsListResponse> {
    const response = await api.get('/friends/companions');
    return response.data;
  }

  async inviteCompanionToRide(companionId: string, rideId: string): Promise<{ message: string; invitation_id: string }> {
    const response = await api.post('/friends/companions/invite', {
      companion_id: companionId,
      ride_id: rideId
    });
    return response.data;
  }

  async getRideInvitations(): Promise<InvitationsResponse> {
    const response = await api.get('/friends/invitations');
    return response.data;
  }

  async respondToRideInvitation(invitationId: string, response: 'accepted' | 'declined'): Promise<{ message: string; joined_ride?: boolean }> {
    const apiResponse = await api.put(`/friends/invitations/${invitationId}/respond`, {
      response
    });
    return apiResponse.data;
  }
}

export const friendsService = new FriendsService(); 