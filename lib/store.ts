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
  selectedFeature:string ;
  setSelectedFeature:(title:string) => void;
}

export const useFeature=create<FeatureState>()(
  persist(
    (set) => ({
      selectedFeature: "",
      setSelectedFeature: (selectedFeature: string ) => set({ selectedFeature }),
    }),
    {
      name: "feature", // localStorage key
      partialize: (state) => ({ selectedFeature: state.selectedFeature }),
    }
  )
);
