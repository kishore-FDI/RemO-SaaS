"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "./components/Navbar";
import {
  FiPlus,
  FiUsers,
  FiX,
  FiLoader,
  FiLink,
  FiCheck,
  FiCopy,
  FiArrowRight,
  FiGlobe,
} from "react-icons/fi";
import { motion } from "framer-motion";
import { useCompanyStore } from "@/lib/store";
import { useUser } from "@clerk/nextjs";

interface Company {
  id: string;
  name: string;
  role: string;
  createdAt: string;
}

const Companies = () => {
  const { user } = useUser();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [newCompany, setNewCompany] = useState<{
    id: string;
    name: string;
    inviteCode: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const { selectedCompany, setSelectedCompany } = useCompanyStore();
  const router = useRouter();

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/company");
      if (!res.ok) {
        throw new Error("Failed to fetch companies");
      }

      const data = await res.json();
      setCompanies(data.companies);
    } catch (error) {
      console.error("Error fetching companies:", error);
    } finally {
      setLoading(false);
    }
  };

  const createCompany = async () => {
    if (!companyName || companyName.trim() === "") {
      setError("Company name is required");
      return;
    }

    try {
      const res = await fetch("/api/company/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: companyName }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message);
        return;
      }

      setNewCompany(data.company);
      setCompanyName("");
      setError("");
      setShowCreateModal(false);
      setShowSuccessModal(true);
      fetchCompanies();
    } catch (error) {
      console.error(error);
      setError("Failed to create company");
    }
  };

  const joinCompany = async () => {
    if (!inviteCode || inviteCode.trim() === "") {
      setError("Invite code is required");
      return;
    }

    try {
      const res = await fetch("/api/company/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message);
        return;
      }

      setInviteCode("");
      setError("");
      setShowJoinModal(false);
      fetchCompanies();
    } catch (error) {
      console.error(error);
      setError("Failed to join company");
    }
  };

  const copyInviteLink = () => {
    if (!newCompany) return;
    const shareableLink = `${window.location.origin}/join?code=${newCompany.inviteCode}`;
    navigator.clipboard.writeText(shareableLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyInviteCode = () => {
    if (!newCompany) return;
    navigator.clipboard.writeText(newCompany.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCompanySelect = (company: Company) => {
    setSelectedCompany(company);
    console.log(selectedCompany);
    router.push("/home");
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-[#121218]">
      <Navbar user={user} />

      <div className="container mx-auto max-w-7xl px-4 py-12">
        {/* Welcome Header */}
        <motion.div
          className="mb-16 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="mb-2 text-5xl font-bold text-white">
            Welcome back,{" "}
            <span className="bg-gradient-to-r from-[#a677f5] to-[#ff5e87] bg-clip-text text-transparent">
              {user?.firstName} {user?.lastName}
            </span>
          </h1>
          <p className="text-lg text-gray-400">
            Select a company to continue or create a new one
          </p>
        </motion.div>

        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Company Cards Section */}
          <motion.div
            className="flex-1"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="mb-6 flex items-center">
              <FiGlobe className="mr-3 text-2xl text-[#a677f5]" />
              <h2 className="text-2xl font-semibold text-white">
                Your Companies
              </h2>
            </div>

            {loading ? (
              <div className="flex justify-center py-16">
                <FiLoader className="animate-spin text-3xl text-[#ff5e87]" />
              </div>
            ) : companies.length === 0 ? (
              <div className="rounded-xl bg-[#1e1e2d] p-12 text-center shadow-lg">
                <p className="text-lg text-gray-300">
                  You don&apos;t have any companies yet
                </p>
                <p className="mt-2 text-gray-400">
                  Create your first company to get started
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {companies.map((company) => (
                  <motion.div
                    key={company.id}
                    variants={itemVariants}
                    whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                    className="overflow-hidden rounded-xl bg-[#1e1e2d] shadow-lg"
                  >
                    <div className="p-6">
                      <div className="mb-8 flex items-start">
                        <div className="mr-4 rounded-xl bg-[#262636] p-4">
                          <FiUsers className="text-xl text-[#a677f5]" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white">
                            {company.name}
                          </h3>
                          <span className="text-sm capitalize text-gray-400">
                            {company.role}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleCompanySelect(company)}
                        className="group flex w-full items-center justify-center gap-2 rounded-lg bg-[#262636] py-3 font-medium text-white transition-all hover:bg-gradient-to-r hover:from-[#a677f5] hover:to-[#ff5e87]"
                      >
                        Select Company{" "}
                        <FiArrowRight className="transition-transform group-hover:translate-x-1" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Action Panel */}
          <motion.div
            className="lg:w-80"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="sticky top-24 rounded-xl bg-[#1e1e2d] p-6 shadow-lg">
              <h3 className="mb-6 text-xl font-semibold text-white">Actions</h3>

              <div className="space-y-4">
                <motion.button
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#7b2cbf] py-3 font-medium text-white transition-all hover:shadow-[0_0_15px_rgba(123,44,191,0.5)]"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowCreateModal(true)}
                >
                  <FiPlus className="text-xl" />
                  Create Company
                </motion.button>

                <motion.button
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#a677f5] bg-transparent py-3 font-medium text-[#a677f5] transition-all hover:bg-[#a677f5]/10"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowJoinModal(true)}
                >
                  <FiLink className="text-xl" />
                  Join Company
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Create Company Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <motion.div
            className="w-full max-w-md rounded-xl bg-[#1e1e2d] p-6 shadow-2xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-2xl font-semibold text-white">
                Create New Company
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-full p-1 text-gray-400 transition-colors hover:bg-[#262636] hover:text-white"
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="mb-6">
              <label
                htmlFor="companyName"
                className="mb-2 block text-sm font-medium text-gray-300"
              >
                Company Name
              </label>
              <input
                type="text"
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full rounded-lg border border-[#2a2a3d] bg-[#121218] p-4 text-white transition-all focus:border-[#a677f5] focus:outline-none focus:ring-1 focus:ring-[#a677f5]"
                placeholder="Enter company name"
              />
              {error && <p className="mt-2 text-sm text-[#ff5e87]">{error}</p>}
            </div>

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg px-5 py-3 text-gray-300 transition-colors hover:text-white"
              >
                Cancel
              </button>
              <motion.button
                onClick={createCompany}
                className="rounded-lg bg-gradient-to-r from-[#a677f5] to-[#ff5e87] px-5 py-3 font-medium text-white transition-all hover:shadow-[0_0_15px_rgba(166,119,245,0.5)]"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Create
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Join Company Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <motion.div
            className="w-full max-w-md rounded-xl bg-[#1e1e2d] p-6 shadow-2xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-2xl font-semibold text-white">
                Join Company
              </h3>
              <button
                onClick={() => setShowJoinModal(false)}
                className="rounded-full p-1 text-gray-400 transition-colors hover:bg-[#262636] hover:text-white"
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="mb-6">
              <label
                htmlFor="inviteCode"
                className="mb-2 block text-sm font-medium text-gray-300"
              >
                Invite Code
              </label>
              <input
                type="text"
                id="inviteCode"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="w-full rounded-lg border border-[#2a2a3d] bg-[#121218] p-4 text-white transition-all focus:border-[#a677f5] focus:outline-none focus:ring-1 focus:ring-[#a677f5]"
                placeholder="Enter company invite code"
              />
              {error && <p className="mt-2 text-sm text-[#ff5e87]">{error}</p>}
            </div>

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowJoinModal(false)}
                className="rounded-lg px-5 py-3 text-gray-300 transition-colors hover:text-white"
              >
                Cancel
              </button>
              <motion.button
                onClick={joinCompany}
                className="rounded-lg bg-gradient-to-r from-[#a677f5] to-[#ff5e87] px-5 py-3 font-medium text-white transition-all hover:shadow-[0_0_15px_rgba(166,119,245,0.5)]"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Join
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Success Modal After Company Creation */}
      {showSuccessModal && newCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <motion.div
            className="w-full max-w-md rounded-xl bg-[#1e1e2d] p-6 shadow-2xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center">
                <div className="mr-3 rounded-full bg-gradient-to-r from-[#a677f5]/20 to-[#ff5e87]/20 p-2">
                  <FiCheck className="text-[#a677f5]" size={20} />
                </div>
                <h3 className="text-2xl font-semibold text-white">
                  Company Created
                </h3>
              </div>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="rounded-full p-1 text-gray-400 transition-colors hover:bg-[#262636] hover:text-white"
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="mb-6">
              <h4 className="mb-4 text-xl font-medium bg-gradient-to-r from-[#a677f5] to-[#ff5e87] bg-clip-text text-transparent">
                {newCompany.name}
              </h4>
              <p className="mb-4 text-gray-300">
                Share this invite code with others to join your company:
              </p>

              <div className="mb-6 flex items-center justify-between rounded-lg bg-[#121218] p-4">
                <code className="font-mono text-lg text-[#a677f5]">
                  {newCompany.inviteCode}
                </code>
                <motion.button
                  onClick={copyInviteCode}
                  className="rounded-full p-2 text-gray-400 transition-colors hover:bg-[#262636] hover:text-[#ff5e87]"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {copied ? (
                    <FiCheck className="text-[#a677f5]" size={20} />
                  ) : (
                    <FiCopy size={20} />
                  )}
                </motion.button>
              </div>

              <motion.button
                onClick={copyInviteLink}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#262636] px-4 py-3 font-medium text-[#a677f5] transition-colors hover:bg-[#2a2a3d]"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <FiLink />
                {copied ? "Copied!" : "Copy Invite Link"}
              </motion.button>
            </div>

            <div className="flex justify-end">
              <motion.button
                onClick={() => setShowSuccessModal(false)}
                className="rounded-lg bg-gradient-to-r from-[#a677f5] to-[#ff5e87] px-5 py-3 font-medium text-white transition-all hover:shadow-[0_0_15px_rgba(166,119,245,0.5)]"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Done
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Companies;