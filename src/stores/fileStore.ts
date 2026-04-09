import { create } from "zustand";
import { ParsedTranscript } from "@/lib/types";

interface TxState {
  file: File | undefined;
  setFile: (file: File | undefined) => void;
  data: ParsedTranscript | undefined;
  setData: (data: ParsedTranscript | undefined) => void;
}

export const useTxStore = create<TxState>((set) => ({
  file: undefined,
  setFile: (file) => set({ file }),
  data: undefined,
  setData: (data) => set({ data }),
}));
