import { create } from "zustand";

interface UiState {
  isMobileNavOpen: boolean;
  isAdEditorOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
  setAdEditorOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  isMobileNavOpen: false,
  isAdEditorOpen: false,
  setMobileNavOpen: (open) => set({ isMobileNavOpen: open }),
  setAdEditorOpen: (open) => set({ isAdEditorOpen: open }),
}));
