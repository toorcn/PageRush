import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Document } from '@/types';

interface DocumentState {
  documents: Document[];
  activeDocuments: Document[];
  
  // Actions
  addDocument: (text: string, fileName?: string) => Document;
  removeDocument: (id: number) => void;
  setActiveDocuments: (docs: Document[]) => void;
  clearDocuments: () => void;
  getActiveText: () => string;
}

export const useDocumentStore = create<DocumentState>()(
  persist(
    (set, get) => ({
      documents: [],
      activeDocuments: [],

      addDocument: (text: string, fileName?: string) => {
        const newDocument: Document = {
          id: Date.now(),
          name: fileName || `Document ${get().documents.length + 1}`,
          text,
          timestamp: new Date().toISOString(),
        };
        
        set((state) => ({
          documents: [...state.documents, newDocument],
          activeDocuments: [newDocument],
        }));
        
        return newDocument;
      },

      removeDocument: (id: number) => {
        set((state) => {
          const remainingDocs = state.documents.filter((doc) => doc.id !== id);
          const updatedActiveDocs = state.activeDocuments.filter((doc) => doc.id !== id);
          
          return {
            documents: remainingDocs,
            activeDocuments: updatedActiveDocs.length > 0 
              ? updatedActiveDocs 
              : remainingDocs.length > 0 
                ? [remainingDocs[0]] 
                : [],
          };
        });
      },

      setActiveDocuments: (docs: Document[]) => {
        set({ activeDocuments: docs });
      },

      clearDocuments: () => {
        set({ documents: [], activeDocuments: [] });
      },

      getActiveText: () => {
        return get().activeDocuments.map((doc) => doc.text).join('\n\n---\n\n');
      },
    }),
    {
      name: 'pagerush-documents',
      partialize: (state) => ({
        documents: state.documents,
        activeDocuments: state.activeDocuments,
      }),
    }
  )
);
