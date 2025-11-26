import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from '@react-native-community/blur';
import { fonts } from '../theme/fonts';
import { supabase } from '../utils/supabase';
import { getUser, createReferral, apiCall } from '../utils/api';
import { MarkdownText } from '../components/MarkdownText';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function CoachScreen() {
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  const [isCreatingReferral, setIsCreatingReferral] = useState(false);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);

  // Check premium status
  useEffect(() => {
    const checkPremiumStatus = async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        const userEmail = session.session?.user?.email;

        if (!userEmail) {
          setLoading(false);
          return;
        }

        const userData = await getUser(userEmail);

        if (userData && userData.length > 0) {
          const isPremium = userData[0].premium || false;
          setIsPremiumUser(isPremium);

          // If premium, initialize with welcome message
          if (isPremium) {
            setMessages([{
              role: 'assistant',
              content: "Hello! I'm your AI fitness coach. I have access to your goals, progress posts, and notes. How can I help you today?"
            }]);
          }
        }
      } catch (error) {
        console.error('Error checking premium status:', error);
        setIsPremiumUser(false);
      } finally {
        setLoading(false);
      }
    };

    checkPremiumStatus();
  }, []);

  const handleUpgradePress = async () => {
    setIsCreatingReferral(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user?.id;

      if (!userId) {
        Alert.alert('Error', 'You must be signed in to create a referral.');
        return;
      }

      const referral = await createReferral(userId);
      
      Alert.alert(
        'Your Referral Code',
        `Share your referral code with a friend to unlock Premium:\n\n${referral.referral_code}\n\nWhen they sign up and use your code, you'll both get Premium access!\n\nNote: This is your permanent referral code - it will be the same each time.`,
        [
          {
            text: 'Copy Code',
            onPress: () => {
              console.log('Referral code:', referral.referral_code);
            }
          },
          { text: 'OK' }
        ]
      );
    } catch (error: any) {
      console.error('Error creating referral:', error);
      Alert.alert('Error', 'Failed to create referral code. Please try again.');
    } finally {
      setIsCreatingReferral(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || sending) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setSending(true);

    try {
      // Get last 3 message pairs (user + assistant) for context
      // Exclude the current message we just added (it's the last one)
      const messagesBeforeCurrent = messages.slice(0, -1);
      const historyPairs: Array<{ user: string; assistant: string }> = [];
      
      // Extract pairs going backwards: look for assistant messages followed by user messages
      // We'll reverse the order when adding to maintain chronological order
      for (let i = messagesBeforeCurrent.length - 1; i > 0; i--) {
        const currentMsg = messagesBeforeCurrent[i];
        const prevMsg = messagesBeforeCurrent[i - 1];
        if (currentMsg.role === 'assistant' && prevMsg.role === 'user') {
          historyPairs.unshift({
            user: prevMsg.content,
            assistant: currentMsg.content,
          });
          if (historyPairs.length >= 3) break; // Only keep last 3 pairs
          i--; // Skip the user message in next iteration
        }
      }

      const data = await apiCall('/coach/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: historyPairs.slice(-3), // Last 3 pairs
        }),
      });

      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error: any) {
      console.error('Error sending message:', error);
      Alert.alert('Error', error.message || 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  // Render the coach interface (blurred for non-premium users)
  const coachInterface = (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.header}>
          <View style={styles.headerTitleContainer}>
            <Image 
              source={require('../assets/maximus.png')} 
              style={styles.headerLogo}
              resizeMode="contain"
            />
            <Text style={styles.headerTitle}>Maximus</Text>
          </View>
        </View>

        <ScrollView 
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          ref={(ref) => {
            if (ref && messages.length > 0) {
              setTimeout(() => ref.scrollToEnd({ animated: true }), 100);
            }
          }}
        >
          {messages.map((message, index) => (
            <View
              key={index}
              style={[
                styles.messageBubble,
                message.role === 'user' ? styles.userMessage : styles.assistantMessage,
              ]}
            >
              {message.role === 'assistant' ? (
                <MarkdownText content={message.content} style={styles.messageText} />
              ) : (
                <Text style={styles.messageText}>{message.content}</Text>
              )}
            </View>
          ))}
          {sending && (
            <View style={[styles.messageBubble, styles.assistantMessage]}>
              <ActivityIndicator size="small" color="#FF6B35" />
            </View>
          )}
        </ScrollView>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Ask your coach anything..."
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            value={inputMessage}
            onChangeText={setInputMessage}
            multiline
            maxLength={500}
            editable={!sending && isPremiumUser}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!inputMessage.trim() || sending || !isPremiumUser) && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={!inputMessage.trim() || sending || !isPremiumUser}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color={(!inputMessage.trim() || sending || !isPremiumUser) ? "rgba(255, 255, 255, 0.3)" : "#fff"} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );

  if (!isPremiumUser) {
    return (
      <View style={styles.container}>
        {/* Blurred coach interface as background */}
        <View style={styles.blurredBackground}>
          {coachInterface}
          <BlurView
            style={StyleSheet.absoluteFill}
            blurType="dark"
            blurAmount={8}
            reducedTransparencyFallbackColor="rgba(11, 11, 15, 0.6)"
          />
        </View>
        
        {/* Premium upgrade card overlay */}
        <View style={styles.premiumOverlay}>
          <View style={styles.premiumUpgradeCard}>
            <View style={styles.lockIconContainer}>
              <Ionicons name="lock-closed" size={48} color="#FF6B35" />
            </View>
            <Text style={styles.upgradeTitle}>Unlock AI Coach</Text>
            <Text style={styles.upgradeText}>
              Get personalized fitness coaching based on your goals, progress posts, and notes. Your AI coach will help you stay motivated and reach your fitness goals!
            </Text>
            <TouchableOpacity 
              style={[styles.upgradeButton, isCreatingReferral && styles.upgradeButtonDisabled]}
              onPress={handleUpgradePress}
              disabled={isCreatingReferral}
            >
              {isCreatingReferral ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="star" size={20} color="#fff" style={styles.upgradeIcon} />
                  <Text style={styles.upgradeButtonText}>Get Premium</Text>
                </>
              )}
            </TouchableOpacity>
            <Text style={styles.upgradeSubtext}>
              Join thousands of users getting personalized AI coaching
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // For premium users, show the interface directly
  return coachInterface;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0B0B0F',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerLogo: {
    width: 32,
    height: 32,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: fonts.regular,
    color: '#fff',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
    paddingBottom: 10,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(255, 107, 53, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.3)',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  messageText: {
    fontSize: 15,
    fontFamily: fonts.regular,
    color: '#fff',
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#000000',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 15,
    fontFamily: fonts.regular,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.3)',
    marginRight: 12,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(255, 107, 53, 0.3)',
  },
  blurredBackground: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  premiumOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  premiumUpgradeCard: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.98)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.3)',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    marginHorizontal: 20,
    maxWidth: 400,
  },
  lockIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 53, 0.3)',
  },
  upgradeTitle: {
    fontSize: 22,
    fontFamily: fonts.regular,
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  upgradeText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
    paddingHorizontal: 4,
  },
  upgradeButton: {
    borderRadius: 12,
    backgroundColor: '#FF6B35',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    gap: 8,
    marginBottom: 12,
  },
  upgradeButtonDisabled: {
    backgroundColor: 'rgba(255, 107, 53, 0.5)',
  },
  upgradeIcon: {
    marginRight: 4,
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: fonts.regular,
    textAlign: 'center',
  },
  upgradeSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
