import React, { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, SlidersHorizontal, X } from "lucide-react";

export const SearchFilterBar = ({
  search,
  onSearchChange,
  placeholder = "Search...",
  filterCount = 0,
  onClearFilters,
  children,
  selectFilter
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef(null);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full max-w-[650px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-10 pr-4 py-2 h-10 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Trigger / Controls */}
        {selectFilter ? (
          <div className="relative w-full sm:w-48 shrink-0">
            {selectFilter}
          </div>
        ) : children ? (
          <div className="relative w-full sm:w-auto shrink-0" ref={popoverRef}>
            <button
              type="button"
              onClick={() => setIsOpen((prev) => !prev)}
              className={`w-full sm:w-auto flex items-center justify-between gap-2.5 px-4 py-2 h-10 border rounded-xl text-xs font-semibold transition cursor-pointer ${
                filterCount > 0
                  ? "bg-blue-50 border-blue-200 text-blue-700 shadow-2xs"
                  : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100/80"
              }`}
            >
              <div className="flex items-center gap-2">
                <SlidersHorizontal className={`w-3.5 h-3.5 ${filterCount > 0 ? "text-blue-600" : "text-slate-400"}`} />
                <span>Filters</span>
                {filterCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-blue-600 text-white text-[10px] font-extrabold">
                    {filterCount}
                  </span>
                )}
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
              />
            </button>

            {/* Floating Filter Popover */}
            {isOpen && (
              <div className="absolute right-0 top-full mt-2 w-full sm:w-80 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-40 space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Filter Options
                  </span>
                  {filterCount > 0 && onClearFilters && (
                    <button
                      type="button"
                      onClick={() => {
                        onClearFilters();
                        setIsOpen(false);
                      }}
                      className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                    >
                      Reset
                    </button>
                  )}
                </div>

                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {children}
                </div>

                {onClearFilters && (
                  <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onClearFilters();
                        setIsOpen(false);
                      }}
                      className="flex-1 py-2 text-center text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                    >
                      Clear Filters
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="flex-1 py-2 text-center text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};
