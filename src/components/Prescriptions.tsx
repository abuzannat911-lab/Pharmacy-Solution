import React, { useState } from "react";
import { Prescription, Medication, Patient } from "../types";
import { Sparkles, Loader2, AlertTriangle, CheckCircle, Clock, Check, Printer, FileText, Send, X, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface PrescriptionsProps {
  prescriptions: Prescription[];
  medications: Medication[];
  patients: Patient[];
  onAddPrescription: (prescription: Prescription) => void;
  onUpdatePrescription: (prescription: Prescription) => void;
  onDispensePrescription: (prescription: Prescription) => void;
}

export default function Prescriptions({
  prescriptions,
  medications,
  patients,
  onAddPrescription,
  onUpdatePrescription,
  onDispensePrescription
}: PrescriptionsProps) {
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [prescriptionText, setPrescriptionText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // New prescription form
  const [formData, setFormData] = useState<Partial<Prescription>>({
    patientId: "",
    doctorName: "",
    medicationId: "",
    dosage: "",
    frequency: "",
    quantity: 30,
    instructions: ""
  });

  const filteredPrescriptions = prescriptions.filter(p => {
    if (filterStatus === "All") return true;
    return p.status === filterStatus;
  });

  // Handle AI analysis
  const handleAiAnalysis = async () => {
    if (!prescriptionText.trim()) return;
    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/gemini/analyze-prescription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: prescriptionText })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);

      // Match Patient
      let matchedPatientId = "";
      if (data.patientName) {
        const found = patients.find(p => p.name.toLowerCase().includes(data.patientName.toLowerCase()));
        if (found) matchedPatientId = found.id;
      }

      // Match Medication
      let matchedMedicationId = "";
      if (data.medicationName) {
        const found = medications.find(m => m.name.toLowerCase().includes(data.medicationName.toLowerCase()));
        if (found) matchedMedicationId = found.id;
      }

      setFormData({
        patientId: matchedPatientId || (patients[0]?.id || ""),
        doctorName: data.doctorName || "Dr. Unspecified",
        medicationId: matchedMedicationId || (medications[0]?.id || ""),
        dosage: data.dosage || "",
        frequency: data.frequency || "",
        quantity: data.quantity || 30,
        instructions: data.instructions || ""
      });
    } catch (err) {
      console.error(err);
      alert("AI analysis failed. Please manually fill the prescription or try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patientId || !formData.medicationId || !formData.dosage || !formData.frequency) {
      alert("Please fill in all required fields.");
      return;
    }

    const patient = patients.find(p => p.id === formData.patientId);
    const med = medications.find(m => m.id === formData.medicationId);

    if (!patient || !med) return;

    const newPrx: Prescription = {
      id: `PRX-${Math.floor(100 + Math.random() * 900)}`,
      patientId: patient.id,
      patientName: patient.name,
      doctorName: formData.doctorName || "Dr. Unknown",
      medicationId: med.id,
      medicationName: med.name,
      dosage: formData.dosage,
      frequency: formData.frequency,
      quantity: Number(formData.quantity) || 30,
      status: "Pending",
      date: new Date().toISOString().split("T")[0],
      instructions: formData.instructions || "",
      isGenericSubstituted: false
    };

    onAddPrescription(newPrx);
    setIsNewModalOpen(false);
    // Reset form
    setFormData({
      patientId: "",
      doctorName: "",
      medicationId: "",
      dosage: "",
      frequency: "",
      quantity: 30,
      instructions: ""
    });
    setPrescriptionText("");
  };

  return (
    <div className="space-y-6" id="prescriptions-root">
      {/* Filters & Actions Bar */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex gap-1.5">
          {["All", "Pending", "Filled", "Dispensed"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                filterStatus === status
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-600"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
        >
          <Sparkles size={14} />
          <span>New Prescription (AI Assisted)</span>
        </button>
      </div>

      {/* Grid of Prescriptions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPrescriptions.length === 0 ? (
          <div className="col-span-full bg-white border border-dashed border-slate-200 py-12 rounded-2xl text-center text-slate-400">
            <FileText className="mx-auto text-slate-300 mb-3" size={44} />
            No prescriptions listed in this status filter.
          </div>
        ) : (
          filteredPrescriptions.map((prx) => {
            const med = medications.find(m => m.id === prx.medicationId);
            const isOutOfStock = med ? med.stock < prx.quantity : true;
            const patient = patients.find(p => p.id === prx.patientId);
            const patientAllergies = patient?.allergiesText || "None";
            const hasAllergyWarning = patientAllergies.toLowerCase().includes(prx.medicationName.toLowerCase()) || 
              (prx.medicationName.toLowerCase() === "amoxicillin" && patientAllergies.toLowerCase().includes("penicillin"));

            return (
              <motion.div
                layout
                key={prx.id}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex flex-col justify-between hover:border-slate-200 transition-colors relative overflow-hidden"
              >
                {/* Status indicator bar on side */}
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                  prx.status === "Dispensed" ? "bg-slate-400" :
                  prx.status === "Filled" ? "bg-sky-500" : "bg-emerald-500"
                }`} />

                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono">{prx.id}</span>
                      <h4 className="font-bold text-slate-800 text-base mt-0.5">{prx.patientName}</h4>
                      <p className="text-xs text-slate-400">Prescribing: {prx.doctorName}</p>
                    </div>

                    <span className={`text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-md ${
                      prx.status === "Dispensed" ? "bg-slate-100 text-slate-600" :
                      prx.status === "Filled" ? "bg-sky-50 text-sky-700" : "bg-emerald-50 text-emerald-700"
                    }`}>
                      {prx.status}
                    </span>
                  </div>

                  {/* Allergy Threat Alert */}
                  {hasAllergyWarning && (
                    <div className="mb-3 px-3 py-2 bg-rose-50 text-rose-700 rounded-xl flex items-start gap-1.5 text-xs font-semibold">
                      <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                      <div>
                        <p className="font-bold">ALLERGY CONTRAINDICATION!</p>
                        <p className="text-[10px] font-normal leading-relaxed">Patient allergies listed: "{patientAllergies}". Screen carefully.</p>
                      </div>
                    </div>
                  )}

                  <div className="bg-slate-50 rounded-xl p-3 space-y-2 text-xs">
                    <div className="flex justify-between font-semibold">
                      <span className="text-slate-800">{prx.medicationName}</span>
                      <span className="font-mono text-slate-500">{prx.dosage}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Frequency:</span>
                      <span className="font-medium text-slate-700">{prx.frequency}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Dispense quantity:</span>
                      <span className="font-medium text-slate-700">{prx.quantity} {med?.unit || "units"}</span>
                    </div>
                    {prx.instructions && (
                      <div className="pt-2 border-t border-slate-100 italic text-slate-400 leading-normal">
                        "{prx.instructions}"
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex justify-between items-center gap-2">
                  <div className="text-[10px] text-slate-400 font-medium">
                    Issued: {prx.date}
                  </div>

                  <div className="flex gap-1.5">
                    {prx.status === "Pending" && (
                      <button
                        onClick={() => onUpdatePrescription({ ...prx, status: "Filled" })}
                        disabled={isOutOfStock}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors ${
                          isOutOfStock 
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                            : "bg-sky-50 hover:bg-sky-100 text-sky-700"
                        }`}
                      >
                        {isOutOfStock ? (
                          <>
                            <AlertTriangle size={12} />
                            <span>Short Stock</span>
                          </>
                        ) : (
                          <>
                            <Check size={12} />
                            <span>Prepare/Fill</span>
                          </>
                        )}
                      </button>
                    )}

                    {prx.status === "Filled" && (
                      <button
                        onClick={() => onDispensePrescription(prx)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                      >
                        <Printer size={12} />
                        <span>Dispense & Bill</span>
                      </button>
                    )}

                    {prx.status === "Dispensed" && (
                      <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                        <CheckCircle size={12} className="text-emerald-500" />
                        Complete
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* AI Assisted New Prescription Modal */}
      <AnimatePresence>
        {isNewModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-xl border border-slate-100 flex flex-col md:flex-row gap-6 max-h-[90vh]"
            >
              {/* Left Column: AI Scribble Scanner */}
              <div className="flex-1 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0 md:pr-6">
                <div>
                  <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-base mb-2">
                    <Sparkles size={18} />
                    <span>AI Prescription Interpreter</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-normal mb-4">
                    Paste raw, unstructured clinical doctor notes, phone call transcripts, or medication summaries. Gemini will securely identify patient details, medication names, dosages, and instructions instantly!
                  </p>

                  <textarea
                    placeholder="Example: \nRx: Jane Doe - Metformin 850mg. Take 2 tablets twice a day for a total of 60 tablets. Special instructions: take with meals morning and night. Prescribed by Dr. Robert Chen."
                    value={prescriptionText}
                    onChange={(e) => setPrescriptionText(e.target.value)}
                    className="w-full h-44 p-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-mono resize-none leading-relaxed"
                  />
                </div>

                <div className="pt-4 flex justify-between items-center">
                  <span className="text-[10px] text-slate-400 max-w-[150px] leading-relaxed">
                    AI does not substitute clinical pharmacist verification.
                  </span>
                  <button
                    type="button"
                    disabled={isAnalyzing || !prescriptionText.trim()}
                    onClick={handleAiAnalysis}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 disabled:opacity-50 transition-all cursor-pointer shadow-sm"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        <span>Extracting...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={13} />
                        <span>Analyze & Autofill</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Right Column: Verification Form */}
              <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between overflow-y-auto max-h-[60vh] md:max-h-full">
                <div className="space-y-3">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-bold text-slate-800 text-base">Prescription Details</h3>
                    <button type="button" onClick={() => setIsNewModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                      <X size={18} />
                    </button>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Patient</label>
                    <select
                      value={formData.patientId}
                      required
                      onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    >
                      <option value="">Select Patient...</option>
                      {patients.map(p => (
                        <option key={p.id} value={p.id}>{p.name} (Age {p.age})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Prescribing Doctor</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Robert Chen"
                      value={formData.doctorName}
                      onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Medication</label>
                      <select
                        value={formData.medicationId}
                        required
                        onChange={(e) => setFormData({ ...formData, medicationId: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      >
                        <option value="">Select medication...</option>
                        {medications.map(m => (
                          <option key={m.id} value={m.id}>{m.name} ({m.strength})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Dosage strength</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 500mg, 1 tablet"
                        value={formData.dosage}
                        onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Frequency</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Twice daily, At bedtime"
                        value={formData.frequency}
                        onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Dispense Qty</label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Clinical Instructions</label>
                    <textarea
                      placeholder="Special pharmacist instructions, e.g. take with water, avoid dairy"
                      value={formData.instructions}
                      onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                      className="w-full h-16 p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex gap-2 justify-end mt-4">
                  <button
                    type="button"
                    onClick={() => setIsNewModalOpen(false)}
                    className="px-3.5 py-1.5 text-slate-600 hover:text-slate-800 text-xs font-semibold hover:bg-slate-50 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4.5 py-1.5 rounded-xl shadow-sm cursor-pointer"
                  >
                    Save Prescription
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
