import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScanScreen from './ScanScreen';
import ExtrasScreen from './ExtrasScreen';
import CoachScreen from './CoachScreen';
import { fonts } from '../theme/fonts';
import { supabase } from '../utils/supabase';
import { getUser, deleteUser } from '../utils/api';
import { Alert } from 'react-native';

type MainAppScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MainApp'>;

interface MainAppScreenProps {
  navigation: MainAppScreenNavigationProp;
}

const { width, height } = Dimensions.get('window');

export const MainAppScreen: React.FC<MainAppScreenProps> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<'scan' | 'extras' | 'coach'>('scan');
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [userEmail, setUserEmail] = useState<string | undefined>(undefined);
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const insets = useSafeAreaInsets();

  const renderContent = () => {
    switch (activeTab) {
      case 'scan':
        return <ScanScreen />;
      case 'extras':
        return <ExtrasScreen />;
      case 'coach':
        return <CoachScreen />;
      default:
        return <ScanScreen />;
    }
  };

  useEffect(() => {
    const fetchSession = async () => {
      const { data } = await supabase.auth.getSession();
      const email = data.session?.user?.email;
      setUserEmail(email);

      // Check premium status
      if (email) {
        try {
          const userData = await getUser(email);
          if (userData && userData.length > 0) {
            setIsPremiumUser(userData[0].premium || false);
          }
        } catch (error) {
          console.error('Error checking premium status:', error);
        }
      }
    };

    fetchSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const email = session?.user?.email;
      setUserEmail(email);
      
      // Check premium status on auth change
      if (email) {
        getUser(email).then(userData => {
          if (userData && userData.length > 0) {
            setIsPremiumUser(userData[0].premium || false);
          }
        }).catch(error => {
          console.error('Error checking premium status:', error);
        });
      } else {
        setIsPremiumUser(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setSettingsVisible(false);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Auth' }],
      });
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data including posts, goals, and progress photos.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              const { data: session } = await supabase.auth.getSession();
              const userId = session.session?.user?.id;

              if (!userId) {
                Alert.alert('Error', 'You must be signed in to delete your account.');
                setIsDeleting(false);
                return;
              }

              // Delete user data and auth user (handled server-side)
              await deleteUser(userId);

              // Sign out and navigate to auth
              await supabase.auth.signOut();
              
              setSettingsVisible(false);
              navigation.reset({
                index: 0,
                routes: [{ name: 'Auth' }],
              });
            } catch (error: any) {
              console.error('Error deleting account:', error);
              Alert.alert(
                'Error',
                error.message || 'Failed to delete account. Please try again.'
              );
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.background}>
        <View style={styles.content}>
          {renderContent()}
        </View>
        
        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={[styles.navItem, activeTab === 'scan' && styles.activeNavItem]}
            onPress={() => setActiveTab('scan')}
          >
            <Ionicons 
              name="scan" 
              size={24} 
              color={activeTab === 'scan' ? '#FF6B35' : 'rgba(255, 255, 255, 0.5)'} 
            />
            <Text style={[styles.navText, activeTab === 'scan' && styles.activeNavText]}>
              Scan
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, activeTab === 'extras' && styles.activeNavItem]}
            onPress={() => setActiveTab('extras')}
          >
            <Ionicons 
              name="ellipsis-horizontal" 
              size={24} 
              color={activeTab === 'extras' ? '#FF6B35' : 'rgba(255, 255, 255, 0.5)'} 
            />
            <Text style={[styles.navText, activeTab === 'extras' && styles.activeNavText]}>
              Extras
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, activeTab === 'coach' && styles.activeNavItem]}
            onPress={() => setActiveTab('coach')}
          >
            <Ionicons 
              name="chatbubble-ellipses" 
              size={24} 
              color={activeTab === 'coach' ? '#FF6B35' : 'rgba(255, 255, 255, 0.5)'} 
            />
            <Text style={[styles.navText, activeTab === 'coach' && styles.activeNavText]}>
              Coach
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {!(activeTab === 'coach' && !isPremiumUser) && (
        <View
          style={[
            styles.headerOverlay,
            { top: insets.top + 4, right: 20 },
          ]}
          pointerEvents="box-none"
        >
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => setSettingsVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Open settings"
          >
            <Ionicons name="settings-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      <Modal
        visible={settingsVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSettingsVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setSettingsVisible(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.bottomSheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Settings</Text>
          <TouchableOpacity
            style={styles.sheetButton}
            onPress={() => {
              setSettingsVisible(false);
              navigation.navigate('EditProfile');
            }}
          >
            <Ionicons name="create-outline" size={20} color="#fff" />
            <Text style={styles.sheetButtonText}>Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            disabled={isDeleting}
          >
            <Ionicons name="log-out-outline" size={20} color="#fff" />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.deleteButton, isDeleting && styles.deleteButtonDisabled]}
            onPress={handleDeleteAccount}
            disabled={isDeleting}
          >
            <Ionicons name="trash-outline" size={20} color="#fff" />
            <Text style={styles.deleteText}>
              {isDeleting ? 'Deleting...' : 'Delete Account'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sheetCancel}
            onPress={() => setSettingsVisible(false)}
            disabled={isDeleting}
          >
            <Text style={styles.sheetCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#000000',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    paddingBottom: 34, // Account for safe area
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeNavItem: {
    backgroundColor: 'rgba(255, 107, 53, 0.08)',
    borderRadius: 12,
  },
  navText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    marginTop: 4,
    fontFamily: fonts.regular,
  },
  activeNavText: {
    color: '#FF6B35',
    fontFamily: fonts.bold,
  },
  headerOverlay: {
    position: 'absolute',
    alignItems: 'flex-end',
    gap: 6,
    zIndex: 20,
  },
  headerEmail: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontFamily: fonts.regular,
    marginBottom: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  bottomSheet: {
    backgroundColor: '#000000',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 34,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 20,
    color: '#fff',
    fontFamily: fonts.regular,
    textAlign: 'center',
    marginTop: -8,
    marginBottom: 12,
  },
  sheetSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
    fontFamily: fonts.regular,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FF6B35',
    paddingVertical: 14,
    justifyContent: 'center',
    borderRadius: 12,
    marginBottom: 12,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: fonts.bold,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#E63222',
    paddingVertical: 14,
    justifyContent: 'center',
    borderRadius: 12,
    marginBottom: 12,
  },
  deleteButtonDisabled: {
    backgroundColor: 'rgba(230, 50, 34, 0.5)',
  },
  deleteText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: fonts.bold,
  },
  sheetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 14,
    justifyContent: 'center',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sheetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: fonts.bold,
  },
  sheetCancel: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  sheetCancelText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 15,
    fontFamily: fonts.regular,
  },
});
