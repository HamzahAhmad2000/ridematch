// screens/ChatScreen.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/StackNavigator';
import { MessagingService, Message } from '../services/messaging'; // Assuming Message type is exported

type ChatScreenRouteProp = RouteProp<RootStackParamList, 'Chat'>;
type ChatScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Chat'>;

// Define Dummy Data
const dummyMessages: Message[] = [
  { id: 'dummy-msg1', text: 'Hey! Are you the one I matched with for the ride to campus?', sent: false, timestamp: new Date(Date.now() - 60000 * 10) },
  { id: 'dummy-msg2', text: 'Hi there! Yes, that\'s me. Looking forward to sharing the ride.', sent: true, timestamp: new Date(Date.now() - 60000 * 9) },
  { id: 'dummy-msg3', text: 'Great! Just confirming, we are meeting at the library entrance at 8:30 AM tomorrow?', sent: false, timestamp: new Date(Date.now() - 60000 * 8) },
  { id: 'dummy-msg4', text: 'Yes, 8:30 AM at the library works perfectly. See you then!', sent: true, timestamp: new Date(Date.now() - 60000 * 7) },
  { id: 'dummy-msg5', text: 'Awesome, thanks! 👋', sent: false, timestamp: new Date(Date.now() - 60000 * 6) },
  { id: 'dummy-msg6', text: 'See you! Drive safe getting there.', sent: true, timestamp: new Date(Date.now() - 60000 * 5) },
];


const ChatScreen: React.FC = () => {
  const navigation = useNavigation<ChatScreenNavigationProp>();
  const route = useRoute<ChatScreenRouteProp>();
  const { userId = '', name = 'User' } = route.params || {};

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [usingDummyData, setUsingDummyData] = useState<boolean>(false); // Track dummy data

  const flatListRef = useRef<FlatList>(null);

  const loadMessages = useCallback(async () => {
    // Show loader only on initial load or if retrying after error
    if (messages.length === 0 || error) setIsLoading(true);
    setError(null);
    setUsingDummyData(false); // Reset flag

    try {
      if (!userId) {
        // If userId is missing from params, maybe show an error or dummy data for preview
        console.warn('User ID is missing, loading dummy messages.');
        setMessages(dummyMessages);
        setUsingDummyData(true);
        // throw new Error('User ID is missing'); // Or throw error
      } else {
        const chatMessages = await MessagingService.getMessages(userId);
        const sortedMessages = chatMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        setMessages(sortedMessages);
      }

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to load messages.';
      console.error('Error loading messages:', error);
      // setError(`Failed to load messages. Displaying sample chat. Error: ${errorMsg}`);
      setError(null); // Clear error to just show dummy data
      console.log('API failed, using dummy message data.');
      setMessages(dummyMessages); // Use dummy data on error
      setUsingDummyData(true); // Set flag
    } finally {
      setIsLoading(false);
    }
    // Scroll to bottom after messages load (real or dummy)
     setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
  }, [userId, error, messages.length]); // dependencies updated

  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: () => (
        <View style={styles.headerContent}>
          <Image
            source={require('../assets/images/Blue Profule icon.png')}
            style={styles.headerImage}
          />
          <View>
             <Text style={styles.headerNameText}>{name}</Text>
             {/* Optional: Indicate sample data in header */}
             {/* {usingDummyData && <Text style={styles.dummyDataHeaderInfo}> (Sample Chat)</Text>} */}
          </View>
        </View>
      ),
      headerLeft: () => (
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Image
            source={require('../assets/images/White Back icon.png')}
            style={styles.backIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
      ),
      headerStyle: {
        backgroundColor: '#113a78',
      },
      headerTintColor: '#fff',
    });

    loadMessages();

    // Polling setup remains the same
    const intervalId = setInterval(() => {
      if (!isSending && !usingDummyData) { // Don't poll if showing dummy data
         loadMessages();
      }
    }, 15000); // Increased polling interval slightly

    return () => clearInterval(intervalId);
  }, [navigation, name, userId, loadMessages, isSending, usingDummyData]); // Added usingDummyData dependency


  const handleSend = async () => {
    if (inputMessage.trim() === '' || isSending) return;

     // Prevent sending if using dummy data (as backend isn't working)
    if (usingDummyData) {
      Alert.alert("Sample Mode", "Cannot send messages while viewing sample data.");
      return;
    }

    const trimmedMessage = inputMessage.trim();
    const tempId = `temp_${Date.now()}`;

    const newMessage: Message = {
      id: tempId,
      text: trimmedMessage,
      sent: true,
      timestamp: new Date(),
    };

    setMessages(prevMessages => [...prevMessages, newMessage]);
    setInputMessage('');
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    setIsSending(true);

    try {
      const sentMessage = await MessagingService.sendMessage(userId, trimmedMessage);
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === tempId ? { ...sentMessage, sent: true } : msg
        )
      );
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to send message.';
      console.error('Send message error:', error);
      Alert.alert('Error', `${errorMsg}. Message not sent.`);
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === tempId ? { ...msg, failed: true } : msg
        )
      );
      // Optionally restore input: setInputMessage(trimmedMessage);
    } finally {
      setIsSending(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[
      styles.messageRow,
      item.sent ? styles.sentRow : styles.receivedRow
    ]}>
      <View style={[
        styles.messageBubble,
        item.sent ? styles.sentMessageBubble : styles.receivedMessageBubble,
        (item as any).failed && styles.failedMessageBubble
      ]}>
        <Text style={[
          styles.messageText,
          item.sent ? styles.sentMessageText : styles.receivedMessageText
        ]}>
          {item.text}
        </Text>
      </View>
       <Text style={[
           styles.messageTime,
           item.sent ? styles.sentTime : styles.receivedTime
        ]}>
          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          {(item as any).failed && <Text style={styles.failedIndicator}> !</Text>}
       </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0} // Adjusted offset slightly for iOS header
      >
        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#113a78" />
          </View>
        // Show error state ONLY if not loading and not using dummy data
        ) : error && !usingDummyData ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadMessages}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item, index) => item.id || `msg-${index}`}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => {
              // Scroll to end might be needed here if initial load doesn't trigger layout scroll
              // flatListRef.current?.scrollToEnd({ animated: false });
            }}
            onLayout={() => {
               // Scroll to end on layout, only if not loading initially
               // if (!isLoading) flatListRef.current?.scrollToEnd({ animated: false });
            }}
            ListEmptyComponent={
              !isLoading ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No messages yet</Text>
                  <Text style={styles.emptySubtext}>Start the conversation with {name}!</Text>
                  {usingDummyData && <Text style={styles.dummyDataInfo}>Displaying sample chat.</Text>}
                </View>
              ) : null
            }
          />
        )}

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputMessage}
            onChangeText={setInputMessage}
            placeholder={usingDummyData ? "Cannot send in sample mode" : "Type a message..."}
            placeholderTextColor="#888"
            multiline
            editable={!isLoading && !usingDummyData} // Disable input if loading or using dummy data
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              // Disable if empty, sending, loading, or using dummy data
              (inputMessage.trim() === '' || isSending || isLoading || usingDummyData) && styles.disabledSendButton
            ]}
            onPress={handleSend}
            disabled={inputMessage.trim() === '' || isSending || isLoading || usingDummyData}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Image
                source={require('../assets/images/Send Icon.png')}
                style={styles.sendIcon}
                resizeMode="contain"
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
   container: {
    flex: 1,
    backgroundColor: '#f5f5f5', // Light gray background
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  // Header Styles
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: -15, // Adjust spacing if needed
    maxWidth: '90%', // Prevent long names from overflowing
  },
  headerImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    backgroundColor: '#e6effc', // Placeholder background
  },
  headerNameText: {
    color: '#fff',
    fontFamily: 'Inter',
    fontSize: 17,
    fontWeight: '600',
  },
   dummyDataHeaderInfo: { // Style for sample data text in header
      color: '#ffdda6',
      fontSize: 12,
      fontStyle: 'italic',
   },
  backButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  backIcon: {
    width: 20,
    height: 20,
    tintColor: '#fff',
  },
  // Loading and Error Styles
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#113a78',
    borderRadius: 8,
  },
  retryButtonText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  // Empty State Styles
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingBottom: 50, // Push it up slightly from input
    marginTop: 50, // Add margin from top
  },
  emptyText: {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '600',
    color: '#113a78',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtext: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
   dummyDataInfo: {
      fontFamily: 'Inter',
      fontSize: 12,
      fontStyle: 'italic',
      color: '#ff9020',
      marginTop: 15,
      textAlign: 'center',
  },
  // Messages List Styles
  messagesList: {
    paddingHorizontal: 10,
    paddingVertical: 15,
    flexGrow: 1,
  },
  messageRow: {
    marginBottom: 12, // Increased spacing slightly
    alignItems: 'flex-end', // Default for sent
    flexDirection: 'column', // Stack bubble and time vertically
  },
  sentRow: {
     alignSelf: 'flex-end', // Align the whole row right
     alignItems: 'flex-end', // Align content (bubble, time) right
  },
  receivedRow: {
     alignSelf: 'flex-start', // Align the whole row left
     alignItems: 'flex-start', // Align content (bubble, time) left
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    // Removed horizontal margin, row controls alignment
  },
  sentMessageBubble: {
    backgroundColor: '#113a78',
  },
  receivedMessageBubble: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  failedMessageBubble: {
    backgroundColor: '#ffebee',
    borderColor: '#ffcdd2',
    borderWidth: 1,
  },
  messageText: {
    fontFamily: 'Inter',
    fontSize: 15,
    lineHeight: 20,
  },
  sentMessageText: {
    color: '#fff',
  },
  receivedMessageText: {
    color: '#333',
  },
  messageTime: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: '#888',
    marginTop: 4,
    marginHorizontal: 8, // Keep horizontal margin for time
  },
   sentTime: {
      // alignSelf: 'flex-end', // Handled by sentRow alignItems
   },
   receivedTime: {
      // alignSelf: 'flex-start', // Handled by receivedRow alignItems
   },
   failedIndicator: {
      color: 'red',
      fontWeight: 'bold',
   },
  // Input Area Styles
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'center', // Align items vertically center
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    paddingTop: Platform.OS === 'ios' ? 10 : 8,
    minHeight: 40, // Ensure minimum height
    maxHeight: 100,
    color: '#333',
    fontFamily: 'Inter',
    fontSize: 16,
    marginRight: 10,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#113a78',
    justifyContent: 'center',
    alignItems: 'center',
     // Removed marginBottom, relying on alignItems: 'center' in container
  },
  disabledSendButton: {
    backgroundColor: '#b0c4de',
  },
  sendIcon: {
    width: 22,
    height: 22,
    tintColor: '#fff',
  },
});

export default ChatScreen;