import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import ScanScreen from './ScanScreen';
import ExtrasScreen from './ExtrasScreen';
import CoachScreen from './CoachScreen';
import { fonts } from '../theme/fonts';

type MainAppScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MainApp'>;

interface MainAppScreenProps {
  navigation: MainAppScreenNavigationProp;
}

const { width, height } = Dimensions.get('window');

export const MainAppScreen: React.FC<MainAppScreenProps> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<'scan' | 'extras' | 'coach'>('scan');

  const renderContent = () => {
    switch (activeTab) {
      case 'scan':
        return <ScanScreen navigation={navigation} />;
      case 'extras':
        return <ExtrasScreen />;
      case 'coach':
        return <CoachScreen />;
      default:
        return <ScanScreen navigation={navigation} />;
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
});
