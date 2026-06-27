import React, { useState } from "react";
import { Medication } from "../types";
import { Search, Plus, Edit, Trash2, AlertTriangle, CheckCircle, Package2, ArrowUpDown, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface InventoryProps {
  medications: Medication[];
  onAddMedication: (med: Medication) => void;
  onUpdateMedication: (med: Medication) => void;
  onDeleteMedication: (id: string) => void;
  onClearAllMedications?: () => void;
  onResetMedications?: () => void;
}

export default function Inventory({
  medications,
  onAddMedication,
  onUpdateMedication,
  onDeleteMedication,
  onClearAllMedications,
  onResetMedications
}: InventoryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortField, setSortField] = useState<keyof Medication>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [editingMed, setEditingMed] = useState<Medication | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isWipeModalOpen, setIsWipeModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // New medication form state
  const [newMedForm, setNewMedForm] = useState<Partial<Medication>>({
    name: "",
    genericName: "",
    category: "Square Pharmaceuticals PLC",
    stock: 100,
    unit: "Tablet",
    strength: "",
    price: 0,
    cost: 0,
    description: "",
    storageLocation: "A1",
    sideEffects: [],
    lowStockThreshold: 20
  });

  const categories = ["All", ...Array.from(new Set(medications.map(m => m.category)))];

  const handleSort = (field: keyof Medication) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const toggleSortIcon = (field: keyof Medication) => {
    if (sortField !== field) return <ArrowUpDown size={14} className="text-slate-300 ml-1 inline" />;
    return sortDirection === "asc" ? " ▲" : " ▼";
  };

  const handleStockAdjust = (med: Medication, amount: number) => {
    const updated = { ...med, stock: Math.max(0, med.stock + amount) };
    onUpdateMedication(updated);
  };

  // Filter and Sort
  const filteredMeds = medications
    .filter(m => {
      const matchSearch = 
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.genericName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = selectedCategory === "All" || m.category === selectedCategory;
      return matchSearch && matchCategory;
    })
    .sort((a, b) => {
      let fieldA = a[sortField];
      let fieldB = b[sortField];

      if (typeof fieldA === "string") {
        fieldA = (fieldA as string).toLowerCase();
        fieldB = (fieldB as string).toLowerCase();
      }

      if (fieldA < fieldB) return sortDirection === "asc" ? -1 : 1;
      if (fieldA > fieldB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

  const handleCreateMedication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedForm.name || !newMedForm.strength || !newMedForm.price) return;

    // Sequential ID generation starting from highest existing MED-xxx value
    const maxIdNum = medications.reduce((max, m) => {
      const match = m.id.match(/^MED-(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        return !isNaN(num) ? Math.max(max, num) : max;
      }
      return max;
    }, 0);
    const nextIdNum = maxIdNum > 0 ? maxIdNum + 1 : 11;
    const generatedId = `MED-${String(nextIdNum).padStart(3, '0')}`;

    const newMed: Medication = {
      id: generatedId,
      name: newMedForm.name,
      genericName: newMedForm.genericName || newMedForm.name,
      category: newMedForm.category || "Square Pharmaceuticals PLC",
      stock: Number(newMedForm.stock) ?? 100,
      unit: newMedForm.unit || "Tablet",
      strength: newMedForm.strength,
      price: Number(newMedForm.price) || 0,
      cost: Number(newMedForm.price) * 0.67, // Proportional default cost
      description: newMedForm.description || "",
      storageLocation: newMedForm.storageLocation || "A1",
      sideEffects: newMedForm.sideEffects || [],
      lowStockThreshold: Number(newMedForm.lowStockThreshold) ?? 20
    };

    onAddMedication(newMed);
    setIsAddModalOpen(false);
    // Reset form
    setNewMedForm({
      name: "",
      genericName: "",
      category: "Square Pharmaceuticals PLC",
      stock: 100,
      unit: "Tablet",
      strength: "",
      price: 0,
      cost: 0,
      description: "",
      storageLocation: "A1",
      sideEffects: [],
      lowStockThreshold: 20
    });
  };

  const handleUpdateMedicationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMed) {
      onUpdateMedication(editingMed);
      setIsEditModalOpen(false);
      setEditingMed(null);
    }
  };

  return (
    <div className="space-y-6" id="inventory-root">
      {/* Search & Actions Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search medications, active ingredients, SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-sm"
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto justify-end flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider hidden md:inline">Brand:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat === "All" ? "All Brands" : cat}</option>
              ))}
            </select>
          </div>

          {medications.length > 0 && onClearAllMedications && (
            <button
              onClick={() => setIsWipeModalOpen(true)}
              className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <Trash2 size={16} />
              <span>Wipe Inventory</span>
            </button>
          )}

          {medications.length === 0 && onResetMedications && (
            <button
              onClick={() => setIsResetModalOpen(true)}
              className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <Package2 size={16} />
              <span>Restore Demo Data</span>
            </button>
          )}

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <Plus size={16} />
            <span>Add Medication</span>
          </button>
        </div>
      </div>

      {/* Medication List Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm text-slate-600">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <th className="py-3 px-4 cursor-pointer hover:bg-slate-100/70" onClick={() => handleSort("id")}>
                  ID {toggleSortIcon("id")}
                </th>
                <th className="py-3 px-4 cursor-pointer hover:bg-slate-100/70" onClick={() => handleSort("name")}>
                  Medication {toggleSortIcon("name")}
                </th>
                <th className="py-3 px-4 cursor-pointer hover:bg-slate-100/70" onClick={() => handleSort("category")}>
                  Brand / Company {toggleSortIcon("category")}
                </th>
                <th className="py-3 px-4 text-center cursor-pointer hover:bg-slate-100/70" onClick={() => handleSort("stock")}>
                  Stock level {toggleSortIcon("stock")}
                </th>
                <th className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100/70" onClick={() => handleSort("price")}>
                  Price {toggleSortIcon("price")}
                </th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMeds.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    <Package2 className="mx-auto mb-2 text-slate-300" size={40} />
                    No medications found matching search criteria.
                  </td>
                </tr>
              ) : (
                filteredMeds.map((med) => {
                  const isLow = med.stock <= med.lowStockThreshold;
                  const isOut = med.stock === 0;

                  return (
                    <tr key={med.id} className="hover:bg-slate-50/40 transition-colors group">
                      <td className="py-3 px-4 font-mono font-bold text-slate-400 text-xs">{med.id}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                          {med.name}
                          <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-mono font-medium">{med.strength}</span>
                        </div>
                        <div className="text-xs text-slate-400 italic mt-0.5 truncate max-w-[200px]">{med.genericName}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs bg-slate-100 px-2.5 py-1 rounded-lg text-slate-600 font-medium">
                          {med.category}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            disabled={med.stock === 0}
                            onClick={() => handleStockAdjust(med, -10)}
                            className="w-7 h-7 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-600 rounded-lg text-xs font-bold transition-colors"
                          >
                            -10
                          </button>
                          <div className="text-center min-w-[70px]">
                            <span className={`text-sm font-bold ${
                              isOut ? "text-rose-600" : isLow ? "text-amber-600" : "text-slate-800"
                            }`}>
                              {med.stock}
                            </span>
                            <span className="text-[10px] text-slate-400 block">{med.unit}</span>
                          </div>
                          <button
                            onClick={() => handleStockAdjust(med, 10)}
                            className="w-7 h-7 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-colors"
                          >
                            +10
                          </button>
                        </div>
                        {isLow && (
                          <div className="flex justify-center items-center gap-1 mt-1 text-[10px] text-amber-600 font-medium">
                            <AlertTriangle size={11} />
                            <span>{isOut ? "OUT OF STOCK" : "LOW STOCK WARNING"}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-800">
                        ৳{med.price.toFixed(2)}
                        <span className="text-[10px] text-slate-400 block font-normal">Margin: {Math.round(((med.price - med.cost) / med.price) * 100)}%</span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-500 text-xs">
                        {med.storageLocation}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setEditingMed(med);
                              setIsEditModalOpen(true);
                            }}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete ${med.name}?`)) {
                                onDeleteMedication(med.id);
                              }
                            }}
                            className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Medication Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                <h3 className="text-lg font-bold text-slate-800">Add New Medication to Stock</h3>
                <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateMedication} className="space-y-4 overflow-y-auto pr-2 flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Medication Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Amoxicillin"
                      value={newMedForm.name}
                      onChange={(e) => setNewMedForm({ ...newMedForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Active Ingredient (Generic)</label>
                    <input
                      type="text"
                      placeholder="e.g. Amoxicillin Trihydrate"
                      value={newMedForm.genericName}
                      onChange={(e) => setNewMedForm({ ...newMedForm, genericName: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Brand / Company</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Square Pharmaceuticals PLC"
                      value={newMedForm.category}
                      onChange={(e) => setNewMedForm({ ...newMedForm, category: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Strength</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 500 mg, 10 ml"
                      value={newMedForm.strength}
                      onChange={(e) => setNewMedForm({ ...newMedForm, strength: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Measurement Unit</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tablet, Capsule, Spray"
                      value={newMedForm.unit}
                      onChange={(e) => setNewMedForm({ ...newMedForm, unit: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Initial Stock</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={newMedForm.stock}
                      onChange={(e) => setNewMedForm({ ...newMedForm, stock: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Reorder Threshold</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={newMedForm.lowStockThreshold}
                      onChange={(e) => setNewMedForm({ ...newMedForm, lowStockThreshold: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Retail Price (৳)</label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      min={0}
                      placeholder="e.g. 1.20"
                      value={newMedForm.price || ""}
                      onChange={(e) => setNewMedForm({ ...newMedForm, price: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Shelf / Storage Location</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. A1, Shelf B-2"
                      value={newMedForm.storageLocation}
                      onChange={(e) => setNewMedForm({ ...newMedForm, storageLocation: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 text-slate-600 hover:text-slate-800 text-sm font-semibold hover:bg-slate-50 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-5 py-2 rounded-xl"
                  >
                    Save Medication
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Medication Modal */}
      <AnimatePresence>
        {isEditModalOpen && editingMed && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                <h3 className="text-lg font-bold text-slate-800">Edit Medication: {editingMed.name}</h3>
                <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleUpdateMedicationSubmit} className="space-y-4 overflow-y-auto pr-2 flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Medication Name</label>
                    <input
                      type="text"
                      required
                      value={editingMed.name}
                      onChange={(e) => setEditingMed({ ...editingMed, name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Generic Name</label>
                    <input
                      type="text"
                      value={editingMed.genericName}
                      onChange={(e) => setEditingMed({ ...editingMed, genericName: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Brand / Company</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Square Pharmaceuticals PLC"
                      value={editingMed.category}
                      onChange={(e) => setEditingMed({ ...editingMed, category: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Strength</label>
                    <input
                      type="text"
                      required
                      value={editingMed.strength}
                      onChange={(e) => setEditingMed({ ...editingMed, strength: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Measurement Unit</label>
                    <input
                      type="text"
                      required
                      value={editingMed.unit}
                      onChange={(e) => setEditingMed({ ...editingMed, unit: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Current Stock</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={editingMed.stock}
                      onChange={(e) => setEditingMed({ ...editingMed, stock: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Reorder Threshold</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={editingMed.lowStockThreshold}
                      onChange={(e) => setEditingMed({ ...editingMed, lowStockThreshold: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Retail Price (৳)</label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      min={0}
                      value={editingMed.price}
                      onChange={(e) => setEditingMed({ ...editingMed, price: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Shelf / Storage Location</label>
                    <input
                      type="text"
                      required
                      value={editingMed.storageLocation}
                      onChange={(e) => setEditingMed({ ...editingMed, storageLocation: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 text-slate-600 hover:text-slate-800 text-sm font-semibold hover:bg-slate-50 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-5 py-2 rounded-xl"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Wipe Confirmation Modal */}
      <AnimatePresence>
        {isWipeModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-6 shadow-xl max-w-md w-full border border-slate-100 space-y-4"
            >
              <div className="flex items-center gap-3 text-rose-600">
                <div className="p-2 bg-rose-50 rounded-xl">
                  <AlertTriangle size={24} />
                </div>
                <h3 className="text-lg font-bold">Clear Inventory?</h3>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">
                This will permanently delete all medications from the inventory. You will have to add medicines from scratch. Are you absolutely sure?
              </p>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsWipeModalOpen(false)}
                  className="px-4 py-2 text-slate-500 hover:text-slate-800 text-sm font-semibold hover:bg-slate-50 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onClearAllMedications) onClearAllMedications();
                    setIsWipeModalOpen(false);
                  }}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm px-5 py-2 rounded-xl transition-colors"
                >
                  Yes, Wipe Inventory
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Restore Confirmation Modal */}
      <AnimatePresence>
        {isResetModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-6 shadow-xl max-w-md w-full border border-slate-100 space-y-4"
            >
              <div className="flex items-center gap-3 text-blue-600">
                <div className="p-2 bg-blue-50 rounded-xl">
                  <Package2 size={24} />
                </div>
                <h3 className="text-lg font-bold">Restore Demo Data?</h3>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">
                This will reset the drug inventory medications to the default sample list. Any additions you made will be overwritten. Proceed?
              </p>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  className="px-4 py-2 text-slate-500 hover:text-slate-800 text-sm font-semibold hover:bg-slate-50 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onResetMedications) onResetMedications();
                    setIsResetModalOpen(false);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-5 py-2 rounded-xl transition-colors"
                >
                  Yes, Restore Demo Data
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
