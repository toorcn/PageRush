import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  // Modal states
  showUploadModal: boolean;
  showDocumentManager: boolean;
  showHistory: boolean;
  showApiKeyInput: boolean;
  showFeatureSelector: boolean;
  
  // Sidebar
  sidebarCollapsed: boolean;
  
  // Focus mode
  focusMode: boolean;
  
  // Onboarding
  showOnboardingGuide: boolean;
  onboardingComplete: boolean;
  
  // Highlight states for onboarding
  highlightUpload: boolean;
  highlightApiKey: boolean;
  highlightFeatures: boolean;
  
  // Actions
  setShowUploadModal: (show: boolean) => void;
  setShowDocumentManager: (show: boolean) => void;
  setShowHistory: (show: boolean) => void;
  setShowApiKeyInput: (show: boolean) => void;
  setShowFeatureSelector: (show: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setFocusMode: (enabled: boolean) => void;
  setShowOnboardingGuide: (show: boolean) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  
  // Highlight actions
  highlightStep: (step: 'upload' | 'apiKey' | 'features') => void;
  clearHighlights: () => void;
  
  // Convenience toggles
  toggleDocumentManager: () => void;
  toggleHistory: () => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Initial state
      showUploadModal: false,
      showDocumentManager: false,
      showHistory: false,
      showApiKeyInput: false,
      showFeatureSelector: false,
      sidebarCollapsed: false,
      focusMode: false,
      showOnboardingGuide: true,
      onboardingComplete: false,
      highlightUpload: false,
      highlightApiKey: false,
      highlightFeatures: false,

      // Actions
      setShowUploadModal: (show) => set({ showUploadModal: show }),
      setShowDocumentManager: (show) => set({ showDocumentManager: show }),
      setShowHistory: (show) => set({ showHistory: show }),
      setShowApiKeyInput: (show) => set({ showApiKeyInput: show }),
      setShowFeatureSelector: (show) => set({ showFeatureSelector: show }),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setFocusMode: (enabled) => set({ focusMode: enabled }),
      setShowOnboardingGuide: (show) => set({ showOnboardingGuide: show }),
      
      completeOnboarding: () => set({ 
        onboardingComplete: true, 
        showOnboardingGuide: false 
      }),
      
      resetOnboarding: () => set({ 
        onboardingComplete: false, 
        showOnboardingGuide: true 
      }),

      highlightStep: (step) => {
        set({
          highlightUpload: step === 'upload',
          highlightApiKey: step === 'apiKey',
          highlightFeatures: step === 'features',
        });
        
        // Auto-clear after 2.5 seconds
        setTimeout(() => {
          set({
            highlightUpload: false,
            highlightApiKey: false,
            highlightFeatures: false,
          });
        }, 2500);
      },

      clearHighlights: () => set({
        highlightUpload: false,
        highlightApiKey: false,
        highlightFeatures: false,
      }),

      toggleDocumentManager: () => set((state) => ({ 
        showDocumentManager: !state.showDocumentManager 
      })),
      
      toggleHistory: () => set((state) => ({ 
        showHistory: !state.showHistory 
      })),
      
      toggleSidebar: () => set((state) => ({ 
        sidebarCollapsed: !state.sidebarCollapsed 
      })),
    }),
    {
      name: 'pagerush-ui',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        onboardingComplete: state.onboardingComplete,
      }),
    }
  )
);
