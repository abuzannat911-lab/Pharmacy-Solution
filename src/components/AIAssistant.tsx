import React, { useState } from "react";
import { Medication, GroundingChunk } from "../types";
import { Sparkles, Loader2, AlertTriangle, CheckCircle, HelpCircle, RefreshCw, Send, Plus, Trash, Globe, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AIAssistantProps {
  medications: Medication[];
}

interface Message {
  role: "user" | "model";
  text: string;
  groundingChunks?: GroundingChunk[];
}

export default function AIAssistant({ medications }: AIAssistantProps) {
  const [activeTab, setActiveTab] = useState<"interactions" | "restock" | "chat">("interactions");

  // TAB 1: Interaction Checker State
  const [selectedMeds, setSelectedMeds] = useState<string[]>([]);
  const [isCheckingInteractions, setIsCheckingInteractions] = useState(false);
  const [interactionResult, setInteractionResult] = useState<{
    hasInteraction: boolean;
    severity: string;
    summary: string;
    details: string;
    recommendations: string;
  } | null>(null);

  // TAB 2: Smart Restock Planner State
  const [isGeneratingRestock, setIsGeneratingRestock] = useState(false);
  const [restockResult, setRestockResult] = useState<{
    recommendations: {
      medicationId: string;
      medicationName: string;
      suggestedQuantity: number;
      priority: string;
      reason: string;
    }[];
    marketInsights: string;
  } | null>(null);

  // TAB 3: Pharmacist Consultation Chat State
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      text: "Hello! I am your clinical pharmacy advisor. Ask me any advanced pharmacology questions, pediatric dosage guidelines, side effects, or generic brand substitutions."
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isSendingChat, setIsSendingChat] = useState(false);

  // Interaction checklist select/deselect
  const handleToggleMed = (medName: string) => {
    if (selectedMeds.includes(medName)) {
      setSelectedMeds(selectedMeds.filter(name => name !== medName));
    } else {
      if (selectedMeds.length >= 5) {
        alert("Select at most 5 medications for checking.");
        return;
      }
      setSelectedMeds([...selectedMeds, medName]);
    }
  };

  const handleCheckInteractions = async () => {
    if (selectedMeds.length < 2) return;
    setIsCheckingInteractions(true);
    setInteractionResult(null);

    try {
      const response = await fetch("/api/gemini/check-interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medications: selectedMeds })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setInteractionResult(data);
    } catch (err) {
      console.error(err);
      alert("Failed to analyze drug interactions. Try again.");
    } finally {
      setIsCheckingInteractions(false);
    }
  };

  // Smart Restock Logic
  const handleGenerateRestock = async () => {
    const lowStockList = medications.filter(m => m.stock <= m.lowStockThreshold);
    if (lowStockList.length === 0) {
      alert("All inventory items are currently fully stocked above threshold limits!");
      return;
    }

    setIsGeneratingRestock(true);
    setRestockResult(null);

    try {
      const response = await fetch("/api/gemini/restock-advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lowStockInventory: lowStockList })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setRestockResult(data);
    } catch (err) {
      console.error(err);
      alert("Failed to consult restock planner. Try again.");
    } finally {
      setIsGeneratingRestock(false);
    }
  };

  // Pharmacist Chat Submit
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isSendingChat) return;

    const userMsg = chatInput;
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setChatInput("");
    setIsSendingChat(true);

    try {
      // Package conversation history
      const history = messages.slice(-6).map(m => ({
        role: m.role,
        content: m.text
      }));

      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, history })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setMessages(prev => [...prev, {
        role: "model",
        text: data.text,
        groundingChunks: data.groundingChunks
      }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        role: "model",
        text: "Apologies, I encountered an issue querying the pharmacology database. Please verify your internet connection and try again."
      }]);
    } finally {
      setIsSendingChat(false);
    }
  };

  return (
    <div className="space-y-6" id="ai-assistant-root">
      {/* Sub tabs selector */}
      <div className="flex border-b border-slate-100">
        <button
          onClick={() => setActiveTab("interactions")}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "interactions"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Drug-to-Drug Interactions
        </button>
        <button
          onClick={() => setActiveTab("restock")}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "restock"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Smart Restock Advice
        </button>
        <button
          onClick={() => setActiveTab("chat")}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "chat"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Pharmacist Clinical Advisor
        </button>
      </div>

      {/* Tabs Content viewports */}
      <div className="min-h-[50vh]">
        {activeTab === "interactions" && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6" id="interactions-view">
            {/* Multi select medication column */}
            <div className="md:col-span-5 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between max-h-[60vh]">
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Interaction Checklist</h4>
                <p className="text-xs text-slate-400 mt-0.5 mb-4">Select 2 to 5 prescription medications below to evaluate concomitant risks.</p>

                <div className="space-y-2 overflow-y-auto max-h-[35vh] pr-1">
                  {medications.map(med => {
                    const isSelected = selectedMeds.includes(med.name);
                    return (
                      <div
                        key={med.id}
                        onClick={() => handleToggleMed(med.name)}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex justify-between items-center ${
                          isSelected 
                            ? "bg-emerald-50/75 border-emerald-200 font-semibold" 
                            : "bg-white border-slate-100 hover:bg-slate-50/40"
                        }`}
                      >
                        <div>
                          <span className="text-slate-800">{med.name}</span>
                          <span className="text-[10px] text-slate-400 block italic">{med.genericName}</span>
                        </div>
                        {isSelected && (
                          <span className="w-4 h-4 bg-emerald-600 rounded-full flex items-center justify-center text-white text-[10px]">✓</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-between items-center mt-4">
                <span className="text-[10px] text-slate-400">Selected: {selectedMeds.length} meds</span>
                <button
                  onClick={handleCheckInteractions}
                  disabled={selectedMeds.length < 2 || isCheckingInteractions}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-4.5 py-1.5 rounded-lg disabled:opacity-45 transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  {isCheckingInteractions ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      <span>Checking...</span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert size={13} />
                      <span>Check Safety</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Results display panel */}
            <div className="md:col-span-7 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center min-h-[400px]">
              {isCheckingInteractions && (
                <div className="text-center py-12 space-y-3">
                  <Loader2 size={36} className="text-emerald-600 animate-spin mx-auto" />
                  <p className="text-xs text-slate-500">Querying clinical pharmacology database & mapping interactions...</p>
                </div>
              )}

              {!isCheckingInteractions && !interactionResult && (
                <div className="text-center text-slate-400 py-12 space-y-2">
                  <ShieldAlert size={44} className="text-slate-300 mx-auto" />
                  <h5 className="font-bold text-slate-700 text-xs">No Safety Evaluation Performed</h5>
                  <p className="text-xs max-w-xs mx-auto leading-normal">Choose multiple medications from the checklist on the left and trigger check to analyze contraindication safety.</p>
                </div>
              )}

              {!isCheckingInteractions && interactionResult && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                    <div className={`p-2.5 rounded-full ${
                      interactionResult.severity === "high" ? "bg-rose-50 text-rose-600" :
                      interactionResult.severity === "moderate" ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                    }`}>
                      {interactionResult.hasInteraction ? <AlertTriangle size={20} /> : <CheckCircle size={20} />}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{interactionResult.summary}</h4>
                      <p className="text-xs text-slate-400">Severity Rating: 
                        <span className={`font-bold uppercase ml-1 ${
                          interactionResult.severity === "high" ? "text-rose-600" :
                          interactionResult.severity === "moderate" ? "text-amber-500" : "text-emerald-600"
                        }`}>{interactionResult.severity}</span>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs leading-relaxed text-slate-600">
                    <div className="space-y-1 p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Pharmacological Details</span>
                      <p className="font-medium text-slate-700">{interactionResult.details}</p>
                    </div>

                    <div className="space-y-1 p-4 bg-emerald-50/20 rounded-xl border border-emerald-100 text-emerald-800">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 block font-bold">Pharmacist Counseling Guidance</span>
                      <p className="font-medium">{interactionResult.recommendations}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Smart Restock View */}
        {activeTab === "restock" && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6" id="restock-view">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h4 className="font-bold text-slate-800 text-base">Supply Chain & Inventory restock advice</h4>
                <p className="text-xs text-slate-400">Generates optimal reorder values based on threshold warnings.</p>
              </div>

              <button
                onClick={handleGenerateRestock}
                disabled={isGeneratingRestock}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2 rounded-xl disabled:opacity-45 transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                {isGeneratingRestock ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Planning...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw size={13} />
                    <span>Compile AI Reorders</span>
                  </>
                )}
              </button>
            </div>

            {/* Restock Results */}
            {isGeneratingRestock && (
              <div className="text-center py-12 space-y-3">
                <Loader2 size={36} className="text-emerald-600 animate-spin mx-auto" />
                <p className="text-xs text-slate-500">Calculating historical depletion rates and drafting procurement advice...</p>
              </div>
            )}

            {!isGeneratingRestock && !restockResult && (
              <div className="py-12 border border-dashed border-slate-200 rounded-2xl text-center text-slate-400 text-xs">
                Click "Compile AI Reorders" to examine current inventory depletions and suggest order items.
              </div>
            )}

            {!isGeneratingRestock && restockResult && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Suggestions List */}
                <div className="lg:col-span-7 space-y-3.5">
                  <h5 className="text-xs font-bold text-slate-800">Draft Purchase Requisitions</h5>
                  <div className="divide-y divide-slate-100 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    {restockResult.recommendations.map((rec, idx) => (
                      <div key={idx} className="py-2.5 flex justify-between items-center text-xs first:pt-0 last:pb-0">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-800">{rec.medicationName}</span>
                          <span className="text-[10px] text-slate-400 block">{rec.reason}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-slate-800">Order Qty: {rec.suggestedQuantity}</span>
                          <span className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded block mt-1 ${
                            rec.priority === "high" ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-700"
                          }`}>{rec.priority} Priority</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Macro Market Guidance */}
                <div className="lg:col-span-5 bg-emerald-50/20 p-5 rounded-2xl border border-emerald-100 flex flex-col justify-between h-fit">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase text-emerald-600 tracking-wider flex items-center gap-1">
                      <Sparkles size={11} />
                      Seasonal supply insights
                    </span>
                    <p className="text-xs leading-relaxed text-emerald-950 font-medium italic">
                      "{restockResult.marketInsights}"
                    </p>
                  </div>
                  <div className="text-[10px] text-emerald-600 font-semibold mt-4">
                    Check seasonal trends routinely to lower shipping costs.
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Pharmacist Chat Console */}
        {activeTab === "chat" && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 h-[65vh] flex flex-col justify-between overflow-hidden" id="chat-view">
            {/* Messages Feed */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-lg p-4 rounded-2xl text-xs leading-relaxed ${
                      msg.role === "user"
                        ? "bg-slate-900 text-white rounded-tr-none"
                        : "bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>

                    {/* Grounding references section */}
                    {msg.groundingChunks && msg.groundingChunks.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-200 text-[10px] text-slate-400 space-y-1 font-semibold">
                        <div className="flex items-center gap-1">
                          <Globe size={11} className="text-emerald-500" />
                          <span>Google Search Grounding sources:</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.groundingChunks.map((chunk, cidx) => (
                            <a
                              key={cidx}
                              href={chunk.web?.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-white hover:bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 truncate text-[10px] text-slate-500 font-medium inline-block max-w-[150px] transition-colors"
                            >
                              {chunk.web?.title || "Reference URL"}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isSendingChat && (
                <div className="flex justify-start">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 rounded-tl-none flex items-center gap-2">
                    <Loader2 size={14} className="text-slate-400 animate-spin" />
                    <span className="text-xs text-slate-400 italic">Clinical advisor is consulting databases...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Chat inputs */}
            <form onSubmit={handleSendChat} className="p-3 border-t border-slate-100 flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask clinical queries (e.g. 'Are Amoxicillin and Spironolactone safe together?')..."
                className="flex-1 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-xs"
              />
              <button
                type="submit"
                disabled={isSendingChat || !chatInput.trim()}
                className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl px-4 py-2 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <Send size={14} />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
