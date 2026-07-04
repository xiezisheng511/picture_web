import { create } from 'zustand';
import type { ImageFile, ProcessedImage } from '@/types';

interface ImageState {
  source: ImageFile | null;
  result: ProcessedImage | null;
  processing: boolean;
  error: string | null;
  setSource: (file: ImageFile | null) => void;
  setResult: (result: ProcessedImage | null) => void;
  setProcessing: (v: boolean) => void;
  setError: (err: string | null) => void;
  reset: () => void;
}

export const useImageStore = create<ImageState>((set) => ({
  source: null,
  result: null,
  processing: false,
  error: null,
  setSource: (file) => set({ source: file, result: null, error: null }),
  setResult: (result) => set({ result, error: null }),
  setProcessing: (v) => set({ processing: v }),
  setError: (error) => set({ error }),
  reset: () => set({ source: null, result: null, processing: false, error: null }),
}));