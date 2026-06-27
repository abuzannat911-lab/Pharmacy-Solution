import React, { useState, useEffect } from "react";
import { Medication, Patient, Prescription, Sale, User } from "./types";
import { 
  INITIAL_MEDICATIONS, 
  INITIAL_PATIENTS, 
  INITIAL_PRESCRIPTIONS, 
  INITIAL_SALES,
  INITIAL_USERS
} from "./data";
import Dashboard from "./components/Dashboard";
import Inventory from "./components/Inventory";
import Prescriptions from "./components/Prescriptions";
import Sales from "./components/Sales";
import Patients from "./components/Patients";
import AIAssistant from "./components/AIAssistant";
import MedexPortal from "./components/MedexPortal";
import UserManagement from "./components/UserManagement";
import { 
  LayoutDashboard, 
  Package, 
  ClipboardList, 
  DollarSign, 
  Users, 
  Sparkles, 
  AlertTriangle,
  Menu,
  Activity,
  Heart,
  Globe
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // State
  const [medications, setMedications] = useState<Medication[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Load from localStorage or default to mock data
  useEffect(() => {
    const cachedMeds = localStorage.getItem("pharmacy_medications");
    const cachedPatients = localStorage.getItem("pharmacy_patients");
    const cachedPrxs = localStorage.getItem("pharmacy_prescriptions");
    const cachedSales = localStorage.getItem("pharmacy_sales");
    const cachedUsers = localStorage.getItem("pharmacy_users");

    if (cachedMeds) setMedications(JSON.parse(cachedMeds));
    else setMedications(INITIAL_MEDICATIONS);

    if (cachedPatients) setPatients(JSON.parse(cachedPatients));
    else setPatients(INITIAL_PATIENTS);

    if (cachedPrxs) setPrescriptions(JSON.parse(cachedPrxs));
    else setPrescriptions(INITIAL_PRESCRIPTIONS);

    if (cachedSales) setSales(JSON.parse(cachedSales));
    else setSales(INITIAL_SALES);

    let loadedUsers: User[] = [];
    if (cachedUsers) {
      loadedUsers = JSON.parse(cachedUsers);
    } else {
      loadedUsers = INITIAL_USERS;
    }
    setUsers(loadedUsers);
    
    // Select first active user as default active session
    const activeOne = loadedUsers.find(u => u.status === "Active") || loadedUsers[0] || null;
    setCurrentUser(activeOne);
  }, []);

  // Save changes helpers
  const saveMeds = (updated: Medication[]) => {
    setMedications(updated);
    localStorage.setItem("pharmacy_medications", JSON.stringify(updated));
  };

  const savePatients = (updated: Patient[]) => {
    setPatients(updated);
    localStorage.setItem("pharmacy_patients", JSON.stringify(updated));
  };

  const savePrescriptions = (updated: Prescription[]) => {
    setPrescriptions(updated);
    localStorage.setItem("pharmacy_prescriptions", JSON.stringify(updated));
  };

  const saveSales = (updated: Sale[]) => {
    setSales(updated);
    localStorage.setItem("pharmacy_sales", JSON.stringify(updated));
  };

  const saveUsers = (updated: User[]) => {
    setUsers(updated);
    localStorage.setItem("pharmacy_users", JSON.stringify(updated));
  };

  // User callbacks
  const handleAddUser = (newUser: User) => {
    saveUsers([...users, newUser]);
  };

  const handleUpdateUser = (updatedUser: User) => {
    const nextUsers = users.map(u => u.id === updatedUser.id ? updatedUser : u);
    saveUsers(nextUsers);
    if (currentUser && currentUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
  };

  const handleDeleteUser = (id: string) => {
    const nextUsers = users.filter(u => u.id !== id);
    saveUsers(nextUsers);
    if (currentUser && currentUser.id === id) {
      const activeOne = nextUsers.find(u => u.status === "Active") || nextUsers[0] || null;
      setCurrentUser(activeOne);
    }
  };

  const handleSwitchUser = (user: User) => {
    setCurrentUser(user);
    const updated = { ...user, lastActive: new Date().toISOString() };
    handleUpdateUser(updated);
  };

  // 1. Inventory callbacks
  const handleAddMedication = (newMed: Medication | Medication[]) => {
    setMedications(prev => {
      const toAdd = Array.isArray(newMed) ? newMed : [newMed];
      const updated = [...prev, ...toAdd];
      localStorage.setItem("pharmacy_medications", JSON.stringify(updated));
      return updated;
    });
  };

  const handleUpdateMedication = (updatedMed: Medication) => {
    saveMeds(medications.map(m => m.id === updatedMed.id ? updatedMed : m));
  };

  const handleDeleteMedication = (id: string) => {
    saveMeds(medications.filter(m => m.id !== id));
  };

  const handleClearAllMedications = () => {
    saveMeds([]);
  };

  const handleResetMedications = () => {
    saveMeds(INITIAL_MEDICATIONS);
  };

  // 2. Patient callbacks
  const handleAddPatient = (newPatient: Patient) => {
    savePatients([...patients, newPatient]);
  };

  // 3. Prescription callbacks
  const handleAddPrescription = (newPrx: Prescription) => {
    savePrescriptions([...prescriptions, newPrx]);
  };

  const handleUpdatePrescription = (updatedPrx: Prescription) => {
    savePrescriptions(prescriptions.map(p => p.id === updatedPrx.id ? updatedPrx : p));
  };

  // 4. Dispense Prescription callback (reduces stock, completes sale, dispenses prescription)
  const handleDispensePrescription = (prx: Prescription) => {
    // Determine medication price
    const med = medications.find(m => m.id === prx.medicationId);
    if (!med) return;

    // Reduce stock
    const updatedMeds = medications.map(m => {
      if (m.id === med.id) {
        return { ...m, stock: Math.max(0, m.stock - prx.quantity) };
      }
      return m;
    });
    saveMeds(updatedMeds);

    // Update prescription status
    const updatedPrxs = prescriptions.map(p => {
      if (p.id === prx.id) return { ...p, status: "Dispensed" as const };
      return p;
    });
    savePrescriptions(updatedPrxs);

    // Record automatic Sale
    const subtotal = prx.quantity * med.price;
    const tax = subtotal * 0.08;
    const grandTotal = subtotal + tax;

    const newSale: Sale = {
      id: `SAL-${Math.floor(500 + Math.random() * 500)}`,
      date: new Date().toISOString(),
      patientId: prx.patientId,
      patientName: prx.patientName,
      items: [
        {
          medicationId: med.id,
          name: med.name,
          quantity: prx.quantity,
          unitPrice: med.price,
          total: subtotal
        }
      ],
      subtotal,
      tax,
      discount: 0,
      total: grandTotal,
      paymentMethod: "Insurance/Copay"
    };

    saveSales([...sales, newSale]);
  };

  // 5. POS Checkout Sale callback
  const handleCompleteSale = (completedSale: Sale) => {
    // Record sale
    saveSales([...sales, completedSale]);

    // Subtract stock levels
    const updatedMeds = medications.map(med => {
      const soldItem = completedSale.items.find(item => item.medicationId === med.id);
      if (soldItem) {
        return { ...med, stock: Math.max(0, med.stock - soldItem.quantity) };
      }
      return med;
    });
    saveMeds(updatedMeds);
  };

  const lowStockCount = medications.filter(m => m.stock <= m.lowStockThreshold).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-800" id="app-root">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 text-white flex flex-col justify-between shrink-0" id="sidebar">
        <div>
          {/* Brand Logo Header */}
          <div className="p-5 border-b border-slate-800 flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500 rounded-xl text-white shadow-md">
              <Heart size={20} className="fill-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-widest uppercase">Apex Clinic</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pharmacy Hub</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5" id="nav-links">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "dashboard"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-center gap-3">
                <LayoutDashboard size={16} />
                <span>Executive Dashboard</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("inventory")}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "inventory"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-center gap-3">
                <Package size={16} />
                <span>Drug Inventory</span>
              </div>
              {lowStockCount > 0 && (
                <span className="bg-rose-600 text-white font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {lowStockCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("prescriptions")}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "prescriptions"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-center gap-3">
                <ClipboardList size={16} />
                <span>Prescriptions Prep</span>
              </div>
              {prescriptions.filter(p => p.status === "Pending").length > 0 && (
                <span className="bg-emerald-500 text-white font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {prescriptions.filter(p => p.status === "Pending").length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("sales")}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "sales"
                  ? "bg-violet-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-center gap-3">
                <DollarSign size={16} />
                <span>Point of Sale (POS)</span>
              </div>
              <span className="bg-violet-500/30 text-violet-300 font-mono text-[9px] font-black tracking-wide uppercase px-1.5 py-0.5 rounded border border-violet-400/20">
                LIVE
              </span>
            </button>

            <button
              onClick={() => setActiveTab("patients")}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "patients"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-center gap-3">
                <Users size={16} />
                <span>Patient Charts</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("users")}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "users"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-center gap-3">
                <Users size={16} className="text-indigo-400" />
                <span>Staff & Roles</span>
              </div>
              <span className="bg-indigo-500/20 text-indigo-300 font-mono text-[9px] font-black tracking-wide uppercase px-1.5 py-0.5 rounded border border-indigo-400/20">
                ADMIN
              </span>
            </button>

            <button
              onClick={() => setActiveTab("ai-assistant")}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "ai-assistant"
                  ? "bg-gradient-to-r from-emerald-600 to-sky-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-center gap-3">
                <Sparkles size={16} />
                <span>Clinical AI Counsel</span>
              </div>
              <span className="bg-sky-500/30 text-sky-300 font-mono text-[9px] font-black tracking-wide uppercase px-1 rounded border border-sky-400/20">
                LATEST
              </span>
            </button>

            <button
              onClick={() => setActiveTab("medex-scraper")}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "medex-scraper"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-center gap-3">
                <Globe size={16} />
                <span>Medex BD Scraper</span>
              </div>
              <span className="bg-emerald-500/20 text-emerald-300 font-mono text-[9px] font-black tracking-wide uppercase px-1.5 py-0.5 rounded border border-emerald-400/20">
                PORTAL
              </span>
            </button>
          </nav>
        </div>

        {/* Workspace Footer Profile */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/25 text-slate-400 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 truncate">
            <img 
              src={currentUser?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"} 
              alt={currentUser?.name} 
              className="w-8 h-8 rounded-full object-cover border border-slate-700 shrink-0"
              referrerPolicy="no-referrer"
            />
            <div className="truncate">
              <div className="font-bold text-white text-[11px] truncate">{currentUser?.name || "No Active User"}</div>
              <div className="text-[10px] text-slate-500 font-black uppercase tracking-wider">{currentUser?.role || "Pharmacist"}</div>
            </div>
          </div>
          <button 
            onClick={() => setActiveTab("users")}
            className="text-[9px] text-indigo-400 hover:text-indigo-300 font-black uppercase tracking-wider cursor-pointer hover:underline"
          >
            Manage
          </button>
        </div>
      </aside>

      {/* Main Container Viewport */}
      <main className="flex-1 flex flex-col min-w-0" id="main-viewport">
        {/* Top Header Row */}
        <header className="bg-white px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase text-slate-400 tracking-wider">
              {activeTab.replace("-", " ")}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
            {lowStockCount > 0 && (
              <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg border border-amber-100 animate-pulse">
                <AlertTriangle size={13} />
                <span>{lowStockCount} Drugs Low Stock</span>
              </div>
            )}
            <div className="text-slate-400">
              UTC Time: <span className="font-mono font-bold text-slate-600">2026-06-26 15:06</span>
            </div>
          </div>
        </header>

        {/* Render Selected View Pane */}
        <section className="flex-1 p-6 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              {activeTab === "dashboard" && (
                <Dashboard 
                  medications={medications}
                  prescriptions={prescriptions}
                  sales={sales}
                  patients={patients}
                  onNavigate={(tab) => setActiveTab(tab)}
                />
              )}

              {activeTab === "inventory" && (
                <Inventory 
                  medications={medications}
                  onAddMedication={handleAddMedication}
                  onUpdateMedication={handleUpdateMedication}
                  onDeleteMedication={handleDeleteMedication}
                  onClearAllMedications={handleClearAllMedications}
                  onResetMedications={handleResetMedications}
                />
              )}

              {activeTab === "prescriptions" && (
                <Prescriptions 
                  prescriptions={prescriptions}
                  medications={medications}
                  patients={patients}
                  onAddPrescription={handleAddPrescription}
                  onUpdatePrescription={handleUpdatePrescription}
                  onDispensePrescription={handleDispensePrescription}
                />
              )}

              {activeTab === "sales" && (
                <Sales 
                  medications={medications}
                  patients={patients}
                  onCompleteSale={handleCompleteSale}
                  onAddPatient={handleAddPatient}
                  activeUser={currentUser}
                />
              )}

              {activeTab === "patients" && (
                <Patients 
                  patients={patients}
                  prescriptions={prescriptions}
                  onAddPatient={handleAddPatient}
                />
              )}

              {activeTab === "users" && (
                <UserManagement 
                  users={users}
                  onAddUser={handleAddUser}
                  onUpdateUser={handleUpdateUser}
                  onDeleteUser={handleDeleteUser}
                  currentUser={currentUser}
                  onSwitchUser={handleSwitchUser}
                />
              )}

              {activeTab === "ai-assistant" && (
                <AIAssistant 
                  medications={medications}
                />
              )}

              {activeTab === "medex-scraper" && (
                <MedexPortal 
                  medications={medications}
                  onAddMedication={handleAddMedication}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </section>
      </main>
    </div>
  );
}
