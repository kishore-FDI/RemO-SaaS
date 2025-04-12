'use client'
// stores/companyStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
interface Company {
  id: string;
  name: string;
  role: string;
  createdAt: string;
}

interface CompanyState {
  selectedCompany: Company | null;
  setSelectedCompany: (company: Company | null) => void;
}

export const useCompanyStore = create<CompanyState>()(
  persist(
    (set) => ({
      selectedCompany: null,
      setSelectedCompany: (company: Company | null) => set({ selectedCompany: company }),
    }),
    {
      name: "selectedCompany", // localStorage key
      partialize: (state) => ({ selectedCompany: state.selectedCompany }),
    }
  )
);


interface FeatureState{
  title:string ;
  setTitle:(title:string) => void;
}

export const useFeature=create<FeatureState>()(
  persist(
    (set) => ({
      title: "",
      setTitle: (title: string ) => set({ title }),
    }),
    {
      name: "feature", // localStorage key
      partialize: (state) => ({ title: state.title }),
    }
  )
);
