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
  setSelectedCompany: (company: Company) => void;
}

export const useCompanyStore = create<CompanyState>()(
  persist(
    (set) => ({
      selectedCompany: null,
      setSelectedCompany: (company: Company) => set({ selectedCompany: company }),
    }),
    {
      name: "selectedCompany", // localStorage key
      partialize: (state) => ({ selectedCompany: state.selectedCompany }),
    }
  )
);


interface user{
  a:string
}