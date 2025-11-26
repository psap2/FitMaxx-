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

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED' && !session) {
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        }
        
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
    const setupRealtimeSubscription = async () => {
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user?.id;

      if (!userId) {
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        }
        return;
      }

      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }

      const channel = supabase.channel(`analysis:${userId}`)
        .on('broadcast', { event: 'analysis-complete' }, async (payload) => {
          const { data: currentSession } = await supabase.auth.getSession();
          if (!currentSession.session?.user?.id) {
            return;
          }

          const { analysisId, status, analysis, error } = payload.payload;

          if (status === 'completed' && analysis) {
            const { data: verifySession } = await supabase.auth.getSession();
            if (!verifySession.session?.user?.id) {
              setState(prev => ({
                ...prev,
                isAnalyzing: false,
                showToast: false,
              }));
              return;
            }

            const storedData = await AsyncStorage.getItem(`analysis:${analysisId}`);
            const { imageUri } = storedData ? JSON.parse(storedData) : { imageUri: null };

            completeAnalysis(analysis, imageUri);
          } else if (status === 'error') {
            setState(prev => ({
              ...prev,
              isAnalyzing: false,
              showToast: false,
            }));
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
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.user?.id) {
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        analysisId: null,
        showToast: false,
      }));
      return;
    }

    setState(prev => {
      if (!prev.isAnalyzing && prev.analysisId === null) {
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

