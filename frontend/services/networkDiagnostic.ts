// services/networkDiagnostic.ts
import axios from 'axios';

export class NetworkDiagnostic {
  private static readonly TEST_URLS = [
    'http://10.0.2.2:5000/api/health',
    'http://127.0.0.1:5000/api/health',
    'http://localhost:5000/api/health',
    'http://192.168.1.100:5000/api/health', // Replace with your actual IP
  ];

  static async testConnectivity(): Promise<{
    workingUrl: string | null;
    results: Array<{ url: string; status: string; error?: string }>;
  }> {
    const results: Array<{ url: string; status: string; error?: string }> = [];
    let workingUrl: string | null = null;

    for (const url of this.TEST_URLS) {
      try {
        console.log(`Testing connection to: ${url}`);
        
        const response = await axios.get(url, {
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.status === 200) {
          results.push({ url, status: 'SUCCESS' });
          if (!workingUrl) {
            workingUrl = url.replace('/health', '');
          }
          console.log(`✅ ${url} - SUCCESS`);
        } else {
          results.push({ url, status: `HTTP ${response.status}` });
          console.log(`⚠️ ${url} - HTTP ${response.status}`);
        }
      } catch (error: any) {
        const errorMsg = error.code || error.message || 'Unknown error';
        results.push({ url, status: 'FAILED', error: errorMsg });
        console.log(`❌ ${url} - FAILED: ${errorMsg}`);
      }
    }

    return { workingUrl, results };
  }

  static async testWithAuth(baseUrl: string, token: string): Promise<boolean> {
    try {
      const response = await axios.get(`${baseUrl}/users/profile`, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      return response.status === 200;
    } catch (error) {
      console.error('Auth test failed:', error);
      return false;
    }
  }

  static logNetworkInfo() {
    console.log('=== NETWORK DIAGNOSTIC INFO ===');
    console.log('Platform:', require('react-native').Platform.OS);
    console.log('Expected URLs for Android Emulator:');
    console.log('- http://10.0.2.2:5000 (Host machine)');
    console.log('- http://127.0.0.1:5000 (Localhost - usually doesn\'t work)');
    console.log('Expected URLs for Physical Device:');
    console.log('- http://[YOUR_COMPUTER_IP]:5000');
    console.log('===============================');
  }
} 