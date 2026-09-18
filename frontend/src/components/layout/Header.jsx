import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  Search,
  User,
  LogOut,
  X,
  Users,
  FileText,
  Receipt,
  Banknote,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { notificationApi } from "../../services/notificationApi";
import { searchRecords, emptySearchResults } from "../../utils/globalSearch";

export const Header = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isDashboard = location.pathname === "/" || location.pathname === "/dashboard";

  const { data: notifData } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationApi.getNotifications(),
    refetchInterval: 60000,
    staleTime: 30000
  });
  const unreadCount = notifData?.unreadCount || 0;

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(emptySearchResults);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const navigate = useNavigate();
  const searchContainerRef = useRef(null);

  useEffect(() => {
    if (!isDashboard) {
      setIsSearchFocused(false);
      setIsMobileSearchOpen(false);
      setSearchQuery("");
      setSearchResults(emptySearchResults);
    }
  }, [location.pathname, isDashboard]);

  const handleSearchSelect = (path) => {
    setSearchQuery("");
    setSearchResults(emptySearchResults);
    setIsSearchFocused(false);
    setIsMobileSearchOpen(false);
    navigate(path);
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(emptySearchResults);
      return;
    }

    let isMounted = true;
    const timer = setTimeout(async () => {
      const res = await searchRecords(searchQuery);
      if (isMounted) {
        setSearchResults(res);
      }
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target)
      ) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasResults =
    searchResults.customers.length > 0 ||
    searchResults.services.length > 0 ||
    searchResults.invoices.length > 0 ||
    searchResults.quotations.length > 0 ||
    searchResults.expenses.length > 0;

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 md:px-6 lg:px-8 print:hidden">
      <div className="h-16 flex items-center justify-between gap-4">
        {/* Left container spacer */}
        <div className="flex items-center gap-3" />

        {/* =========================
            RIGHT SIDE: Search, Notifications, User
        ========================== */}
        <div className="flex items-center gap-3">
          {/* Desktop Search Input & Dropdown — Dashboard Only */}
          {isDashboard && (
            <div className="relative hidden sm:block" ref={searchContainerRef}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                placeholder="Search records..."
                className="
                  w-[220px]
                  lg:w-[280px]
                  h-9
                  pl-9
                  pr-9
                  rounded-xl
                  bg-slate-50
                  border
                  border-slate-200
                  text-sm
                  text-slate-700
                  placeholder:text-slate-400
                  outline-none
                  transition
                  focus:bg-white
                  focus:border-blue-500
                  focus:ring-2
                  focus:ring-blue-500/10
                "
              />

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSearchResults(emptySearchResults);
                  }}
                  className="
                    absolute
                    right-2.5
                    top-1/2
                    -translate-y-1/2
                    text-slate-400
                    hover:text-slate-600
                    cursor-pointer
                  "
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Desktop Inline Search Results Dropdown */}
              {isSearchFocused && searchQuery.trim() && (
                <div
                  className="
                    absolute
                    right-0
                    top-full
                    mt-2
                    w-[360px]
                    max-h-[420px]
                    overflow-y-auto
                    bg-white
                    border
                    border-slate-200
                    rounded-2xl
                    shadow-xl
                    z-50
                    p-2
                  "
                >
                  {/* Customers */}
                  {searchResults.customers.length > 0 && (
                    <SearchSection title="Customers" icon={Users}>
                      {searchResults.customers.map((customer) => (
                        <SearchResult
                          key={customer.id}
                          title={customer.name}
                          subtitle={`${customer.phone || ""} ${
                            customer.company || customer.customerType ? "• " + (customer.company || customer.customerType) : ""
                          }`}
                          onClick={() =>
                            handleSearchSelect(`/customers/${customer.id}`)
                          }
                        />
                      ))}
                    </SearchSection>
                  )}

                  {/* Services */}
                  {searchResults.services.length > 0 && (
                    <SearchSection title="Services" icon={FileText}>
                      {searchResults.services.map((service) => (
                        <SearchResult
                          key={service.id}
                          title={`${service.serviceNumber} - ${service.serviceType}`}
                          subtitle={`Client: ${service.customerName}`}
                          value={service.totalAmount ? `AED ${service.totalAmount}` : null}
                          onClick={() =>
                            handleSearchSelect(`/services/${service.id}`)
                          }
                        />
                      ))}
                    </SearchSection>
                  )}

                  {/* Tax Invoices */}
                  {searchResults.invoices.length > 0 && (
                    <SearchSection title="Tax Invoices" icon={FileText}>
                      {searchResults.invoices.map((invoice) => (
                        <SearchResult
                          key={invoice.id}
                          title={invoice.invoiceNumber}
                          subtitle={invoice.customerName}
                          value={invoice.totalAmount ? `AED ${invoice.totalAmount}` : null}
                          onClick={() =>
                            handleSearchSelect(`/invoices/${invoice.id}`)
                          }
                        />
                      ))}
                    </SearchSection>
                  )}

                  {/* Quotations */}
                  {searchResults.quotations.length > 0 && (
                    <SearchSection title="Quotations" icon={Receipt}>
                      {searchResults.quotations.map((quotation) => (
                        <SearchResult
                          key={quotation.id}
                          title={quotation.quoteNumber}
                          subtitle={`${quotation.customerName || ""} ${
                            quotation.subject ? "• " + quotation.subject : ""
                          }`}
                          value={quotation.grandTotal ? `AED ${quotation.grandTotal}` : null}
                          onClick={() =>
                            handleSearchSelect(`/quotations/${quotation.id}`)
                          }
                        />
                      ))}
                    </SearchSection>
                  )}

                  {/* Expenses */}
                  {searchResults.expenses.length > 0 && (
                    <SearchSection title="Expenses" icon={Banknote}>
                      {searchResults.expenses.map((expense) => (
                        <SearchResult
                          key={expense.id}
                          title={expense.categoryName || "Expense"}
                          subtitle={expense.description}
                          value={expense.amount ? `AED ${expense.amount}` : null}
                          valueClass="text-rose-600"
                          onClick={() => handleSearchSelect("/expenses")}
                        />
                      ))}
                    </SearchSection>
                  )}

                  {/* No results */}
                  {!hasResults && (
                    <div className="py-8 text-center">
                      <Search className="w-6 h-6 mx-auto text-slate-300 mb-2" />
                      <p className="text-sm font-medium text-slate-600">
                        No records found
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Try another customer, invoice, service or quotation.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Mobile Search Icon & Compact Expandable Bar — Dashboard Only */}
          {isDashboard && (
            <div className="sm:hidden relative">
              <button
                type="button"
                onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
                className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition cursor-pointer"
                aria-label="Search"
              >
                {isMobileSearchOpen ? (
                  <X className="w-5 h-5 text-slate-700" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
              </button>
            </div>
          )}

          {/* Notifications Link */}
          <Link
            to="/notifications"
            className="
              relative
              p-2
              rounded-xl
              text-slate-500
              hover:text-slate-800
              hover:bg-slate-100
              transition
            "
            title={unreadCount > 0 ? `${unreadCount} unread notifications` : "Notifications"}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs animate-fade-in">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>

          {/* User Profile Avatar Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsUserMenuOpen((prev) => !prev)}
              className="
                w-9
                h-9
                rounded-xl
                bg-slate-900
                hover:bg-slate-800
                text-white
                flex
                items-center
                justify-center
                text-xs
                font-bold
                transition
                cursor-pointer
              "
            >
              {user?.avatar || "AB"}
            </button>

            {isUserMenuOpen && (
              <div
                className="
                  absolute
                  right-0
                  top-full
                  mt-2
                  w-52
                  bg-white
                  rounded-xl
                  shadow-xl
                  border
                  border-slate-200
                  py-1
                  z-50
                "
              >
                {/* User Info */}
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {user?.name || "Admin User"}
                  </p>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {user?.email || ""}
                  </p>
                </div>

                {/* Profile */}
                <Link
                  to="/profile"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="
                    flex
                    items-center
                    gap-2.5
                    px-4
                    py-2.5
                    text-sm
                    text-slate-700
                    hover:bg-slate-50
                    transition
                  "
                >
                  <User className="w-4 h-4" />
                  Profile & Settings
                </Link>

                {/* Logout */}
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    logout();
                  }}
                  className="
                    w-full
                    flex
                    items-center
                    gap-2.5
                    px-4
                    py-2.5
                    text-sm
                    text-rose-600
                    hover:bg-rose-50
                    transition
                    text-left
                    cursor-pointer
                  "
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Search Bar Dropdown Overlay — Dashboard Only */}
      {isDashboard && isMobileSearchOpen && (
        <div className="sm:hidden border-t border-slate-200 py-2 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search records..."
              className="
                w-full
                h-9
                pl-9
                pr-9
                rounded-xl
                bg-slate-50
                border
                border-slate-200
                text-sm
                text-slate-700
                placeholder:text-slate-400
                outline-none
                focus:bg-white
                focus:border-blue-500
              "
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSearchResults(emptySearchResults);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {searchQuery.trim() && (
            <div className="mt-2 bg-white border border-slate-200 rounded-xl shadow-lg p-2 max-h-[300px] overflow-y-auto">
              {/* Customers */}
              {searchResults.customers.length > 0 && (
                <SearchSection title="Customers" icon={Users}>
                  {searchResults.customers.map((customer) => (
                    <SearchResult
                      key={customer.id}
                      title={customer.name}
                      subtitle={`${customer.phone || ""} ${
                        customer.company || customer.customerType ? "• " + (customer.company || customer.customerType) : ""
                      }`}
                      onClick={() => handleSearchSelect(`/customers/${customer.id}`)}
                    />
                  ))}
                </SearchSection>
              )}

              {/* Services */}
              {searchResults.services.length > 0 && (
                <SearchSection title="Services" icon={FileText}>
                  {searchResults.services.map((service) => (
                    <SearchResult
                      key={service.id}
                      title={`${service.serviceNumber} - ${service.serviceType}`}
                      subtitle={`Client: ${service.customerName}`}
                      value={service.totalAmount ? `AED ${service.totalAmount}` : null}
                      onClick={() => handleSearchSelect(`/services/${service.id}`)}
                    />
                  ))}
                </SearchSection>
              )}

              {/* Tax Invoices */}
              {searchResults.invoices.length > 0 && (
                <SearchSection title="Tax Invoices" icon={FileText}>
                  {searchResults.invoices.map((invoice) => (
                    <SearchResult
                      key={invoice.id}
                      title={invoice.invoiceNumber}
                      subtitle={invoice.customerName}
                      value={invoice.totalAmount ? `AED ${invoice.totalAmount}` : null}
                      onClick={() => handleSearchSelect(`/invoices/${invoice.id}`)}
                    />
                  ))}
                </SearchSection>
              )}

              {/* Quotations */}
              {searchResults.quotations.length > 0 && (
                <SearchSection title="Quotations" icon={Receipt}>
                  {searchResults.quotations.map((quotation) => (
                    <SearchResult
                      key={quotation.id}
                      title={quotation.quoteNumber}
                      subtitle={`${quotation.customerName || ""} ${
                        quotation.subject ? "• " + quotation.subject : ""
                      }`}
                      value={quotation.grandTotal ? `AED ${quotation.grandTotal}` : null}
                      onClick={() => handleSearchSelect(`/quotations/${quotation.id}`)}
                    />
                  ))}
                </SearchSection>
              )}

              {/* Expenses */}
              {searchResults.expenses.length > 0 && (
                <SearchSection title="Expenses" icon={Banknote}>
                  {searchResults.expenses.map((expense) => (
                    <SearchResult
                      key={expense.id}
                      title={expense.categoryName || "Expense"}
                      subtitle={expense.description}
                      value={expense.amount ? `AED ${expense.amount}` : null}
                      valueClass="text-rose-600"
                      onClick={() => handleSearchSelect("/expenses")}
                    />
                  ))}
                </SearchSection>
              )}

              {/* No results */}
              {!hasResults && (
                <div className="py-6 text-center">
                  <Search className="w-5 h-5 mx-auto text-slate-300 mb-1" />
                  <p className="text-xs font-medium text-slate-600">No records found</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </header>
  );
};

const SearchSection = ({ title, icon: Icon, children }) => {
  return (
    <div className="mb-2 last:mb-0">
      <div className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        <Icon className="w-3.5 h-3.5" />
        {title}
      </div>

      <div className="space-y-0.5">{children}</div>
    </div>
  );
};

const SearchResult = ({
  title,
  subtitle,
  value,
  valueClass = "text-slate-900",
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        w-full
        flex
        items-center
        justify-between
        gap-3
        px-3
        py-2
        rounded-xl
        text-left
        hover:bg-slate-50
        transition
        cursor-pointer
      "
    >
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-900 truncate">{title}</p>
        {subtitle && (
          <p className="text-[11px] text-slate-500 truncate mt-0.5">{subtitle}</p>
        )}
      </div>

      {value && (
        <span
          className={`text-[11px] font-semibold whitespace-nowrap ${valueClass}`}
        >
          {value}
        </span>
      )}
    </button>
  );
};