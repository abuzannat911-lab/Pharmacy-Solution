import React from "react";
import { Medication, Prescription, Sale, Patient } from "../types";
import { Activity, AlertTriangle, CheckCircle, ClipboardList, Banknote, Package, ShoppingBag, Users } from "lucide-react";
import { motion } from "motion/react";

interface DashboardProps {
  medications: Medication[];
  prescriptions: Prescription[];
  sales: Sale[];
  patients: Patient[];
  onNavigate: (tab: string) => void;
}

export default function Dashboard({ medications, prescriptions, sales, patients, onNavigate }: DashboardProps) {
  // Stats calculations
  const totalMeds = medications.length;
  const lowStockMeds = medications.filter(m => m.stock <= m.lowStockThreshold);
  const pendingPrescriptions = prescriptions.filter(p => p.status === "Pending").length;
  const totalRevenue = sales.reduce((acc, s) => acc + s.total, 0);
  const totalPatients = patients.length;

  // Compute category distribution for visual breakdown
  const categoryCounts: { [key: string]: number } = {};
  medications.forEach(m => {
    categoryCounts[m.category] = (categoryCounts[m.category] || 0) + 1;
  });

  const categories = Object.keys(categoryCounts).map(cat => ({
    name: cat,
    count: categoryCounts[cat],
    percentage: Math.round((categoryCounts[cat] / totalMeds) * 100)
  })).sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-6" id="dashboard-root">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div 
          onClick={() => onNavigate("inventory")}
          className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:border-emerald-200 transition-all cursor-pointer group"
          id="stat-inventory"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Inventory</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-2">{totalMeds}</h3>
              <p className="text-xs text-slate-400 mt-1">Unique medications loaded</p>
            </div>
            <div className="p-3 bg-slate-50 text-slate-600 rounded-xl group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
              <Package size={20} />
            </div>
          </div>
          {lowStockMeds.length > 0 && (
            <div className="mt-4 flex items-center gap-1.5 text-xs text-rose-600 font-medium">
              <AlertTriangle size={14} />
              <span>{lowStockMeds.length} items low or out of stock</span>
            </div>
          )}
        </div>

        <div 
          onClick={() => onNavigate("prescriptions")}
          className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:border-sky-200 transition-all cursor-pointer group"
          id="stat-prescriptions"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Pending Refills</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-2">{pendingPrescriptions}</h3>
              <p className="text-xs text-slate-400 mt-1">Awaiting pharmacist fill</p>
            </div>
            <div className="p-3 bg-slate-50 text-slate-600 rounded-xl group-hover:bg-sky-50 group-hover:text-sky-600 transition-colors">
              <ClipboardList size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
            <CheckCircle size={14} />
            <span>{prescriptions.filter(p => p.status === "Dispensed").length} dispensed this week</span>
          </div>
        </div>

        <div 
          onClick={() => onNavigate("sales")}
          className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:border-violet-200 transition-all cursor-pointer group"
          id="stat-sales"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Revenue</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-2">৳{totalRevenue.toFixed(2)}</h3>
              <p className="text-xs text-slate-400 mt-1">From {sales.length} transactions</p>
            </div>
            <div className="p-3 bg-slate-50 text-slate-600 rounded-xl group-hover:bg-violet-50 group-hover:text-violet-600 transition-colors">
              <Banknote size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
            <ShoppingBag size={14} />
            <span>Average ticket: ৳{(totalRevenue / (sales.length || 1)).toFixed(2)}</span>
          </div>
        </div>

        <div 
          onClick={() => onNavigate("patients")}
          className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:border-rose-200 transition-all cursor-pointer group"
          id="stat-patients"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Patient Profiles</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-2">{totalPatients}</h3>
              <p className="text-xs text-slate-400 mt-1">With full clinical histories</p>
            </div>
            <div className="p-3 bg-slate-50 text-slate-600 rounded-xl group-hover:bg-rose-50 group-hover:text-rose-600 transition-colors">
              <Users size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
            <Activity size={14} />
            <span>All profiles allergy-screened</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Low Stock Alert & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Low Stock & Actions */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h4 className="text-lg font-bold text-slate-800">Critical Stock Warnings</h4>
                <p className="text-xs text-slate-500 mt-0.5">Medications below safety reorder threshold</p>
              </div>
              <button 
                onClick={() => onNavigate("ai-assistant")}
                className="text-xs font-semibold px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors flex items-center gap-1"
              >
                <Activity size={12} />
                AI Restock Advice
              </button>
            </div>

            {lowStockMeds.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm">
                <CheckCircle className="mx-auto text-emerald-500 mb-2" size={32} />
                All medication inventory is above minimum thresholds!
              </div>
            ) : (
              <div className="divide-y divide-slate-100 overflow-y-auto max-h-[300px] pr-2">
                {lowStockMeds.map((med) => (
                  <div key={med.id} className="py-3 flex justify-between items-center group">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800 text-sm">{med.name}</span>
                        <span className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-mono">{med.strength}</span>
                      </div>
                      <p className="text-xs text-slate-500">Location: {med.storageLocation} • Cat: {med.category}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1.5 justify-end">
                        <span className={`text-sm font-bold ${med.stock === 0 ? "text-rose-600" : "text-amber-600"}`}>
                          {med.stock} {med.unit}
                        </span>
                        <span className="text-xs text-slate-400">/ {med.lowStockThreshold} min</span>
                      </div>
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${
                        med.stock === 0 ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"
                      }`}>
                        {med.stock === 0 ? "OUT OF STOCK" : "REORDER REQ"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="border-t border-slate-100 pt-4 mt-4 flex justify-between items-center">
            <span className="text-xs text-slate-500">Smart reorders keep the shelves optimal.</span>
            <button 
              onClick={() => onNavigate("inventory")}
              className="text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
            >
              Go to Inventory Manager &rarr;
            </button>
          </div>
        </div>

        {/* Right Column: Category Distribution Chart */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h4 className="text-lg font-bold text-slate-800 mb-1">Medication Categories</h4>
          <p className="text-xs text-slate-500 mb-5">Proportional breakdown of inventory range</p>

          <div className="space-y-4">
            {categories.map((cat, index) => (
              <div key={cat.name} className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-700">{cat.name}</span>
                  <span className="text-slate-400">{cat.count} meds ({cat.percentage}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${cat.percentage}%` }}
                    transition={{ duration: 0.8, delay: index * 0.1 }}
                    className={`h-full rounded-full ${
                      index === 0 ? "bg-emerald-500" :
                      index === 1 ? "bg-sky-500" :
                      index === 2 ? "bg-violet-500" :
                      index === 3 ? "bg-amber-500" : "bg-slate-400"
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Sales & Operations Feed */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h4 className="text-lg font-bold text-slate-800">Recent Pharmacy Sales Activity</h4>
            <p className="text-xs text-slate-500 mt-0.5">Log of completed dispensing terminal transactions</p>
          </div>
          <button 
            onClick={() => onNavigate("sales")}
            className="text-xs font-semibold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
          >
            Open Register Terminal
          </button>
        </div>

        {sales.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-sm">
            No sales recorded today.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Receipt ID</th>
                  <th className="py-3 px-4">Date/Time</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Items Sold</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4 text-right">Total Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sales.slice(-5).reverse().map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-700 text-xs">{sale.id}</td>
                    <td className="py-3 px-4 text-xs text-slate-500">
                      {new Date(sale.date).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">{sale.patientName}</td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-0.5 max-w-[240px]">
                        {sale.items.map((item, idx) => (
                          <span key={idx} className="text-xs text-slate-600 truncate">
                            {item.quantity}x {item.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">৳{sale.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
