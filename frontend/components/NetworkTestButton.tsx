// components/NetworkTestButton.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import axios from 'axios';

interface NetworkTestResult {
  config: string;
  url: string;
  status: 'testing' | 'success' | 'failed';
  responseTime?: number;
  error?: string;
  details?: any;
}

const API_CONFIGS = [
  {
    name: 'Android Emulator',
    baseURL: 'http://10.0.2.2:5000/api',
    description: 'Standard Android emulator host mapping'
  },
  {
    name: 'Local Network',
    baseURL: 'http://192.168.100.153:5000/api',
    description: 'Direct IP access via local network'
  },
  {
    name: 'Localhost',
    baseURL: 'http://127.0.0.1:5000/api',
    description: 'Localhost fallback'
  }
];

const NetworkTestButton: React.FC = () => {
  const [testResults, setTestResults] = useState<NetworkTestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const testNetworkConnectivity = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    console.log('🔍 Starting comprehensive network diagnostics...');
    
    const results: NetworkTestResult[] = [];
    
    for (const config of API_CONFIGS) {
      const result: NetworkTestResult = {
        config: config.name,
        url: config.baseURL,
        status: 'testing'
      };
      
      results.push(result);
      setTestResults([...results]);
      
      try {
        console.log(`🧪 Testing ${config.name}: ${config.baseURL}`);
        const startTime = Date.now();
        
        const response = await axios.get(`${config.baseURL}/health`, {
          timeout: 10000,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        const responseTime = Date.now() - startTime;
        
        result.status = 'success';
        result.responseTime = responseTime;
        result.details = {
          status: response.status,
          statusText: response.statusText,
          data: response.data
        };
        
        console.log(`✅ ${config.name} - Success (${responseTime}ms):`, response.data);
        
      } catch (error: any) {
        result.status = 'failed';
        result.error = error.message;
        result.details = {
          code: error.code,
          message: error.message,
          response: error.response ? {
            status: error.response.status,
            statusText: error.response.statusText
          } : null
        };
        
        console.log(`❌ ${config.name} - Failed:`, error.message);
      }
      
      setTestResults([...results]);
    }
    
    // Test additional endpoints
    const workingConfigs = results.filter(r => r.status === 'success');
    
    if (workingConfigs.length > 0) {
      const bestConfig = workingConfigs[0];
      console.log(`🎯 Testing additional endpoints with ${bestConfig.config}...`);
      
      const additionalTests = [
        { endpoint: '/rides/available', name: 'Available Rides' },
        { endpoint: '/auth/me', name: 'User Profile' },
        { endpoint: '/wallet/balance', name: 'Wallet Balance' }
      ];
      
      for (const test of additionalTests) {
        try {
          const response = await axios.get(`${bestConfig.url}${test.endpoint}`, {
            timeout: 5000,
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });
          
          console.log(`✅ ${test.name} endpoint - Success:`, response.status);
          
        } catch (error: any) {
          console.log(`⚠️ ${test.name} endpoint - ${error.response?.status || 'Failed'}:`, error.message);
        }
      }
    }
    
    setIsRunning(false);
    
    // Show summary
    const successCount = results.filter(r => r.status === 'success').length;
    const summary = `Network Test Complete!\n${successCount}/${results.length} configurations working`;
    
    Alert.alert('Network Diagnostics', summary);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return '#4CAF50';
      case 'failed': return '#F44336';
      case 'testing': return '#FF9800';
      default: return '#9E9E9E';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅';
      case 'failed': return '❌';
      case 'testing': return '🔄';
      default: return '⏳';
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, isRunning && styles.buttonDisabled]}
        onPress={testNetworkConnectivity}
        disabled={isRunning}
      >
        <Text style={styles.buttonText}>
          {isRunning ? '🔍 Testing Network...' : '🌐 Test Network Connectivity'}
        </Text>
      </TouchableOpacity>

      {testResults.length > 0 && (
        <ScrollView style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Network Test Results:</Text>
          
          {testResults.map((result, index) => (
            <View key={index} style={styles.resultItem}>
              <View style={styles.resultHeader}>
                <Text style={styles.resultIcon}>{getStatusIcon(result.status)}</Text>
                <Text style={styles.resultConfig}>{result.config}</Text>
                {result.responseTime && (
                  <Text style={styles.responseTime}>{result.responseTime}ms</Text>
                )}
              </View>
              
              <Text style={styles.resultUrl}>{result.url}</Text>
              
              {result.status === 'success' && result.details && (
                <Text style={styles.successDetails}>
                  Status: {result.details.status} - {JSON.stringify(result.details.data)}
                </Text>
              )}
              
              {result.status === 'failed' && result.error && (
                <Text style={styles.errorDetails}>
                  Error: {result.error}
                </Text>
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    margin: 16,
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#9E9E9E',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultsContainer: {
    marginTop: 16,
    maxHeight: 300,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  resultItem: {
    backgroundColor: 'white',
    padding: 12,
    marginBottom: 8,
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  resultIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  resultConfig: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    color: '#333',
  },
  responseTime: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  resultUrl: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  successDetails: {
    fontSize: 12,
    color: '#4CAF50',
    backgroundColor: '#E8F5E8',
    padding: 4,
    borderRadius: 4,
  },
  errorDetails: {
    fontSize: 12,
    color: '#F44336',
    backgroundColor: '#FFEBEE',
    padding: 4,
    borderRadius: 4,
  },
});

export default NetworkTestButton; 