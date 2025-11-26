import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../utils/supabase';
import { PhysiqueAnalysis } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AnalysisState {
  isAnalyzing: boolean;
  analysisId: string | null;
  imageUri: string | null;
  analysis: PhysiqueAnalysis | null;
  showToast: boolean;
}

interface AnalysisContextType {
  startAnalysis: (imageUri: string, analysisId: string) => void;
  completeAnalysis: (analysis: PhysiqueAnalysis, imageUri: string) => void;
  dismissToast: () => void;
  state: AnalysisState;
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined);

export const AnalysisProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AnalysisState>({
    isAnalyzing: false,
    analysisId: null,
    imageUri: null,
    analysis: null,
    showToast: false,
  });
  const channelRef = useRef<any>(null);

  // Listen for auth state changes (logout, account deletion, etc.)
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // If user logged out, signed out, or token was revoked
      if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED' && !session) {
        // Clean up state and subscriptions
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        }
        
        // Reset state
        setState({
          isAnalyzing: false,
          analysisId: null,
          imageUri: null,
          analysis: null,
          showToast: false,
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Set up global realtime subscription
    const setupRealtimeSubscription = async () => {
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user?.id;

      if (!userId) {
        // If not authenticated, clean up any existing subscription
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        }
        return;
      }

      // Clean up existing subscription
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }

      // Subscribe to analysis completion broadcasts
      const channel = supabase.channel(`analysis:${userId}`)
        .on('broadcast', { event: 'analysis-complete' }, async (payload) => {
          // Verify user is still authenticated before processing
          const { data: currentSession } = await supabase.auth.getSession();
          if (!currentSession.session?.user?.id) {
            // User is no longer authenticated, ignore this broadcast
            return;
          }

          const { analysisId, status, analysis, error } = payload.payload;

          if (status === 'completed' && analysis) {
            // Double-check authentication before showing toast
            const { data: verifySession } = await supabase.auth.getSession();
            if (!verifySession.session?.user?.id) {
              // User logged out, don't show toast
              setState(prev => ({
                ...prev,
                isAnalyzing: false,
                showToast: false,
              }));
              return;
            }

            // Get stored image URI for this analysis
            const storedData = await AsyncStorage.getItem(`analysis:${analysisId}`);
            const { imageUri } = storedData ? JSON.parse(storedData) : { imageUri: null };

            completeAnalysis(analysis, imageUri);
          } else if (status === 'error') {
            setState(prev => ({
              ...prev,
              isAnalyzing: false,
              showToast: false,
            }));
            // You could show an error toast here if needed
          }
        })
        .subscribe();

      channelRef.current = channel;
    };

    setupRealtimeSubscription();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  const startAnalysis = (imageUri: string, analysisId: string) => {
    // Store image URI for later retrieval
    AsyncStorage.setItem(`analysis:${analysisId}`, JSON.stringify({ imageUri }));
    
    setState({
      isAnalyzing: true,
      analysisId,
      imageUri,
      analysis: null,
      showToast: false,
    });
  };

  const completeAnalysis = async (analysis: PhysiqueAnalysis, imageUri: string | null) => {
    // Verify user is still authenticated before showing toast
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.user?.id) {
      // User is not authenticated, don't show toast
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        analysisId: null,
        showToast: false,
      }));
      return;
    }

    setState(prev => {
      // Only update if we're still analyzing (prevents race conditions)
      if (!prev.isAnalyzing && prev.analysisId === null) {
        // Analysis was already completed, ignore this call
        return prev;
      }
      
      return {
        ...prev,
        isAnalyzing: false,
        analysisId: null,
        imageUri: imageUri || prev.imageUri,
        analysis,
        showToast: true,
      };
    });
  };

  const dismissToast = () => {
    setState(prev => ({
      ...prev,
      showToast: false,
    }));
  };

  return (
    <AnalysisContext.Provider value={{ startAnalysis, completeAnalysis, dismissToast, state }}>
      {children}
    </AnalysisContext.Provider>
  );
};

export const useAnalysis = () => {
  const context = useContext(AnalysisContext);
  if (!context) {
    throw new Error('useAnalysis must be used within AnalysisProvider');
  }
  return context;
};

