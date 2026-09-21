import { create } from 'zustand';
import { SearchResult } from '../types';
import { api } from '../services/api';

interface SearchState {
  isOpen: boolean;
  query: string;
  results: SearchResult[];
  selectedIndex: number;
  isLoading: boolean;

  // Actions
  openSearch: () => void;
  closeSearch: () => void;
  setQuery: (q: string) => void;
  setSelectedIndex: (idx: number) => void;
  executeSearch: (q: string) => Promise<void>;
}

let searchTimer: any = null;

export const useSearchStore = create<SearchState>((set, get) => ({
  isOpen: false,
  query: '',
  results: [],
  selectedIndex: 0,
  isLoading: false,

  openSearch: () => {
    set({ isOpen: true, query: '', results: [], selectedIndex: 0 });
  },

  closeSearch: () => {
    set({ isOpen: false });
  },

  setQuery: (query) => {
    set({ query, selectedIndex: 0 });
    if (searchTimer) clearTimeout(searchTimer);
    if (!query.trim()) {
      set({ results: [], isLoading: false });
      return;
    }
    set({ isLoading: true });
    searchTimer = setTimeout(() => {
      get().executeSearch(query);
    }, 150);
  },

  setSelectedIndex: (idx) => {
    set({ selectedIndex: idx });
  },

  executeSearch: async (query) => {
    try {
      const results = await api.searchAll(query);
      set({ results, isLoading: false, selectedIndex: 0 });
    } catch (err) {
      console.error('Search failed:', err);
      set({ isLoading: false });
    }
  }
}));
