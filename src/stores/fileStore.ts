import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ParsedTranscript } from "@/lib/types";

interface TxState {
  file: File | undefined;
  setFile: (file: File | undefined) => void;
  data: ParsedTranscript | undefined;
  setData: (data: ParsedTranscript | undefined) => void;
  clear: () => void;
}

export const useTxStore = create<TxState>()(
  persist(
    (set) => ({
      file: undefined,
      setFile: (file) => set({ file }),
      data: undefined,
      setData: (data) => set({ data }),
      clear: () => set({ file: undefined, data: undefined }),
    }),
    {
      name: "term-planner-storage",
      partialize: (state) => ({
        data: state.data,
      }),
    },
  ),
);
