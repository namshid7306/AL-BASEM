import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, User, Calculator, ChevronDown, Plus, AlertCircle, Building, Phone, Mail, MapPin } from "lucide-react";
import { customerApi } from "../../services/customerApi";
import { serviceApi } from "../../services/serviceApi";
import { useToast } from "../../context/ToastContext";
import { DEFAULT_PROPERTY_SIZES, PAYMENT_METHODS } from "../../constants";
import { calculateVatDetails, formatCurrency } from "../../utils/formatters";
import { PageContainer } from "../../components/common/PageContainer";
import { PageHeader } from "../../components/common/PageHeader";
import { Button } from "../../components/common/Button";
import { Modal } from "../../components/common/Modal";

export const ServiceForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedCustId = searchParams.get("customerId");
  const { addToast } = useToast();

  const [customerId, setCustomerId] = useState(preselectedCustId || "");
  const [errors, setErrors] = useState({});

  // Property Size dropdown & Add Custom Size modal state (Record-only)
  const [isSizeDropdownOpen, setIsSizeDropdownOpen] = useState(false);
  const [isAddCustomSizeModalOpen, setIsAddCustomSizeModalOpen] = useState(false);
  const [customSizeInput, setCustomSizeInput] = useState("");
  const [customSizeError, setCustomSizeError] = useState("");
  const sizeDropdownRef = useRef(null);

  const [serviceType, setServiceType] = useState("General Pest Control");
  const [propertyType, setPropertyType] = useState("1 BHK");
  const [rate, setRate] = useState("0");
  const [discount, setDiscount] = useState("0");
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().slice(0, 16));

  const [paidAmount, setPaidAmount] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [generateInvoice, setGenerateInvoice] = useState(true);
  const [technicianNotes, setTechnicianNotes] = useState("");

  const [loading, setLoading] = useState(false);

  // Helper for controlled numeric text inputs (eliminates leading zeros, supports decimals and empty states)
  const handleNumericChange = (value, setter, errorField) => {
    // Allow empty string so user can clear the field
    if (value === "") {
      setter("");
      if (errorField && errors[errorField]) {
        setErrors((prev) => ({ ...prev, [errorField]: undefined }));
      }
      return;
    }

    // Allow valid numbers / partial decimals (e.g. "12", "12.", "12.5")
    if (!/^\d*\.?\d*$/.test(value)) {
      return;
    }

    let formatted = value;
    // Strip leading zeros when followed by a digit (e.g., "01" -> "1", "013" -> "13", "00" -> "0")
    if (/^0\d+/.test(formatted)) {
      formatted = formatted.replace(/^0+/, "");
      if (formatted === "") formatted = "0";
    }

    setter(formatted);
    if (errorField && errors[errorField]) {
      setErrors((prev) => ({ ...prev, [errorField]: undefined }));
    }
  };

  const { data: customersData, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ["customersSelect"],
    queryFn: () => customerApi.getCustomers()
  });

  const customersList = customersData?.customers || [];
  const selectedCustomer = customersList.find((c) => c.id === customerId);

  // Calculate Subtotal & VAT safely with empty / string fallback
  const numRate = parseFloat(rate) || 0;
  const numDiscount = parseFloat(discount) || 0;
  const subtotal = Math.max(0, numRate - numDiscount);
  const vat = calculateVatDetails(subtotal, 0.05, false);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sizeDropdownRef.current && !sizeDropdownRef.current.contains(event.target)) {
        setIsSizeDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSaveCustomSize = (e) => {
    e.preventDefault();
    const trimmed = customSizeInput.trim();
    if (!trimmed) {
      setCustomSizeError("Property size is required.");
      return;
    }

    if (trimmed.length > 50) {
      setCustomSizeError("Property size must be 50 characters or less.");
      return;
    }

    // Match against default BHK sizes (case-insensitive) to use standard casing if matched
    const matchingDefault = DEFAULT_PROPERTY_SIZES.find(
      (s) => s.toLowerCase() === trimmed.toLowerCase()
    );
    const finalSize = matchingDefault || trimmed;

    setPropertyType(finalSize);
    setIsAddCustomSizeModalOpen(false);
    setCustomSizeInput("");
    setCustomSizeError("");
    addToast(`Property size "${finalSize}" set for this service.`, "success");
  };

  const validateFields = () => {
    const newErrors = {};

    if (!customerId) {
      newErrors.customerId = "Please select a registered customer.";
    } else if (!selectedCustomer?.address || !selectedCustomer.address.trim()) {
      newErrors.customerId = "Customer address is missing. Please update the customer profile before scheduling this service.";
    }

    if (!serviceType || !serviceType.trim()) {
      newErrors.serviceType = "Service type is required.";
    }

    const parsedRate = parseFloat(rate);
    if (rate === "" || isNaN(parsedRate) || parsedRate <= 0) {
      newErrors.rate = "Rate is required and must be greater than 0.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateFields()) {
      if (!selectedCustomer?.address || !selectedCustomer.address.trim()) {
        addToast("Customer address is missing. Please update the customer profile before scheduling this service.", "error");
      } else {
        addToast("Please fill in all required service & customer details.", "error");
      }
      return;
    }

    setLoading(true);
    try {
      const payload = {
        customerId,
        serviceType: serviceType.trim(),
        propertyType: (propertyType || "1 BHK").trim(),
        rate: parseFloat(rate) || 0,
        discount: parseFloat(discount) || 0,
        scheduledDate,
        paidAmount: parseFloat(paidAmount) || 0,
        paymentMethod,
        generateInvoice,
        technicianNotes: technicianNotes.trim()
      };

      const result = await serviceApi.createService(payload);
      addToast(`Service ${result.serviceNumber} created successfully!`, "success");
      navigate("/services");
    } catch (err) {
      addToast(err.message || "Failed to create service", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Schedule New Service"
        description="Book pest control treatments, calculate VAT, and auto-generate tax invoices"
        actions={
          <Button variant="outline" icon={ArrowLeft} onClick={() => navigate("/services")}>
            Back to Services
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form Controls */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Selection Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm md:text-base flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" /> Customer Information
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={Plus}
                onClick={() => navigate("/customers/new")}
                className="text-xs font-bold text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                 Register New Customer
              </Button>
            </div>

            {!isLoadingCustomers && customersList.length === 0 ? (
              <div className="py-6 px-4 text-center rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                    No Registered Customers Found
                  </h4>
                  <p className="text-xs text-amber-700 mt-1 max-w-md mx-auto">
                    AL BASEM follows a customer-first policy. You must register a customer before booking any service.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  icon={Plus}
                  onClick={() => navigate("/customers/new")}
                  className="mx-auto"
                >
                  Register Customer Now
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Select Existing Customer *
                  </label>
                  <select
                    value={customerId}
                    onChange={(e) => {
                      setCustomerId(e.target.value);
                      if (errors.customerId) setErrors((prev) => ({ ...prev, customerId: undefined }));
                    }}
                    className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 cursor-pointer ${
                      errors.customerId
                        ? "border-rose-400 focus:ring-rose-500 bg-rose-50/20"
                        : "border-slate-200 focus:ring-blue-500"
                    }`}
                  >
                    <option value="">-- Choose Customer --</option>
                    {customersList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone}) - {c.customerType}
                      </option>
                    ))}
                  </select>
                  {errors.customerId && (
                    <p className="text-[11px] text-rose-500 font-semibold mt-1">{errors.customerId}</p>
                  )}
                </div>

                {/* Selected Customer Read-Only Summary Card */}
                {selectedCustomer && (
                  <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                        Customer Name
                      </span>
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {selectedCustomer.name}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                        Phone Number
                      </span>
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {selectedCustomer.phone}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                        Email Address
                      </span>
                      <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        {selectedCustomer.email ? (
                          selectedCustomer.email
                        ) : (
                          <span className="text-slate-400 italic font-normal">Not provided</span>
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                        Customer Type
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
                        <Building className="w-3 h-3" />
                        {selectedCustomer.customerType}
                      </span>
                    </div>
                    <div className="sm:col-span-2 border-t border-slate-200/60 pt-2.5 mt-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                        Property Address
                      </span>
                      <span className="font-medium text-slate-700 flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        {selectedCustomer.address}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Treatment Details Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm md:text-base border-b border-slate-100 pb-3">
              Treatment Specifications
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Service Type <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={serviceType}
                  onChange={(e) => {
                    setServiceType(e.target.value);
                    if (errors.serviceType) setErrors((prev) => ({ ...prev, serviceType: undefined }));
                  }}
                  placeholder="Enter service type (e.g. General Pest Control)"
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 ${
                    errors.serviceType
                      ? "border-rose-400 focus:ring-rose-500 bg-rose-50/20"
                      : "border-slate-200 focus:ring-blue-500"
                  }`}
                />
                {errors.serviceType && (
                  <p className="text-[11px] text-rose-500 font-semibold mt-1">{errors.serviceType}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Customer Type <span className="text-slate-400 font-normal lowercase">(from customer profile)</span>
                </label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={selectedCustomer ? selectedCustomer.customerType : "—"}
                  className="w-full px-3.5 py-2.5 bg-slate-100/80 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 cursor-not-allowed select-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="relative" ref={sizeDropdownRef}>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Property Type / Size
                </label>
                <button
                  type="button"
                  onClick={() => setIsSizeDropdownOpen((prev) => !prev)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between text-left transition cursor-pointer"
                >
                  <span className="truncate text-slate-800">{propertyType || "1 BHK"}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ml-1 ${
                      isSizeDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Dropdown Menu */}
                {isSizeDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg z-30 py-1 max-h-64 overflow-y-auto">
                    {/* Default BHK Options */}
                    <div className="py-0.5">
                      {DEFAULT_PROPERTY_SIZES.map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => {
                            setPropertyType(size);
                            setIsSizeDropdownOpen(false);
                          }}
                          className={`w-full px-3.5 py-2 text-xs text-left font-medium transition flex items-center justify-between ${
                            propertyType === size
                              ? "bg-blue-50 text-blue-600 font-bold"
                              : "text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <span>{size}</span>
                          {propertyType === size && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                        </button>
                      ))}

                      {/* Record-only selected custom size */}
                      {propertyType && !DEFAULT_PROPERTY_SIZES.includes(propertyType) && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsSizeDropdownOpen(false);
                          }}
                          className="w-full px-3.5 py-2 text-xs text-left font-bold transition flex items-center justify-between bg-blue-50 text-blue-600"
                        >
                          <span>{propertyType}</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                        </button>
                      )}
                    </div>

                    {/* Action: Add Custom Size */}
                    <div className="border-t border-slate-100 mt-1 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsSizeDropdownOpen(false);
                          setCustomSizeInput("");
                          setCustomSizeError("");
                          setIsAddCustomSizeModalOpen(true);
                        }}
                        className="w-full px-3.5 py-2.5 text-xs text-left font-bold text-blue-600 hover:bg-blue-50/80 transition flex items-center gap-2 group cursor-pointer"
                      >
                        <Plus className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
                        <span>+ Add Custom Size</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Property Address / Location <span className="text-slate-400 font-normal lowercase">(from customer profile)</span>
                </label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={
                    !customerId
                      ? "Select a customer first"
                      : selectedCustomer?.address
                      ? selectedCustomer.address
                      : "Address not available"
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-100/80 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 cursor-not-allowed select-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Rate (AED) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={rate}
                  onChange={(e) => handleNumericChange(e.target.value, setRate, "rate")}
                  placeholder="0"
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 ${
                    errors.rate
                      ? "border-rose-400 focus:ring-rose-500 bg-rose-50/20"
                      : "border-slate-200 focus:ring-blue-500"
                  }`}
                />
                {errors.rate && (
                  <p className="text-[11px] text-rose-500 font-semibold mt-1">{errors.rate}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Discount (AED)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={discount}
                  onChange={(e) => handleNumericChange(e.target.value, setDiscount)}
                  placeholder="0"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Scheduled Date & Time *
              </label>
              <input
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Technician / Special Notes
              </label>
              <textarea
                rows={2}
                value={technicianNotes}
                onChange={(e) => setTechnicianNotes(e.target.value)}
                placeholder="Specific pests identified, chemicals required, access instructions..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Pricing & Payment */}
        <div className="space-y-6">
          <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Calculator className="w-4 h-4 text-blue-400" /> Invoice Calculation
              </h3>
              <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                5% VAT Included
              </span>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex justify-between">
                <span>Subtotal (Net Amount)</span>
                <span className="font-bold text-white">{formatCurrency(vat.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>UAE VAT (5%)</span>
                <span className="font-bold text-white">{formatCurrency(vat.vatAmount)}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-white border-t border-slate-800 pt-3">
                <span>Grand Total</span>
                <span className="text-blue-400">{formatCurrency(vat.total)}</span>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  Immediate Payment Received (AED)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={paidAmount}
                  onChange={(e) => handleNumericChange(e.target.value, setPaidAmount)}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  {PAYMENT_METHODS.map((pm) => (
                    <option key={pm.id} value={pm.name}>
                      {pm.name}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-300 font-semibold cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={generateInvoice}
                  onChange={(e) => setGenerateInvoice(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-blue-500"
                />
                Auto-generate Tax Invoice
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              disabled={!customersList.length}
              className="w-full mt-4"
            >
              Confirm & Book Service
            </Button>
          </div>
        </div>
      </form>

      {/* Add Custom Property Size Modal */}
      <Modal
        isOpen={isAddCustomSizeModalOpen}
        onClose={() => {
          setIsAddCustomSizeModalOpen(false);
          setCustomSizeInput("");
          setCustomSizeError("");
        }}
        title="Add Custom Property Size"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveCustomSize} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Property Size <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={customSizeInput}
              onChange={(e) => {
                setCustomSizeInput(e.target.value);
                if (customSizeError) setCustomSizeError("");
              }}
              placeholder="e.g. Studio, Duplex, 6 BHK, 2000 sq ft"
              autoFocus
              className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 ${
                customSizeError
                  ? "border-rose-400 focus:ring-rose-500 bg-rose-50/20"
                  : "border-slate-200 focus:ring-blue-500"
              }`}
            />
            {customSizeError && (
              <p className="text-[11px] text-rose-500 font-semibold mt-1.5">{customSizeError}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsAddCustomSizeModalOpen(false);
                setCustomSizeInput("");
                setCustomSizeError("");
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
            >
              Add Size
            </Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
};
