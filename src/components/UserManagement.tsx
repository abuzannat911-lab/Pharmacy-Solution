import React, { useState } from "react";
import { User } from "../types";
import { Users, Plus, Shield, Mail, Key, Trash2, Check, UserPlus, ToggleLeft, ToggleRight, Edit2, AlertCircle } from "lucide-react";
import { motion } from "motion/react";

interface UserManagementProps {
  users: User[];
  onAddUser: (newUser: User) => void;
  onUpdateUser: (updatedUser: User) => void;
  onDeleteUser: (id: string) => void;
  currentUser: User | null;
  onSwitchUser: (user: User) => void;
}

export default function UserManagement({
  users,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  currentUser,
  onSwitchUser
}: UserManagementProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<User | null>(null);

  // New User Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<'Admin' | 'Pharmacist' | 'Cashier' | 'Manager'>("Cashier");
  const [pin, setPin] = useState("");
  const [status, setStatus] = useState<'Active' | 'Inactive'>("Active");

  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !pin) return;

    const newUser: User = {
      id: `USR-${Math.floor(100 + Math.random() * 900)}`,
      name,
      email,
      role,
      status,
      pin,
      avatarUrl: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 999999)}?w=100&auto=format&fit=crop&q=60`,
      lastActive: new Date().toISOString()
    };

    onAddUser(newUser);
    setShowAddModal(false);
    
    // Reset Form
    setName("");
    setEmail("");
    setRole("Cashier");
    setPin("");
    setStatus("Active");
  };

  const handleToggleStatus = (user: User) => {
    onUpdateUser({
      ...user,
      status: user.status === "Active" ? "Inactive" : "Active"
    });
  };

  const roleColors = {
    Admin: "bg-indigo-50 text-indigo-700 border-indigo-200",
    Pharmacist: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Cashier: "bg-sky-50 text-sky-700 border-sky-200",
    Manager: "bg-amber-50 text-amber-700 border-amber-200"
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-10" id="user-management-root">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-sm mb-6 border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500 rounded-xl text-white shadow-md">
              <Users size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-wider uppercase">User & Role Management</h2>
              <p className="text-xs text-slate-400">Manage pharmacy staff accounts, security PINs, and role permissions</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 self-start md:self-auto"
          >
            <UserPlus size={15} />
            Register Staff User
          </button>
        </div>
      </div>

      {/* active simulator warning */}
      <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex items-center gap-3 mb-6">
        <AlertCircle size={18} className="text-amber-600 shrink-0" />
        <div className="text-xs text-amber-800 leading-relaxed">
          <span className="font-bold">Active User Simulation:</span> Click any user's 
          <strong className="mx-1 px-1 py-0.5 bg-amber-100 rounded text-amber-900">Switch Session</strong> 
          button below to login as them instantly. This controls POS actions, scraper access, and module logs.
        </div>
      </div>

      {/* Main Staff Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((u) => {
          const isActiveSession = currentUser?.id === u.id;
          return (
            <div 
              key={u.id} 
              className={`bg-white rounded-2xl border transition-all p-5 flex flex-col justify-between ${
                isActiveSession 
                  ? "border-indigo-500 ring-2 ring-indigo-500/10 shadow-md scale-[1.01]" 
                  : "border-slate-100 hover:border-slate-200 shadow-xs"
              }`}
            >
              <div>
                {/* User Header */}
                <div className="flex justify-between items-start gap-3">
                  <div className="flex items-center gap-3">
                    <img 
                      src={u.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"} 
                      alt={u.name} 
                      className="w-12 h-12 rounded-full object-cover border border-slate-100"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{u.name}</h4>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{u.id}</p>
                    </div>
                  </div>

                  <span className={`text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full border ${roleColors[u.role] || "bg-slate-50 text-slate-700"}`}>
                    {u.role}
                  </span>
                </div>

                {/* Info List */}
                <div className="mt-5 space-y-2.5 text-xs text-slate-600 border-t border-slate-50 pt-4">
                  <div className="flex items-center gap-2">
                    <Mail size={13} className="text-slate-400" />
                    <span className="truncate">{u.email}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Key size={13} className="text-slate-400" />
                      <span>Security PIN: <strong className="font-mono text-slate-800">{u.pin}</strong></span>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-400">Status:</span>
                      <button 
                        onClick={() => handleToggleStatus(u)}
                        className="text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
                        title={u.status === "Active" ? "Set Inactive" : "Set Active"}
                      >
                        {u.status === "Active" ? (
                          <span className="text-emerald-600 font-bold text-[10px] flex items-center gap-0.5">
                            <ToggleRight size={16} /> Active
                          </span>
                        ) : (
                          <span className="text-slate-400 font-bold text-[10px] flex items-center gap-0.5">
                            <ToggleLeft size={16} /> Inactive
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => onSwitchUser(u)}
                  disabled={u.status !== "Active"}
                  className={`flex-1 font-bold text-xs py-2 rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                    isActiveSession
                      ? "bg-indigo-50 text-indigo-700 border border-indigo-200 font-black"
                      : "bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-30 disabled:hover:bg-slate-900"
                  }`}
                >
                  {isActiveSession ? (
                    <>
                      <Check size={14} />
                      Current Session
                    </>
                  ) : (
                    <>
                      <Shield size={13} />
                      Switch Session
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    if (confirm(`Are you sure you want to remove ${u.name}?`)) {
                      onDeleteUser(u.id);
                    }
                  }}
                  disabled={users.length <= 1 || isActiveSession}
                  className="p-2 border border-slate-100 hover:border-rose-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer disabled:opacity-35"
                  title="Delete staff account"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Staff Registration Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-100">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <UserPlus size={16} className="text-indigo-600" />
                Register Staff Member
              </h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitAdd} className="space-y-4">
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Khan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. rahul@pharmacy.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Role Permission</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Pharmacist">Pharmacist</option>
                    <option value="Cashier">Cashier</option>
                    <option value="Manager">Manager</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Access PIN (4 Digits)</label>
                  <input
                    type="password"
                    pattern="[0-9]{4}"
                    required
                    placeholder="e.g. 1234"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono tracking-widest text-center"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Account Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all cursor-pointer text-center shadow-sm mt-2"
              >
                Create Staff Account
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
