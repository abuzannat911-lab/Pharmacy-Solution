import React, { useState } from "react";
import { Patient, Prescription } from "../types";
import { Search, Plus, User, Phone, Mail, FileText, AlertOctagon, History, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface PatientsProps {
  patients: Patient[];
  prescriptions: Prescription[];
  onAddPatient: (patient: Patient) => void;
}

export default function Patients({ patients, prescriptions, onAddPatient }: PatientsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [age, setAge] = useState<number>(30);
  const [gender, setGender] = useState("Female");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [allergiesText, setAllergiesText] = useState("");
  const [notes, setNotes] = useState("");

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.phone.includes(searchQuery)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    const newPatient: Patient = {
      id: `PAT-${Math.floor(100 + Math.random() * 900)}`,
      name,
      age,
      gender,
      phone,
      email: email || "n/a",
      allergiesText: allergiesText || "None reported",
      notes: notes || ""
    };

    onAddPatient(newPatient);
    setIsAddModalOpen(false);

    // Reset Form
    setName("");
    setAge(30);
    setGender("Female");
    setPhone("");
    setEmail("");
    setAllergiesText("");
    setNotes("");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="patients-root">
      {/* Left List Pane */}
      <div className="lg:col-span-5 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-[70vh]">
        <div className="mb-4 space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="text-base font-bold text-slate-800">Clinical Patient Profiles</h4>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Plus size={12} />
              <span>Register Patient</span>
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Search patients by name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-xs"
            />
          </div>
        </div>

        {/* Patients List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 pr-1">
          {filteredPatients.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No patient profiles found.
            </div>
          ) : (
            filteredPatients.map(patient => {
              const allergies = patient.allergiesText || "None";
              const isSevere = allergies.toLowerCase() !== "none" && allergies.toLowerCase() !== "none reported" && allergies.trim() !== "";

              return (
                <div
                  key={patient.id}
                  onClick={() => setSelectedPatient(patient)}
                  className={`p-3 rounded-xl cursor-pointer transition-all flex items-center justify-between mt-1 ${
                    selectedPatient?.id === patient.id 
                      ? "bg-slate-100/75 border border-slate-200" 
                      : "hover:bg-slate-50/70 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center font-bold text-xs uppercase">
                      {patient.name.charAt(0)}
                    </div>
                    <div className="space-y-0.5">
                      <h5 className="font-bold text-slate-800 text-xs">{patient.name}</h5>
                      <p className="text-[10px] text-slate-400">ID: {patient.id} • {patient.gender}, {patient.age}y</p>
                    </div>
                  </div>

                  {isSevere && (
                    <span className="text-[9px] font-bold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded flex items-center gap-0.5 border border-amber-200 shrink-0">
                      <AlertOctagon size={10} />
                      Allergies
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Details Pane */}
      <div className="lg:col-span-7">
        {!selectedPatient ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 h-[70vh] flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <User size={48} className="text-slate-300 mb-2" />
            <h4 className="font-bold text-slate-700 text-sm">No Patient Selected</h4>
            <p className="text-xs max-w-xs mt-1">Select a patient from the list on the left to view clinical allergies, case logs, and fill histories.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 h-[70vh] flex flex-col justify-between overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-700 rounded-full flex items-center justify-center font-bold text-lg uppercase shadow-xs">
                    {selectedPatient.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">{selectedPatient.name}</h3>
                    <p className="text-xs text-slate-400">Profile Reference: {selectedPatient.id}</p>
                  </div>
                </div>

                <div className="text-right text-xs text-slate-500 font-medium">
                  <div>{selectedPatient.gender}, {selectedPatient.age} years old</div>
                </div>
              </div>
            </div>

            {/* Profile Content */}
            <div className="flex-1 p-5 overflow-y-auto space-y-5">
              {/* Stats/Contact */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1">
                    <Phone size={11} />
                    Contact Phone
                  </span>
                  <div className="text-xs font-semibold text-slate-700">{selectedPatient.phone}</div>
                </div>

                <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1">
                    <Mail size={11} />
                    Email Address
                  </span>
                  <div className="text-xs font-semibold text-slate-700 truncate">{selectedPatient.email}</div>
                </div>
              </div>

              {/* Allergies Screen */}
              <div className="space-y-1.5 p-4 rounded-xl border bg-rose-50/40 border-rose-100 text-rose-800">
                <span className="text-[10px] uppercase font-bold tracking-wider text-rose-500 flex items-center gap-1">
                  <AlertOctagon size={12} />
                  Clinical Allergies & Warnings
                </span>
                <p className="text-xs font-semibold">{selectedPatient.allergiesText}</p>
              </div>

              {/* Case Notes */}
              <div className="space-y-1.5 p-4 rounded-xl border bg-slate-50/50 border-slate-100">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1">
                  <FileText size={11} />
                  Special Clinical Case Notes
                </span>
                <p className="text-xs leading-relaxed text-slate-600">
                  {selectedPatient.notes || "No special case directives noted."}
                </p>
              </div>

              {/* System Prescription History */}
              <div className="space-y-3">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1">
                  <History size={11} />
                  Dispensed & Prepared Rx History ({prescriptions.filter(p => p.patientId === selectedPatient.id).length})
                </span>

                <div className="space-y-2">
                  {prescriptions.filter(p => p.patientId === selectedPatient.id).length === 0 ? (
                    <div className="text-xs text-slate-400 italic text-center py-6">
                      No prescriptions logged for this patient profile in this system.
                    </div>
                  ) : (
                    prescriptions
                      .filter(p => p.patientId === selectedPatient.id)
                      .map(prx => (
                        <div key={prx.id} className="p-3 bg-slate-50 rounded-xl flex justify-between items-center text-xs">
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-800">{prx.medicationName}</span>
                            <span className="text-[10px] text-slate-400 block">Dosage: {prx.dosage} • Dr. {prx.doctorName}</span>
                          </div>
                          <span className={`text-[10px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded ${
                            prx.status === "Dispensed" ? "bg-slate-200 text-slate-600" :
                            prx.status === "Filled" ? "bg-sky-100 text-sky-700" : "bg-emerald-100 text-emerald-700"
                          }`}>
                            {prx.status}
                          </span>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Register Patient Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 flex flex-col"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                <h3 className="text-base font-bold text-slate-800">Register New Clinical Patient Profile</h3>
                <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Full Patient Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jane Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Age (Years)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={age}
                      onChange={(e) => setAge(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Non-binary">Non-binary</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Phone Number</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 555-0199"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Email Address</label>
                    <input
                      type="email"
                      placeholder="e.g. name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1 text-rose-600 font-bold">Allergies & Contraindications</label>
                  <input
                    type="text"
                    placeholder="e.g. Penicillin, Sulfa drugs, None reported"
                    value={allergiesText}
                    onChange={(e) => setAllergiesText(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">General Case Notes / History</label>
                  <textarea
                    placeholder="Chronic conditions, insurance notes, preference tags..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full h-16 p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-3.5 py-1.5 text-slate-600 hover:text-slate-800 text-xs font-semibold hover:bg-slate-50 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-1.5 rounded-xl cursor-pointer"
                  >
                    Register Profile
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
