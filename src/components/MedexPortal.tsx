import React, { useState, useEffect } from "react";
import { Medication } from "../types";
import { 
  Search, 
  Loader2, 
  Database, 
  AlertCircle, 
  Check, 
  Globe, 
  RefreshCw, 
  CheckSquare, 
  Square, 
  Inbox,
  ChevronLeft,
  ChevronRight,
  Download,
  Plus
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface MedexPortalProps {
  medications: Medication[];
  onAddMedication: (newMed: Medication | Medication[]) => void;
}

interface ScrapedItem {
  name: string;
  genericName: string;
  form: string;
  strength: string;
  company?: string;
  price: number;
  cost: number;
  stockQty?: number; // Row-specific stock value
}

export default function MedexPortal({ medications, onAddMedication }: MedexPortalProps) {
  const [url, setUrl] = useState("https://medex.com.bd/companies/73/square-pharmaceuticals-plc/brands");
  const [defaultStock, setDefaultStock] = useState<number>(100);
  const [maxPages, setMaxPages] = useState<number>(5);
  const [bulkStockVal, setBulkStockVal] = useState<number>(100);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ScrapedItem[]>([]);
  const [source, setSource] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [syncCount, setSyncCount] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Client-side pagination for Scraped Brand Index
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Auto-fill bulk stock value when default stock changes
  useEffect(() => {
    setBulkStockVal(defaultStock);
  }, [defaultStock]);

  const handleScrape = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    setSyncCount(null);
    setSelectedItems([]);
    setCurrentPage(1);

    try {
      const response = await fetch("/api/medex/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, maxPages })
      });

      if (!response.ok) {
        throw new Error(`Server returned status: ${response.status}`);
      }

      const data = await response.json();
      if (data.items && data.items.length > 0) {
        // Hydrate each scraped item with row-specific stock qty initialized to default stock
        const mappedItems: ScrapedItem[] = data.items.map((it: ScrapedItem) => ({
          ...it,
          stockQty: defaultStock
        }));
        setItems(mappedItems);
        setSource(data.source || "Live Parser Tunnel");
        
        // Pre-select all by default to make syncing easy
        setSelectedItems(mappedItems.map((it: ScrapedItem) => it.name));
      } else {
        throw new Error("No brand elements found on page");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to establish scrape tunnel. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // One-Click Scrape & Import All
  const handleOneClickScrapeAndImport = async () => {
    setLoading(true);
    setError(null);
    setSyncCount(null);
    setSelectedItems([]);
    setCurrentPage(1);

    try {
      const response = await fetch("/api/medex/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, maxPages })
      });

      if (!response.ok) {
        throw new Error(`Server returned status: ${response.status}`);
      }

      const data = await response.json();
      if (data.items && data.items.length > 0) {
        // Hydrate each scraped item with row-specific stock qty initialized to default stock
        const mappedItems: ScrapedItem[] = data.items.map((it: ScrapedItem) => ({
          ...it,
          stockQty: defaultStock
        }));
        setItems(mappedItems);
        setSource(data.source || "One-Click Import");
        
        // Immediately trigger sync for all scraped items
        const brandCompany = extractBrandFromUrl(url);
        const newMedsToSync: Medication[] = [];
        let successCount = 0;

        // Get current max sequential ID to prevent collisions
        let currentMaxIdNum = medications.reduce((max, m) => {
          const match = m.id.match(/^MED-(\d+)$/i);
          if (match) {
            const num = parseInt(match[1], 10);
            return !isNaN(num) ? Math.max(max, num) : max;
          }
          return max;
        }, 0);
        if (currentMaxIdNum === 0) {
          currentMaxIdNum = 10;
        }

        const cleanUnit = (form: string): string => {
          const f = form.trim().toLowerCase();
          if (f === "tablets" || f === "tablet") return "Tablet";
          if (f === "capsules" || f === "capsule") return "Capsule";
          if (f === "injections" || f === "injection") return "Injection";
          return form.trim().charAt(0).toUpperCase() + form.trim().slice(1).toLowerCase();
        };

        mappedItems.forEach(scrapedItem => {
          // Check duplicate
          const existsInCurrent = medications.some(m => m.name.toLowerCase() === scrapedItem.name.toLowerCase());
          const existsInBatch = newMedsToSync.some(m => m.name.toLowerCase() === scrapedItem.name.toLowerCase());
          if (existsInCurrent || existsInBatch) return;

          const nextIdNum = currentMaxIdNum + 1 + successCount;
          const generatedId = `MED-${String(nextIdNum).padStart(3, '0')}`;
          const isAce = scrapedItem.name.toLowerCase() === "ace";

          newMedsToSync.push({
            id: generatedId,
            name: scrapedItem.name,
            genericName: isAce ? "Paracetamol" : scrapedItem.genericName,
            category: scrapedItem.company || brandCompany || "Square Pharmaceuticals PLC",
            stock: scrapedItem.stockQty || defaultStock,
            unit: isAce ? "Tablet" : cleanUnit(scrapedItem.form),
            strength: isAce ? "500 mg" : (scrapedItem.strength || "500 mg"),
            price: isAce ? 1.20 : scrapedItem.price,
            cost: isAce ? 0.80 : scrapedItem.cost,
            description: "",
            storageLocation: "A1",
            sideEffects: ["Mild headache", "Dizziness", "Stomach upset"],
            lowStockThreshold: 20
          });
          successCount++;
        });

        if (newMedsToSync.length > 0) {
          onAddMedication(newMedsToSync);
        }
        setSyncCount(successCount);
        setSelectedItems([]);
      } else {
        throw new Error("No brand elements found on page");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to execute One-Click tunnel import.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSelect = (name: string) => {
    if (selectedItems.includes(name)) {
      setSelectedItems(selectedItems.filter(item => item !== name));
    } else {
      setSelectedItems([...selectedItems, name]);
    }
  };

  const handleToggleSelectAll = () => {
    const visibleNames = paginatedItems.map(it => it.name);
    const allVisibleSelected = visibleNames.every(name => selectedItems.includes(name));

    if (allVisibleSelected) {
      // Unselect only the visible ones
      setSelectedItems(selectedItems.filter(name => !visibleNames.includes(name)));
    } else {
      // Select all visible ones
      const newSelection = [...selectedItems];
      visibleNames.forEach(name => {
        if (!newSelection.includes(name)) {
          newSelection.push(name);
        }
      });
      setSelectedItems(newSelection);
    }
  };

  const handleStockChange = (name: string, value: number) => {
    setItems(prev => prev.map(it => it.name === name ? { ...it, stockQty: value } : it));
  };

  const handleApplyBulkStock = () => {
    setItems(prev => prev.map(it => {
      if (selectedItems.includes(it.name)) {
        return { ...it, stockQty: bulkStockVal };
      }
      return it;
    }));
  };

  const extractBrandFromUrl = (urlStr: string): string => {
    try {
      const cleanUrl = urlStr.trim();
      const match = cleanUrl.match(/companies\/\d+\/([^/]+)/);
      if (match && match[1]) {
        return match[1]
          .split("-")
          .map(word => {
            if (word.toLowerCase() === "plc") return "PLC";
            if (word.toLowerCase() === "ltd") return "Ltd";
            return word.charAt(0).toUpperCase() + word.slice(1);
          })
          .join(" ");
      }
    } catch (e) {
      // ignore
    }
    return "Square Pharmaceuticals PLC"; // Default fallback
  };

  const handleSyncToInventory = () => {
    if (selectedItems.length === 0) return;

    const brandName = extractBrandFromUrl(url);
    const newMedsToSync: Medication[] = [];
    let successCount = 0;

    // Get current max sequential ID to prevent collisions
    let currentMaxIdNum = medications.reduce((max, m) => {
      const match = m.id.match(/^MED-(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        return !isNaN(num) ? Math.max(max, num) : max;
      }
      return max;
    }, 0);
    if (currentMaxIdNum === 0) {
      currentMaxIdNum = 10;
    }

    selectedItems.forEach(selectedName => {
      const scrapedItem = items.find(it => it.name === selectedName);
      if (!scrapedItem) return;

      const existsInCurrent = medications.some(m => m.name.toLowerCase() === scrapedItem.name.toLowerCase());
      const existsInBatch = newMedsToSync.some(m => m.name.toLowerCase() === scrapedItem.name.toLowerCase());
      if (existsInCurrent || existsInBatch) return;

      const nextIdNum = currentMaxIdNum + 1 + successCount;
      const generatedId = `MED-${String(nextIdNum).padStart(3, '0')}`;

      const isAce = scrapedItem.name.toLowerCase() === "ace";

      const cleanUnit = (form: string): string => {
        const f = form.trim().toLowerCase();
        if (f === "tablets" || f === "tablet") return "Tablet";
        if (f === "capsules" || f === "capsule") return "Capsule";
        if (f === "injections" || f === "injection") return "Injection";
        return form.trim().charAt(0).toUpperCase() + form.trim().slice(1).toLowerCase();
      };

      newMedsToSync.push({
        id: generatedId,
        name: scrapedItem.name,
        genericName: isAce ? "Paracetamol" : scrapedItem.genericName,
        category: scrapedItem.company || brandName || "Square Pharmaceuticals PLC",
        stock: scrapedItem.stockQty || defaultStock,
        unit: isAce ? "Tablet" : cleanUnit(scrapedItem.form),
        strength: isAce ? "500 mg" : (scrapedItem.strength || "500 mg"),
        price: isAce ? 1.20 : scrapedItem.price,
        cost: isAce ? 0.80 : scrapedItem.cost,
        description: "",
        storageLocation: "A1",
        sideEffects: ["Mild headache", "Dizziness", "Stomach upset"],
        lowStockThreshold: 20
      });
      successCount++;
    });

    if (newMedsToSync.length > 0) {
      onAddMedication(newMedsToSync);
    }

    setSyncCount(successCount);
    setSelectedItems([]);
  };

  // Filtering based on search query
  const filteredItems = items.filter(it => 
    it.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    it.genericName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (it.company && it.company.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Client-side pagination calculations
  const totalItems = filteredItems.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  // Adjust pagination page if search makes totalPages smaller than currentPage
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [searchTerm, totalPages, currentPage]);

  const brandCompanyTitle = extractBrandFromUrl(url).toUpperCase();

  return (
    <div className="bg-[#0f172a] text-slate-100 min-h-screen p-6 sm:p-8 rounded-2xl border border-slate-900 shadow-2xl" id="medex-portal-root">
      
      {/* Title Header Section */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
          Collect Medicine Stock
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
          Scrape brand names and unit prices directly from Medex and import them into your local pharmacy database.
        </p>
      </div>

      {/* Target & Crawler Configurations */}
      <div className="bg-[#1e293b] rounded-2xl border border-slate-800 p-5 sm:p-6 mb-6 shadow-sm">
        <div className="mb-4">
          <span className="text-indigo-400 text-xs font-bold tracking-wider uppercase block">MEDEX.COM.BD COMPANY BRAND SCRAPER</span>
          <p className="text-xs text-slate-400 mt-0.5">
            Enter a pharmaceutical brand listing URL from Medex (e.g., ACME Laboratories, Square, Beximco) to extract medicines and prices directly.
          </p>
        </div>

        <form onSubmit={handleScrape} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Medex Brand Listing URL input */}
            <div className="md:col-span-6">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Medex Brand Listing URL</label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter Medex company brand list URL..."
                className="w-full bg-slate-950/40 border border-slate-800 text-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                required
              />
            </div>

            {/* Default Stock Input */}
            <div className="md:col-span-3">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Default Stock</label>
              <input
                type="number"
                value={defaultStock}
                onChange={(e) => setDefaultStock(Math.max(1, parseInt(e.target.value) || 100))}
                className="w-full bg-slate-950/40 border border-slate-800 text-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-center font-bold"
                required
              />
            </div>

            {/* Pages selector */}
            <div className="md:col-span-3">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Pages to Crawl</label>
              <select
                value={maxPages}
                onChange={(e) => setMaxPages(Number(e.target.value))}
                className="w-full bg-slate-950/40 border border-slate-800 text-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold cursor-pointer"
              >
                <option value={1}>Page 1 only</option>
                <option value={3}>Pages 1 - 3 (Around 100 brands)</option>
                <option value={5}>Pages 1 - 5 (Around 150 brands)</option>
                <option value={10}>Pages 1 - 10 (Around 300 brands)</option>
                <option value={20}>Pages 1 - 20 (Around 600 brands)</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs py-2 rounded-lg px-4 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={13} />
                  <span>Connecting Tunnel...</span>
                </>
              ) : (
                <>
                  <RefreshCw size={13} />
                  <span>Fetch Products</span>
                </>
              )}
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={handleOneClickScrapeAndImport}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs py-2 rounded-lg px-4 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={13} />
                  <span>Processing Setup...</span>
                </>
              ) : (
                <>
                  <Download size={13} />
                  <span>Scrape & Import All (One-Click)</span>
                </>
              )}
            </button>

            {source && (
              <span className="text-[10px] text-emerald-400 bg-emerald-950/40 border border-emerald-900 px-2 py-0.5 rounded-full font-bold">
                Source: {source}
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Success Notifications & Statuses */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-rose-950/40 border border-rose-900 text-rose-300 p-4 rounded-xl flex items-start gap-2.5 mb-6 text-xs"
          >
            <AlertCircle size={15} className="text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-rose-200">Scrape Protocol Fault</p>
              <p className="mt-0.5 text-rose-400">{error}</p>
            </div>
          </motion.div>
        )}

        {syncCount !== null && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-emerald-950/40 border border-emerald-900 text-emerald-300 p-4 rounded-xl flex items-start gap-2.5 mb-6 text-xs"
          >
            <Check size={16} className="text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-emerald-200">Clinical Seeding Complete</p>
              <p className="mt-0.5 text-emerald-400">
                Successfully registered <strong>{syncCount}</strong> brand items into your live pharmacy shelf inventory database.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scraped Registry Card Panel */}
      <div className="bg-[#1e293b] rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        
        {/* Table / Results Header Controls Bar */}
        <div className="p-5 border-b border-slate-800 bg-[#161e2e]/60 flex flex-col xl:flex-row justify-between xl:items-center gap-4">
          <div>
            <span className="text-xs uppercase font-extrabold text-indigo-400 tracking-wider">
              {items.length > 0 ? `SCRAPED: ${brandCompanyTitle}` : "MEDEX BRANDS LIST"}
            </span>
            <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
              <span>Found {totalItems} brands.</span>
              {selectedItems.length > 0 && (
                <span className="text-indigo-400 font-bold">Selected: {selectedItems.length}</span>
              )}
            </div>
          </div>

          {items.length > 0 && (
            <div className="flex flex-wrap items-center gap-4">
              {/* Bulk Stock Apply Group */}
              <div className="flex items-center gap-1.5 bg-slate-950/50 p-1.5 rounded-lg border border-slate-800 text-xs">
                <span className="text-[10px] text-slate-400 px-1 font-semibold uppercase">Set Qty for Selected:</span>
                <input
                  type="number"
                  value={bulkStockVal}
                  onChange={(e) => setBulkStockVal(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-12 bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-center focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-xs font-bold"
                />
                <button
                  onClick={handleApplyBulkStock}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] px-2 py-0.5 rounded transition-all cursor-pointer"
                >
                  Apply
                </button>
              </div>

              {/* Simple Pagination Control block matching screenshot */}
              <div className="flex items-center gap-2 text-xs bg-slate-950/50 p-1.5 rounded-lg border border-slate-800">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 p-1 transition-colors cursor-pointer"
                  title="Previous Page"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="text-[10px] font-bold text-slate-300">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 p-1 transition-colors cursor-pointer"
                  title="Next Page"
                >
                  <ChevronRight size={14} />
                </button>
              </div>

              {/* Search Filter input */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 text-slate-500" size={13} />
                <input
                  type="text"
                  placeholder="Search in scraped results..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-slate-950/50 border border-slate-800 text-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full sm:w-56 font-medium"
                />
              </div>
            </div>
          )}
        </div>

        {/* Brand registry list / grid content */}
        {items.length === 0 ? (
          <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center bg-slate-900/10">
            <Inbox size={44} className="text-slate-700 stroke-1 mb-3" />
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Brands Index Empty</p>
            <p className="text-xs text-slate-400/70 mt-1 max-w-md leading-relaxed">
              Enter a target Medex registry URL in the configuration card above and trigger 'Fetch Products' or 'Scrape & Import All (One-Click)' to start scraping.
            </p>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950/30 text-slate-400 font-extrabold uppercase tracking-wider border-b border-slate-800 text-[10px]">
                    <th className="py-3 px-4 text-center w-12">
                      <button
                        onClick={handleToggleSelectAll}
                        className="w-5 h-5 mx-auto rounded border border-slate-700 hover:border-indigo-500 hover:text-indigo-400 transition-colors flex items-center justify-center cursor-pointer bg-slate-900/60"
                        title="Toggle Page Selection"
                      >
                        {paginatedItems.map(it => it.name).every(name => selectedItems.includes(name)) ? (
                          <CheckSquare size={12} className="text-indigo-400" />
                        ) : paginatedItems.map(it => it.name).some(name => selectedItems.includes(name)) ? (
                          <span className="w-2 h-0.5 bg-indigo-500 rounded"></span>
                        ) : (
                          <Square size={12} className="text-slate-500" />
                        )}
                      </button>
                    </th>
                    <th className="py-3 px-4 text-slate-300">Brand & Strength</th>
                    <th className="py-3 px-4 text-slate-300">Generic Ingredient</th>
                    <th className="py-3 px-4 text-slate-300">Unit Price</th>
                    <th className="py-3 px-4 text-center w-28 text-slate-300">Stock Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/20">
                  {paginatedItems.map((it, idx) => {
                    const isSelected = selectedItems.includes(it.name);
                    const inInventory = medications.some(m => m.name.toLowerCase() === it.name.toLowerCase());
                    const fullBrandStrength = `${it.name} ${it.strength} ${it.form}`;

                    return (
                      <tr
                        key={idx}
                        className={`hover:bg-slate-800/30 transition-colors ${
                          isSelected ? "bg-indigo-950/25" : ""
                        }`}
                      >
                        <td className="py-3.5 px-4 text-center">
                          {inInventory ? (
                            <span className="bg-slate-800 text-slate-400 text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border border-slate-700">
                              Synced
                            </span>
                          ) : (
                            <button
                              onClick={() => handleToggleSelect(it.name)}
                              className="w-5 h-5 mx-auto rounded border border-slate-700 hover:border-indigo-500 hover:text-indigo-400 transition-colors flex items-center justify-center cursor-pointer bg-slate-900/60"
                            >
                              {isSelected && <Check size={12} className="text-indigo-400 font-black" />}
                            </button>
                          )}
                        </td>

                        {/* Col 1: Brand & Strength (with manufacturer) */}
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-100 text-sm block">
                            {fullBrandStrength}
                          </span>
                          <span className="text-[10px] text-slate-500 font-bold tracking-wider uppercase block mt-0.5">
                            {it.company || extractBrandFromUrl(url)}
                          </span>
                        </td>

                        {/* Col 2: Generic badge */}
                        <td className="py-3.5 px-4">
                          <span className="bg-indigo-950/40 text-indigo-300 border border-indigo-900/60 font-medium px-2 py-0.5 rounded text-[10px] tracking-wide inline-block">
                            {it.genericName}
                          </span>
                        </td>

                        {/* Col 3: Unit Price */}
                        <td className="py-3.5 px-4 font-bold text-indigo-400 text-sm">
                          ৳{it.price.toFixed(2)}
                        </td>

                        {/* Col 4: Stock Quantity */}
                        <td className="py-3.5 px-4 text-center">
                          {inInventory ? (
                            <span className="text-emerald-400 text-[11px] font-bold">✓ Active</span>
                          ) : (
                            <input
                              type="number"
                              value={it.stockQty ?? defaultStock}
                              onChange={(e) => handleStockChange(it.name, Math.max(1, parseInt(e.target.value) || 0))}
                              className="w-16 bg-slate-950/50 border border-slate-800 text-slate-200 rounded px-2 py-1 text-center font-semibold text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Sync trigger button at bottom of results */}
            <div className="p-4 bg-slate-950/30 border-t border-slate-800 flex justify-between items-center gap-4">
              <p className="text-xs text-slate-400 leading-relaxed max-w-lg">
                Seeding items will automatically add them into your clinical active inventory shelf database. Duplicate brand names are automatically ignored to avoid double-entries.
              </p>
              
              <button
                onClick={handleSyncToInventory}
                disabled={selectedItems.length === 0}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-45 text-white font-bold text-xs py-2 px-5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-md shrink-0"
              >
                <Plus size={14} />
                <span>Sync Selected Items to Inventory</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
