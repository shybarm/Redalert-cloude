import { create } from "zustand";
import type {
  ItemCondition,
  EstimationResult,
  PriceEstimationResult,
  AdGenerationResult,
} from "@/types/estimation";

type EstimationStep = "upload" | "analyzing" | "results" | "publish";

interface EstimationState {
  step: EstimationStep;
  photos: { file: File; preview: string; cloudinaryUrl?: string; cloudinaryId?: string }[];
  estimationId: string | null;
  result: EstimationResult | null;
  isLoading: boolean;
  error: string | null;

  setStep: (step: EstimationStep) => void;
  addPhoto: (file: File, preview: string) => void;
  removePhoto: (index: number) => void;
  setPhotoUploaded: (index: number, url: string, id: string) => void;
  setEstimationId: (id: string) => void;
  setResult: (result: EstimationResult) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateCondition: (condition: ItemCondition) => void;
  updatePricing: (pricing: PriceEstimationResult) => void;
  updateAd: (ad: AdGenerationResult) => void;
  reset: () => void;
}

const initialState = {
  step: "upload" as EstimationStep,
  photos: [] as EstimationState["photos"],
  estimationId: null,
  result: null,
  isLoading: false,
  error: null,
};

export const useEstimationStore = create<EstimationState>((set) => ({
  ...initialState,

  setStep: (step) => set({ step }),
  addPhoto: (file, preview) =>
    set((state) => ({
      photos: [...state.photos, { file, preview }],
    })),
  removePhoto: (index) =>
    set((state) => ({
      photos: state.photos.filter((_, i) => i !== index),
    })),
  setPhotoUploaded: (index, url, id) =>
    set((state) => ({
      photos: state.photos.map((p, i) =>
        i === index ? { ...p, cloudinaryUrl: url, cloudinaryId: id } : p
      ),
    })),
  setEstimationId: (id) => set({ estimationId: id }),
  setResult: (result) => set({ result, step: "results" }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  updateCondition: (condition) =>
    set((state) => {
      if (!state.result) return {};
      return {
        result: {
          ...state.result,
          product: {
            ...state.result.product,
            condition: {
              ...state.result.product.condition,
              assessment: condition,
            },
          },
        },
      };
    }),
  updatePricing: (pricing) =>
    set((state) => {
      if (!state.result) return {};
      return { result: { ...state.result, pricing } };
    }),
  updateAd: (ad) =>
    set((state) => {
      if (!state.result) return {};
      return { result: { ...state.result, ad } };
    }),
  reset: () => set(initialState),
}));
