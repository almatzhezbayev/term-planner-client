import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ParsedTranscript, RequirementsResponse } from "@/lib/types";

interface TxState {
  file: File | undefined;
  setFile: (file: File | undefined) => void;
  data: ParsedTranscript | undefined;
  setData: (data: ParsedTranscript | undefined) => void;
  requirements: RequirementsResponse | undefined;
  setRequirements: (requirements: RequirementsResponse | undefined) => void;
  clear: () => void;
}

export const useTxStore = create<TxState>()(
  persist(
    (set) => ({
      file: undefined,
      setFile: (file) => set({ file }),
      data: undefined,
      setData: (data) => set({ data, requirements: undefined }),
      requirements: undefined,
      setRequirements: (requirements) => set({ requirements }),
      clear: () =>
        set({ file: undefined, data: undefined, requirements: undefined }),
    }),
    {
      name: "term-planner-storage",
      partialize: (state) => ({
        data: state.data,
        requirements: state.requirements,
      }),
    },
  ),
);
