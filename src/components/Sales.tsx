import React, { useState } from "react";
import { Medication, Patient, Sale, SaleItem } from "../types";
import { Plus, Minus, Trash2, ShoppingCart, Search, Check, AlertCircle, X, UserPlus, Sparkles, Receipt } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SalesProps {
  medications: Medication[];
  patients: Patient[];
  onCompleteSale: (sale: Sale) => void;
  onAddPatient: (patient: Patient) => void;
  activeUser: { name: string; role: string } | null;
}

interface ActiveOrder {
  id: string; // e.g. "#1 - Walk-in" or "#2 - Sarah Jenkins"
  customerName: string;
  customerId: string;
  basket: SaleItem[];
  discountType: "Flat" | "Percent";
  discountValue: number;
  cashPaid: string;
  paymentMethod: string;
}

export default function Sales({ medications, patients, onCompleteSale, onAddPatient, activeUser }: SalesProps) {
  // Tab/Order Management
  const [orders, setOrders] = useState<ActiveOrder[]>([
    {
      id: "#1 - Walk-in",
      customerName: "Walk-in Customer",
      customerId: "CUST-WALKIN",
      basket: [],
      discountType: "Flat",
      discountValue: 0,
      cashPaid: "",
      paymentMethod: "Cash"
    }
  ]);
  const [activeOrderIdx, setActiveOrderIdx] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [customerSearch, setCustomerSearch] = useState<string>("");
  const [showAddCustomerModal, setShowAddCustomerModal] = useState<boolean>(false);
  const [completedReceipt, setCompletedReceipt] = useState<Sale | null>(null);
  const [expandedMedId, setExpandedMedId] = useState<string | null>(null);

  // New Customer Form State
  const [newCustName, setNewCustName] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustAge, setNewCustAge] = useState<number>(30);
  const [newCustGender, setNewCustGender] = useState("Male");

  const currentOrder = orders[activeOrderIdx] || orders[0];

  // Helper to update current order's properties
  const updateCurrentOrder = (updatedFields: Partial<ActiveOrder>) => {
    const nextOrders = [...orders];
    nextOrders[activeOrderIdx] = {
      ...currentOrder,
      ...updatedFields
    };
    setOrders(nextOrders);
  };

  // Add new order tab
  const handleNewOrder = () => {
    const nextNum = orders.length + 1;
    const newOrder: ActiveOrder = {
      id: `#${nextNum} - Walk-in`,
      customerName: "Walk-in Customer",
      customerId: "CUST-WALKIN",
      basket: [],
      discountType: "Flat",
      discountValue: 0,
      cashPaid: "",
      paymentMethod: "Cash"
    };
    setOrders([...orders, newOrder]);
    setActiveOrderIdx(orders.length);
  };

  // Close order tab
  const handleCloseOrder = (indexToClose: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (orders.length <= 1) return; // Keep at least one

    const nextOrders = orders.filter((_, idx) => idx !== indexToClose);
    setOrders(nextOrders);

    // Adjust active index
    if (activeOrderIdx >= nextOrders.length) {
      setActiveOrderIdx(nextOrders.length - 1);
    } else if (activeOrderIdx > indexToClose) {
      setActiveOrderIdx(activeOrderIdx - 1);
    }
  };

  // Add item from catalog table to current cart basket
  const handleAddToBasket = (med: Medication) => {
    if (med.stock <= 0) return;

    const requestedQty = 1;
    const basket = [...currentOrder.basket];
    const existingItemIdx = basket.findIndex(item => item.medicationId === med.id);

    if (existingItemIdx > -1) {
      const newQty = basket[existingItemIdx].quantity + requestedQty;
      if (newQty > med.stock) {
        alert(`Insufficient Stock! Only ${med.stock} units available.`);
        return;
      }
      basket[existingItemIdx].quantity = newQty;
      basket[existingItemIdx].total = newQty * med.price;
    } else {
      if (requestedQty > med.stock) {
        alert(`Insufficient Stock! Only ${med.stock} units available.`);
        return;
      }
      basket.push({
        medicationId: med.id,
        name: med.name,
        quantity: requestedQty,
        unitPrice: med.price,
        total: requestedQty * med.price
      });
    }

    updateCurrentOrder({ basket });
  };

  // Barcode / Name Enter listener on product search bar
  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim() !== "") {
      const topMed = filteredMeds[0];
      if (topMed && topMed.stock > 0) {
        handleAddToBasket(topMed);
        setSearchQuery("");
      }
    }
  };

  const handleAdjustBasketQty = (medId: string, amount: number) => {
    const med = medications.find(m => m.id === medId);
    if (!med) return;

    const basket = currentOrder.basket.map(item => {
      if (item.medicationId === medId) {
        const nextQty = Math.max(1, item.quantity + amount);
        if (nextQty > med.stock) return item;
        return {
          ...item,
          quantity: nextQty,
          total: nextQty * item.unitPrice
        };
      }
      return item;
    });

    updateCurrentOrder({ basket });
  };

  const handleSetBasketQty = (medId: string, quantity: number) => {
    const med = medications.find(m => m.id === medId);
    if (!med) return;

    const validatedQty = Math.max(1, quantity);
    const basket = currentOrder.basket.map(item => {
      if (item.medicationId === medId) {
        const nextQty = validatedQty > med.stock ? med.stock : validatedQty;
        return {
          ...item,
          quantity: nextQty,
          total: nextQty * item.unitPrice
        };
      }
      return item;
    });

    updateCurrentOrder({ basket });
  };

  const handleRemoveFromBasket = (medId: string) => {
    const basket = currentOrder.basket.filter(item => item.medicationId !== medId);
    updateCurrentOrder({ basket });
  };

  // Quick select patient
  const handleSelectCustomer = (patient: Patient) => {
    updateCurrentOrder({
      customerId: patient.id,
      customerName: patient.name,
      id: `#${activeOrderIdx + 1} - ${patient.name.split(" ")[0]}`
    });
    setCustomerSearch("");
  };

  // Register Patient on-the-fly
  const handleCreateCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName || !newCustPhone) return;

    const newPatient: Patient = {
      id: `PAT-${Math.floor(100 + Math.random() * 900)}`,
      name: newCustName,
      phone: newCustPhone,
      age: Number(newCustAge),
      gender: newCustGender,
      email: `${newCustName.toLowerCase().replace(/\s+/g, "")}@example.com`,
      allergiesText: "None reported",
      notes: "Quick patient profile added via POS Terminal"
    };

    onAddPatient(newPatient);
    
    // Auto-select the newly added customer
    updateCurrentOrder({
      customerId: newPatient.id,
      customerName: newPatient.name,
      id: `#${activeOrderIdx + 1} - ${newPatient.name.split(" ")[0]}`
    });

    // Reset Form
    setNewCustName("");
    setNewCustPhone("");
    setNewCustAge(30);
    setNewCustGender("Male");
    setShowAddCustomerModal(false);
  };

  // Pricing Calculations
  const subtotal = currentOrder.basket.reduce((acc, it) => acc + it.total, 0);
  const discountAmount = currentOrder.discountType === "Percent" 
    ? (subtotal * (currentOrder.discountValue / 100))
    : currentOrder.discountValue;

  const grandTotal = Math.max(0, subtotal - discountAmount);

  // Cash Paid calculations
  const cashNum = parseFloat(currentOrder.cashPaid) || 0;
  const changeReturn = cashNum > grandTotal ? (cashNum - grandTotal) : 0;

  // Checkout process completion
  const handleCompleteCheckout = () => {
    if (currentOrder.basket.length === 0) return;

    const saleId = `SAL-${Math.floor(500 + Math.random() * 500)}`;
    const newSale: Sale = {
      id: saleId,
      date: new Date().toISOString(),
      patientId: currentOrder.customerId,
      patientName: currentOrder.customerName,
      items: currentOrder.basket,
      subtotal,
      tax: 0,
      discount: discountAmount,
      total: grandTotal,
      paymentMethod: currentOrder.paymentMethod
    };

    onCompleteSale(newSale);
    setCompletedReceipt(newSale);

    // Reset current active order or clear basket
    updateCurrentOrder({
      basket: [],
      discountValue: 0,
      cashPaid: "",
      customerName: "Walk-in Customer",
      customerId: "CUST-WALKIN",
      id: `#${activeOrderIdx + 1} - Walk-in`
    });
  };

  // Filters for available medication lists - just show searched product and similar generic in-stock products from other companies
  const query = searchQuery.trim().toLowerCase();
  const displayedMeds: { medication: Medication; isAlternative: boolean }[] = [];

  if (query !== "") {
    // 1. Direct matches by name, genericName, or category (company)
    const directMatches = medications.filter(m => 
      m.name.toLowerCase().includes(query) ||
      m.genericName.toLowerCase().includes(query) ||
      m.category.toLowerCase().includes(query)
    );

    const directIds = new Set(directMatches.map(dm => dm.id));

    // Add direct matches to list
    directMatches.forEach(m => {
      displayedMeds.push({ medication: m, isAlternative: false });
    });

    // 2. Gather unique generic ingredients from direct matches
    const matchedGenerics = Array.from(new Set(
      directMatches
        .map(m => m.genericName?.trim().toLowerCase())
        .filter(Boolean)
    ));

    // 3. Find in-stock alternatives with the same generic from different companies
    if (matchedGenerics.length > 0) {
      medications.forEach(m => {
        // If it is already a direct match, skip
        if (directIds.has(m.id)) return;

        // Same generic active ingredient (case-insensitive)
        const genLower = m.genericName?.trim().toLowerCase();
        if (matchedGenerics.includes(genLower)) {
          // Available in stock
          if (m.stock > 0) {
            // Different company
            const directMatchesWithSameGeneric = directMatches.filter(dm => dm.genericName?.trim().toLowerCase() === genLower);
            const isDifferentCompany = directMatchesWithSameGeneric.some(dm => 
              dm.category?.trim().toLowerCase() !== m.category?.trim().toLowerCase()
            );
            if (isDifferentCompany) {
              displayedMeds.push({ medication: m, isAlternative: true });
            }
          }
        }
      });
    }
  }

  const filteredMeds = displayedMeds.map(dm => dm.medication);

  // Filter patients for customer selection
  const matchingPatients = customerSearch.trim() === "" ? [] : patients.filter(p =>
    p.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    p.phone.includes(customerSearch)
  );

  // Helper to find similar generic products from other companies available in stock
  const getGenericAlternatives = (med: Medication) => {
    if (!med.genericName) return [];
    const currentGeneric = med.genericName.trim().toLowerCase();
    const currentCompany = med.category?.trim().toLowerCase();
    
    return medications.filter(m => {
      // Must be a different product
      if (m.id === med.id) return false;
      // Same generic name (case insensitive)
      if (m.genericName.trim().toLowerCase() !== currentGeneric) return false;
      // Different company (category represents company)
      if (currentCompany && m.category?.trim().toLowerCase() === currentCompany) return false;
      // Available in stock
      if (m.stock <= 0) return false;
      return true;
    });
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-10" id="pos-terminal-root">
      {/* Light POS Top Header Banner */}
      <div className="bg-gradient-to-r from-indigo-800 to-slate-900 text-white p-6 rounded-2xl shadow-sm mb-6 border border-indigo-950/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500 rounded-xl text-white shadow-md">
              <Sparkles className="animate-pulse" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-wider uppercase">Point of Sale (POS)</h2>
              <p className="text-xs text-indigo-300">Fast Billing & Checkout Terminal with Real-time Inventory Integration</p>
            </div>
          </div>

          {activeUser && (
            <div className="bg-white/10 backdrop-blur-xs border border-white/10 px-4 py-2 rounded-xl flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="text-xs text-indigo-100 font-semibold">
                Cashier: <strong className="text-white">{activeUser.name}</strong> ({activeUser.role})
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Customer Quick Switch Bar - Clean Light Styled */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs font-black text-slate-500 uppercase tracking-wider shrink-0">Current Customer:</span>
          
          <div className="relative flex-1 sm:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search size={14} />
            </div>
            <input
              type="text"
              placeholder="Search patients by phone or name..."
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />

            {/* Matching Patient Dropdown suggestions */}
            {matchingPatients.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden divide-y divide-slate-100 max-h-48 overflow-y-auto">
                {matchingPatients.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectCustomer(p)}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-all text-xs text-slate-700 block"
                  >
                    <span className="font-bold block text-slate-800">{p.name}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Phone: {p.phone} | Age: {p.age}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-between sm:justify-start">
          {currentOrder.customerId !== "CUST-WALKIN" && (
            <span className="text-xs bg-indigo-50 text-indigo-700 font-black px-3 py-1.5 rounded-lg border border-indigo-100">
              Active: {currentOrder.customerName}
            </span>
          )}

          <button
            onClick={() => setShowAddCustomerModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <UserPlus size={14} />
            Add Patient
          </button>
        </div>
      </div>

      {/* Checkout Order Pipeline Tabs Row */}
      <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-2 scrollbar-none">
        {orders.map((ord, idx) => {
          const isActive = idx === activeOrderIdx;
          return (
            <button
              key={idx}
              onClick={() => setActiveOrderIdx(idx)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer shrink-0 ${
                isActive
                  ? "bg-indigo-600 border-indigo-500 text-white shadow-sm font-black"
                  : "bg-white border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              <span>{ord.id}</span>
              {orders.length > 1 && (
                <span 
                  onClick={(e) => handleCloseOrder(idx, e)}
                  className="p-0.5 rounded-full hover:bg-black/10 text-slate-400 hover:text-slate-600 transition-all ml-1"
                >
                  <X size={10} />
                </span>
              )}
            </button>
          );
        })}

        <button
          onClick={handleNewOrder}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 border border-dashed border-slate-300 text-slate-600 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1 shrink-0"
        >
          <Plus size={12} />
          New Order
        </button>
      </div>

      {/* Main Grid: Left Catalog Inventory List vs Right Cart Checkout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Grid Panel (Catalog Inventory & Search) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {/* Product Search Box */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Search products by name or generic name (Press Enter to quick-add top result)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyPress}
              className="w-full bg-white border border-slate-200 pl-10 pr-4 py-3 rounded-2xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-xs"
            />
          </div>

          {/* Catalog Data Table - KEEP THE COMPACT TABLE VIEW */}
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs flex-1">
            <div className="overflow-x-auto max-h-[55vh] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-black uppercase tracking-wider border-b border-slate-100 text-[10px]">
                    <th className="py-3 px-4">Medicine Name</th>
                    <th className="py-3 px-4 w-28">Price</th>
                    <th className="py-3 px-4 text-center w-24">Stock</th>
                    <th className="py-3 px-4 text-center w-28">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {searchQuery.trim() === "" ? (
                    <tr>
                      <td colSpan={4} className="py-16 text-center text-slate-400 font-medium">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Search size={32} className="text-slate-300 stroke-1.5 animate-pulse" />
                          <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">Search POS Inventory</p>
                          <p className="text-slate-400 text-xs max-w-md">
                            Type a brand name, company, or generic active ingredient in the search bar above to look up products and discover in-stock generic alternatives instantly.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredMeds.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-slate-400 font-medium">
                        No medications matched your filters. Try another keyword.
                      </td>
                    </tr>
                  ) : (
                    filteredMeds.map((med) => {
                      const qtyInCart = currentOrder.basket.find(it => it.medicationId === med.id)?.quantity || 0;
                      const isOut = med.stock === 0;
                      const alternatives = getGenericAlternatives(med);
                      const hasAlts = alternatives.length > 0;
                      const isExpanded = expandedMedId === med.id;
                      const isAlternativeItem = displayedMeds.find(dm => dm.medication.id === med.id)?.isAlternative;

                      return (
                        <React.Fragment key={med.id}>
                          <tr className={`hover:bg-slate-50/50 transition-colors ${isExpanded ? "bg-indigo-50/20" : ""} ${isAlternativeItem ? "bg-amber-50/20" : ""}`}>
                            <td className="py-3.5 px-4">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-bold text-slate-800 text-sm">{med.name}</span>
                                {isAlternativeItem && (
                                  <span className="bg-amber-100 border border-amber-200 text-amber-800 text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow-xs">
                                    <Sparkles size={10} className="text-amber-500 animate-pulse animate-duration-1000" />
                                    Similar Generic Alt
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 italic font-medium mt-0.5 block">
                                {med.genericName} {med.strength && `· ${med.strength}`} {med.category && `· Manufacturer: ${med.category}`}
                              </span>
                              
                              {/* Generic alternatives suggestion button */}
                              {hasAlts && (
                                <button
                                  type="button"
                                  onClick={() => setExpandedMedId(isExpanded ? null : med.id)}
                                  className={`text-[10px] font-bold flex items-center gap-1 mt-1 transition-all px-2 py-0.5 rounded-full border ${
                                    isExpanded 
                                      ? "bg-indigo-100 border-indigo-200 text-indigo-700" 
                                      : isOut 
                                        ? "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100" 
                                        : "bg-slate-50 border-slate-200 text-indigo-600 hover:bg-slate-100"
                                  }`}
                                >
                                  <Sparkles size={11} className={`${isOut ? "text-amber-500 animate-pulse" : "text-indigo-500"}`} />
                                  <span>
                                    {isOut ? "Out of stock! Click here to see " : ""}
                                    {alternatives.length} similar generic suggestion{alternatives.length > 1 ? 's' : ''} in stock
                                  </span>
                                </button>
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="text-indigo-600 font-extrabold text-sm">৳{med.price.toFixed(2)}</span>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              {isOut ? (
                                <span className="inline-block bg-rose-50 text-rose-600 border border-rose-100 font-bold text-[10px] px-2 py-0.5 rounded-full">
                                  Out of Stock
                                </span>
                              ) : (
                                <span className="inline-block bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold text-[10px] px-2.5 py-0.5 rounded-full">
                                  {med.stock} units
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <button
                                onClick={() => handleAddToBasket(med)}
                                disabled={isOut}
                                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold text-xs px-4 py-1.5 rounded-xl transition-all cursor-pointer w-full text-center shadow-xs"
                              >
                                Add
                              </button>
                              {qtyInCart > 0 && (
                                <span className="text-[9px] text-emerald-600 font-black block mt-1">
                                  {qtyInCart} in cart
                                </span>
                              )}
                            </td>
                          </tr>

                          {/* Render similar generic alternatives in stock from other manufacturers */}
                          {isExpanded && hasAlts && (
                            <tr className="bg-indigo-50/30">
                              <td colSpan={4} className="py-3 px-4 border-b border-indigo-100/60">
                                <div className="bg-white rounded-xl border border-indigo-100/80 p-3.5 shadow-sm space-y-2">
                                  <div className="flex items-center justify-between border-b border-indigo-50 pb-1.5 mb-2">
                                    <span className="text-[10px] font-extrabold text-indigo-700 uppercase tracking-wider flex items-center gap-1">
                                      <Sparkles size={12} className="text-amber-500 animate-pulse" />
                                      Available Alternatives for "{med.name}" (Same Generic, in stock)
                                    </span>
                                    <span className="text-[9px] text-slate-400 font-medium">
                                      Generic Active Ingredient: <strong className="text-slate-600">{med.genericName}</strong>
                                    </span>
                                  </div>
                                  
                                  <div className="divide-y divide-slate-100">
                                    {alternatives.map(alt => {
                                      const qtyInCartAlt = currentOrder.basket.find(it => it.medicationId === alt.id)?.quantity || 0;
                                      return (
                                        <div key={alt.id} className="flex items-center justify-between py-2 text-xs hover:bg-slate-50/40 px-1 rounded transition-colors font-medium">
                                          <div>
                                            <div className="flex items-center gap-2">
                                              <span className="font-bold text-slate-800 text-sm">{alt.name}</span>
                                              <span className="text-[10px] bg-indigo-50 border border-indigo-100/60 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
                                                {alt.category || "Other Brand"}
                                              </span>
                                              {alt.strength && (
                                                <span className="text-[10px] text-slate-500 font-bold">{alt.strength}</span>
                                              )}
                                            </div>
                                            <span className="text-[10px] text-slate-400 mt-0.5 block font-medium">
                                              Shelf Location: <strong className="text-slate-500 font-bold">{alt.storageLocation || "A1"}</strong>
                                            </span>
                                          </div>
                                          
                                          <div className="flex items-center gap-4">
                                            <div className="text-right">
                                              <span className="font-extrabold text-indigo-600 block text-sm">৳{alt.price.toFixed(2)}</span>
                                              <span className="text-[10px] text-emerald-600 font-bold block">{alt.stock} left</span>
                                            </div>
                                            
                                            <div className="flex flex-col items-center">
                                              <button
                                                type="button"
                                                onClick={() => handleAddToBasket(alt)}
                                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] px-3 py-1 rounded-lg transition-all cursor-pointer shadow-xs"
                                              >
                                                Add to Cart
                                              </button>
                                              {qtyInCartAlt > 0 && (
                                                <span className="text-[9px] text-emerald-600 font-black mt-0.5">
                                                  {qtyInCartAlt} in cart
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Grid Panel (Cart Summary Checkout Column) */}
        <div className="lg:col-span-4 flex flex-col">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-full min-h-[50vh]">
            
            {/* Header */}
            <div>
              <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
                <h3 className="font-black text-slate-700 text-xs tracking-wider uppercase">Cart Summary</h3>
                <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-indigo-100">
                  {currentOrder.basket.length} lines
                </span>
              </div>

              {/* Cart Items List */}
              {currentOrder.basket.length === 0 ? (
                <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center">
                  <ShoppingCart size={40} className="text-slate-300 stroke-1.5 mb-2.5" />
                  <p className="text-xs font-bold text-slate-400">Cart is empty.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[30vh] overflow-y-auto pr-1">
                  {currentOrder.basket.map((item) => {
                    const med = medications.find(m => m.id === item.medicationId);
                    const isNearMax = med ? item.quantity >= med.stock : false;

                    return (
                      <div key={item.medicationId} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100/65">
                        <div className="max-w-[140px]">
                          <span className="font-bold text-slate-800 text-xs block truncate" title={item.name}>
                            {item.name}
                          </span>
                          <span className="text-[10px] text-slate-400 mt-0.5 block">
                            ৳{item.unitPrice.toFixed(2)} each
                          </span>
                        </div>

                        {/* Adjust qty controls */}
                        <div className="flex items-center gap-1 bg-white rounded-lg p-0.5 border border-slate-200">
                          <button
                            type="button"
                            onClick={() => handleAdjustBasketQty(item.medicationId, -1)}
                            className="w-5 h-5 bg-slate-50 text-slate-500 hover:text-slate-700 rounded flex items-center justify-center cursor-pointer"
                          >
                            <Minus size={10} />
                          </button>
                          <input
                            type="number"
                            min={1}
                            max={med?.stock || 9999}
                            value={item.quantity}
                            onChange={(e) => handleSetBasketQty(item.medicationId, parseInt(e.target.value) || 1)}
                            className="w-10 bg-transparent text-xs font-bold text-slate-700 text-center border-none focus:outline-none focus:ring-0 p-0"
                          />
                          <button
                            type="button"
                            disabled={isNearMax}
                            onClick={() => handleAdjustBasketQty(item.medicationId, 1)}
                            className="w-5 h-5 bg-slate-50 text-slate-500 disabled:opacity-30 hover:text-slate-700 rounded flex items-center justify-center cursor-pointer"
                          >
                            <Plus size={10} />
                          </button>
                        </div>

                        {/* Total price + remove */}
                        <div className="text-right flex items-center gap-2">
                          <span className="font-bold text-slate-800 text-xs">
                            ৳{item.total.toFixed(2)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveFromBasket(item.medicationId)}
                            className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Calculations Form */}
            <div className="border-t border-slate-100 pt-4 mt-5 space-y-4">
              {/* Payment Method selection */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Payment Method</label>
                <select
                  value={currentOrder.paymentMethod}
                  onChange={(e) => updateCurrentOrder({ paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                >
                  <option value="Cash">Cash</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="bKash">bKash</option>
                  <option value="Nagad">Nagad</option>
                  <option value="Rocket">Rocket</option>
                  <option value="Insurance/Copay">Insurance/Copay</option>
                </select>
              </div>

              {/* Subtotal & Discount row */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Subtotal</label>
                  <div className="bg-slate-50 px-3 py-2 border border-slate-200 rounded-xl text-slate-700 font-bold font-mono">
                    ৳{subtotal.toFixed(2)}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Discount</label>
                  <div className="flex bg-slate-50 border border-slate-200 rounded-xl overflow-hidden p-0.5">
                    <select
                      value={currentOrder.discountType}
                      onChange={(e) => updateCurrentOrder({ discountType: e.target.value as any, discountValue: 0 })}
                      className="bg-white text-slate-600 font-bold px-1 py-1 text-[10px] rounded focus:outline-none border-none shrink-0"
                    >
                      <option value="Flat">Flat</option>
                      <option value="Percent">%</option>
                    </select>
                    <input
                      type="number"
                      min={0}
                      placeholder="0"
                      value={currentOrder.discountValue || ""}
                      onChange={(e) => updateCurrentOrder({ discountValue: Math.max(0, Number(e.target.value)) })}
                      className="w-full bg-transparent text-slate-700 font-mono text-xs px-2 focus:outline-none border-none"
                    />
                  </div>
                </div>
              </div>

              {/* Total display large format */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/50 flex items-center justify-between">
                <span className="text-xs uppercase font-black text-slate-400 tracking-wider">Total</span>
                <span className="text-2xl font-black text-indigo-600 font-mono">
                  ৳{grandTotal.toFixed(2)}
                </span>
              </div>

              {/* Cash Paid and Change Return calculations */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Cash Paid</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    min={0}
                    value={currentOrder.cashPaid}
                    onChange={(e) => updateCurrentOrder({ cashPaid: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Change Return</label>
                  <div className="bg-slate-50 px-3 py-2 border border-slate-200 rounded-xl text-emerald-600 font-bold font-mono text-xs">
                    ৳{changeReturn.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Action checkout button */}
              <button
                type="button"
                onClick={handleCompleteCheckout}
                disabled={currentOrder.basket.length === 0}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold text-xs py-3 rounded-xl transition-all cursor-pointer text-center shadow-sm"
              >
                Complete Sale
              </button>

            </div>
          </div>
        </div>
      </div>

      {/* Quick Add Customer Modal */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 border border-slate-100">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <UserPlus size={16} className="text-indigo-600" />
                Register New Customer
              </h3>
              <button 
                onClick={() => setShowAddCustomerModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustomerSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Mobile Phone Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 01712345678"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Age</label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    required
                    value={newCustAge}
                    onChange={(e) => setNewCustAge(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Gender</label>
                  <select
                    value={newCustGender}
                    onChange={(e) => setNewCustGender(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all cursor-pointer text-center mt-2 shadow-sm"
              >
                Register & Select Customer
              </button>
            </form>
          </div>
        </div>
      )}

      {/* POS Checkout Success Modal / Receipt Dialog */}
      <AnimatePresence>
        {completedReceipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white text-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-100 flex flex-col"
            >
              <div className="text-center mb-4 space-y-1">
                <div className="mx-auto w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-1">
                  <Check size={20} className="stroke-3" />
                </div>
                <h3 className="text-base font-black uppercase text-slate-900 tracking-wide">Checkout Authorized</h3>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Inventory synced successfully</p>
              </div>

              {/* BDT Digital Receipt */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-xs font-mono space-y-3">
                <div className="flex justify-between border-b border-dashed border-slate-200 pb-2 text-[11px] text-slate-500">
                  <span>REF: {completedReceipt.id}</span>
                  <span>{new Date(completedReceipt.date).toLocaleTimeString()}</span>
                </div>

                <div className="border-b border-dashed border-slate-200 pb-2">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider mb-0.5">Customer Name</span>
                  <span className="font-bold text-slate-800">{completedReceipt.patientName}</span>
                </div>

                <div className="border-b border-dashed border-slate-200 pb-2">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider mb-1">Purchased Products</span>
                  <div className="space-y-1">
                    {completedReceipt.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-slate-700 text-[11px]">
                        <span>{item.quantity}x {item.name}</span>
                        <span>৳{item.total.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-1 text-slate-500">
                  <div className="flex justify-between text-[11px]">
                    <span>Subtotal:</span>
                    <span>৳{completedReceipt.subtotal.toFixed(2)}</span>
                  </div>
                  {completedReceipt.discount > 0 && (
                    <div className="flex justify-between text-emerald-600 text-[11px]">
                      <span>Discounts applied:</span>
                      <span>-৳{completedReceipt.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-dashed border-slate-200 text-sm">
                    <span>Grand Total:</span>
                    <span>৳{completedReceipt.total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="text-[10px] text-center text-slate-400 italic pt-2 border-t border-dashed border-slate-200">
                  Paid via: {completedReceipt.paymentMethod}
                </div>
              </div>

              <button
                onClick={() => setCompletedReceipt(null)}
                className="w-full mt-5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-xl transition-all cursor-pointer text-center"
              >
                Print & Close Terminal
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
