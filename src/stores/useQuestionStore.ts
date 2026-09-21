import { create } from 'zustand';
import { Question, PhotoNote } from '../types';
import { api } from '../services/api';
import { useTreeStore } from './useTreeStore';
import { sortQuestionsByDifficulty } from '../utils/sorting';

export type SaveStatus = 'saved' | 'saving' | 'error';

interface QuestionState {
  currentQuestion: Question | null;
  images: PhotoNote[];
  saveStatus: SaveStatus;
  lastSavedAt: string | null;
  isLoading: boolean;

  // Actions
  loadQuestion: (id: string) => Promise<void>;
  updateField: <K extends keyof Question>(field: K, value: Question[K]) => void;
  forceSave: () => Promise<void>;

  // Photo Notes
  addPhotoNote: (dataUrl: string, caption?: string) => Promise<void>;
  deletePhotoNote: (id: string) => Promise<void>;
  updatePhotoCaption: (id: string, caption: string) => Promise<void>;
}

let debounceTimer: any = null;

export const useQuestionStore = create<QuestionState>((set, get) => ({
  currentQuestion: null,
  images: [],
  saveStatus: 'saved',
  lastSavedAt: null,
  isLoading: false,

  loadQuestion: async (id: string) => {
    // Flush any pending save before loading new question
    if (debounceTimer && get().currentQuestion) {
      clearTimeout(debounceTimer);
      await api.saveQuestion(get().currentQuestion!);
    }

    set({ isLoading: true });
    try {
      const [q, images] = await Promise.all([
        api.getQuestion(id),
        api.getImages(id)
      ]);
      set({
        currentQuestion: q,
        images,
        saveStatus: 'saved',
        isLoading: false,
        lastSavedAt: q ? q.updatedAt : null
      });
    } catch (err) {
      console.error('Failed to load question:', err);
      set({ isLoading: false, saveStatus: 'error' });
    }
  },

  updateField: (field, value) => {
    const current = get().currentQuestion;
    if (!current) return;

    const updated: Question = {
      ...current,
      [field]: value,
      updatedAt: new Date().toISOString()
    };

    set({ currentQuestion: updated, saveStatus: 'saving' });

    // Update in tree store in-memory for instant title/status reflection in sidebar
    useTreeStore.setState(state => ({
      questions: sortQuestionsByDifficulty(state.questions.map(q => q.id === updated.id ? updated : q))
    }));

    // Debounce database write (500ms)
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      try {
        const saved = await api.saveQuestion(updated);
        set({
          saveStatus: 'saved',
          lastSavedAt: saved.updatedAt
        });
      } catch (err) {
        console.error('Auto-save failed:', err);
        set({ saveStatus: 'error' });
      }
    }, 500);
  },

  forceSave: async () => {
    const current = get().currentQuestion;
    if (!current) return;
    if (debounceTimer) clearTimeout(debounceTimer);

    set({ saveStatus: 'saving' });
    try {
      const saved = await api.saveQuestion(current);
      set({
        saveStatus: 'saved',
        lastSavedAt: saved.updatedAt
      });
    } catch (err) {
      console.error('Force save failed:', err);
      set({ saveStatus: 'error' });
    }
  },

  addPhotoNote: async (dataUrl: string, caption = '') => {
    const q = get().currentQuestion;
    if (!q) return;

    try {
      const stored = await api.storeImage(dataUrl, 'photo.png');
      const newPhoto: PhotoNote = {
        id: stored.id,
        questionId: q.id,
        filePath: stored.filePath,
        dataUrl: stored.dataUrl,
        caption,
        orderIndex: get().images.length,
        createdAt: new Date().toISOString()
      };

      const saved = await api.saveImage(newPhoto);
      set(state => ({
        images: [...state.images, saved]
      }));
    } catch (err) {
      console.error('Failed to save photo note:', err);
    }
  },

  deletePhotoNote: async (id: string) => {
    try {
      await api.deleteImage(id);
      set(state => ({
        images: state.images.filter(img => img.id !== id)
      }));
    } catch (err) {
      console.error('Failed to delete photo note:', err);
    }
  },

  updatePhotoCaption: async (id: string, caption: string) => {
    const img = get().images.find(x => x.id === id);
    if (!img) return;
    const updated = { ...img, caption };
    await api.saveImage(updated);
    set(state => ({
      images: state.images.map(x => x.id === id ? updated : x)
    }));
  }
}));
