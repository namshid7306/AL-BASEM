import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, Users, FileText, Receipt, Banknote } from "lucide-react";
import { MdOutlineCleaningServices } from "react-icons/md";
import { searchApi } from "../../services/searchApi";

export const GlobalSearchModal = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({
    customers: [],
    services: [],
    invoices: [],
    quotations: [],
    expenses: []
  });

  const navigate = useNavigate();

  useEffect(() => {
    if (!query.trim()) {
      setResults({ customers: [], services: [], invoices: [], quotations: [], expenses: [] });
      return;
    }

    let isMounted = true;
    const timer = setTimeout(async () => {
      try {
        const data = await searchApi.search(query.trim());
        if (isMounted) {
          setResults({
            customers: (data?.customers || []).map((c) => ({ ...c, id: c.id || c._id })),
            services: (data?.services || []).map((s) => ({ ...s, id: s.id || s._id })),
            invoices: (data?.invoices || []).map((i) => ({ ...i, id: i.id || i._id })),
            quotations: (data?.quotations || []).map((q) => ({ ...q, id: q.id || q._id })),
            expenses: (data?.expenses || []).map((e) => ({ ...e, id: e.id || e._id }))
          });
        }
      } catch {
        if (isMounted) {
          setResults({ customers: [], services: [], invoices: [], quotations: [], expenses: [] });
        }
      }
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [query]);

  if (!isOpen) return null;

  const handleSelect = (path) => {
    onClose();
    navigate(path);
  };

  const hasResults =
    results.customers.length > 0 ||
    results.services.length > 0 ||
    results.invoices.length > 0 ||
    results.quotations.length > 0 ||
    results.expenses.length > 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-start justify-center p-4 pt-16 sm:pt-24 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden">
        {/* Search input header */}
        <div className="relative flex items-center px-4 border-b border-slate-200">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search customers, services, invoices, quotes, expenses..."
            className="w-full py-4 px-3 text-slate-900 placeholder:text-slate-400 focus:outline-none text-sm font-medium"
          />
          {query && (
            <button onClick={() => setQuery("")} className="p-1 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
          <button onClick={onClose} className="ml-2 text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
            ESC
          </button>
        </div>

        {/* Search Results */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {!query && (
            <p className="text-xs text-slate-400 text-center py-6">Type anything to search across the entire business platform...</p>
          )}

          {query && !hasResults && (
            <p className="text-xs text-slate-500 text-center py-6">No matching records found for "{query}".</p>
          )}

          {results.customers.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase mb-2">
                <Users className="w-3.5 h-3.5" /> Customers
              </div>
              <div className="space-y-1">
                {results.customers.map(c => (
                  <div
                    key={c.id}
                    onClick={() => handleSelect(`/customers/${c.id}`)}
                    className="p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 flex items-center justify-between cursor-pointer transition"
                  >
                    <div>
                      <h5 className="text-xs font-bold text-slate-900">{c.name}</h5>
                      <p className="text-[11px] text-slate-500">{c.phone} • {c.company || c.customerType}</p>
                    </div>
                    <span className="text-[10px] font-semibold text-blue-600">View</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {results.services.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase mb-2">
                <MdOutlineCleaningServices className="w-3.5 h-3.5" /> Services
              </div>
              <div className="space-y-1">
                {results.services.map(s => (
                  <div
                    key={s.id}
                    onClick={() => handleSelect(`/services/${s.id}`)}
                    className="p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 flex items-center justify-between cursor-pointer transition"
                  >
                    <div>
                      <h5 className="text-xs font-bold text-slate-900">{s.serviceNumber} - {s.serviceType}</h5>
                      <p className="text-[11px] text-slate-500">Client: {s.customerName}</p>
                    </div>
                    <span className="text-xs font-semibold text-slate-900">AED {s.totalAmount}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {results.invoices.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase mb-2">
                <FileText className="w-3.5 h-3.5" /> Tax Invoices
              </div>
              <div className="space-y-1">
                {results.invoices.map(i => (
                  <div
                    key={i.id}
                    onClick={() => handleSelect(`/invoices/${i.id}`)}
                    className="p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 flex items-center justify-between cursor-pointer transition"
                  >
                    <div>
                      <h5 className="text-xs font-bold text-slate-900">{i.invoiceNumber}</h5>
                      <p className="text-[11px] text-slate-500">{i.customerName}</p>
                    </div>
                    <span className="text-xs font-semibold text-slate-900">AED {i.totalAmount}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {results.quotations.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase mb-2">
                <Receipt className="w-3.5 h-3.5" /> Quotations
              </div>
              <div className="space-y-1">
                {results.quotations.map(qObj => (
                  <div
                    key={qObj.id}
                    onClick={() => handleSelect(`/quotations/${qObj.id}`)}
                    className="p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 flex items-center justify-between cursor-pointer transition"
                  >
                    <div>
                      <h5 className="text-xs font-bold text-slate-900">{qObj.quoteNumber}</h5>
                      <p className="text-[11px] text-slate-500">{qObj.customerName} • {qObj.subject}</p>
                    </div>
                    <span className="text-xs font-semibold text-slate-900">AED {qObj.grandTotal}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {results.expenses.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase mb-2">
                <Banknote className="w-3.5 h-3.5" /> Expenses
              </div>
              <div className="space-y-1">
                {results.expenses.map(e => (
                  <div
                    key={e.id}
                    onClick={() => handleSelect("/expenses")}
                    className="p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 flex items-center justify-between cursor-pointer transition"
                  >
                    <div>
                      <h5 className="text-xs font-bold text-slate-900">{e.categoryName}</h5>
                      <p className="text-[11px] text-slate-500">{e.description}</p>
                    </div>
                    <span className="text-xs font-semibold text-rose-600">AED {e.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
