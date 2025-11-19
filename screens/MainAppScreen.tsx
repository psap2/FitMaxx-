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

type MainAppScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MainApp'>;

interface MainAppScreenProps {
  navigation: MainAppScreenNavigationProp;
}

const { width, height } = Dimensions.get('window');

export const MainAppScreen: React.FC<MainAppScreenProps> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<'scan' | 'extras' | 'coach'>('scan');
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [userEmail, setUserEmail] = useState<string | undefined>(undefined);
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
      setUserEmail(data.session?.user?.email);
    };

    fetchSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email);
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

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#000000', '#000000', '#000000']}
        style={styles.background}
      >
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
      </LinearGradient>

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
          >
            <Ionicons name="log-out-outline" size={20} color="#fff" />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sheetCancel}
            onPress={() => setSettingsVisible(false)}
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 107, 53, 0.2)',
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
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
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
    backgroundColor: '#111',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 34,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
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
    fontFamily: fonts.bold,
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
    borderRadius: 16,
    marginBottom: 12,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: fonts.bold,
  },
  sheetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 14,
    justifyContent: 'center',
    borderRadius: 16,
    marginBottom: 12,
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
