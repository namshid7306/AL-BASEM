import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, User, Phone, Mail, MapPin, ChevronDown, Plus } from "lucide-react";
import { customerApi } from "../../services/customerApi";
import { useToast } from "../../context/ToastContext";
import { BUILTIN_PROPERTY_TYPES } from "../../constants";
import { PageContainer } from "../../components/common/PageContainer";
import { PageHeader } from "../../components/common/PageHeader";
import { Button } from "../../components/common/Button";
import { Modal } from "../../components/common/Modal";
import { LoadingSkeleton } from "../../components/common/LoadingSkeleton";
import { ErrorState } from "../../components/common/ErrorState";

const customerSchema = z.object({
  name: z.string().trim().min(2, "Customer name is required and must be at least 2 characters"),
  phone: z.string().trim().min(7, "Valid phone number is required (at least 7 digits)"),
  email: z
    .string()
    .trim()
    .email("Invalid email format (e.g. client@domain.ae)")
    .or(z.literal(""))
    .optional(),
  customerType: z.string().trim().min(1, "Customer type is required"),
  address: z.string().trim().min(5, "Property address is required (at least 5 characters)")
});

export const CustomerForm = () => {
  const { customerId } = useParams();
  const isEdit = !!customerId;
  const navigate = useNavigate();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [fetchingCustomer, setFetchingCustomer] = useState(isEdit);
  const [fetchError, setFetchError] = useState(false);

  // Custom Type Dropdown & Modal State
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [isAddCustomModalOpen, setIsAddCustomModalOpen] = useState(false);
  const [customTypeInput, setCustomTypeInput] = useState("");
  const [customTypeError, setCustomTypeError] = useState("");
  const typeDropdownRef = useRef(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      phone: "+971 ",
      email: "",
      customerType: "Villa",
      address: ""
    }
  });

  const selectedCustomerType = watch("customerType");

  useEffect(() => {
    if (isEdit) {
      setFetchingCustomer(true);
      setFetchError(false);
      customerApi
        .getCustomerById(customerId)
        .then((res) => {
          if (res.customer) {
            reset({
              name: res.customer.name || "",
              phone: res.customer.phone || "",
              email: res.customer.email || "",
              customerType: res.customer.customerType || "Villa",
              address: res.customer.address || ""
            });
          } else {
            setFetchError(true);
          }
        })
        .catch(() => {
          setFetchError(true);
          addToast("Failed to load customer data", "error");
        })
        .finally(() => setFetchingCustomer(false));
    }
  }, [isEdit, customerId, reset, addToast]);

  // Click outside to close type dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target)) {
        setIsTypeDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSaveCustomType = (e) => {
    e.preventDefault();
    const trimmed = customTypeInput.trim();
    if (!trimmed) {
      setCustomTypeError("Custom type is required.");
      return;
    }

    if (trimmed.length < 2) {
      setCustomTypeError("Custom type must be at least 2 characters.");
      return;
    }

    if (trimmed.length > 50) {
      setCustomTypeError("Custom type must be 50 characters or less.");
      return;
    }

    const matchingBuiltIn = BUILTIN_PROPERTY_TYPES.find(
      (t) => t.toLowerCase() === trimmed.toLowerCase()
    );
    const finalType = matchingBuiltIn || trimmed;

    setValue("customerType", finalType, { shouldValidate: true });
    setIsAddCustomModalOpen(false);
    setCustomTypeInput("");
    setCustomTypeError("");
    addToast(`Custom type "${finalType}" selected.`, "success");
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = {
        name: data.name.trim(),
        phone: data.phone.trim(),
        email: data.email ? data.email.trim().toLowerCase() : "",
        customerType: data.customerType.trim(),
        address: data.address.trim()
      };

      if (isEdit) {
        await customerApi.updateCustomer(customerId, payload);
        await queryClient.invalidateQueries({ queryKey: ["customers"] });
        await queryClient.invalidateQueries({ queryKey: ["customer", customerId] });
        await queryClient.invalidateQueries({ queryKey: ["customersSelect"] });
        addToast("Customer updated successfully", "success");
        navigate(`/customers/${customerId}`);
      } else {
        await customerApi.createCustomer(payload);
        await queryClient.invalidateQueries({ queryKey: ["customers"] });
        await queryClient.invalidateQueries({ queryKey: ["customersSelect"] });
        addToast("New customer created successfully", "success");
        navigate("/customers");
      }
    } catch (err) {
      addToast(err.message || "Failed to save customer", "error");
    } finally {
      setLoading(false);
    }
  };

  if (isEdit && fetchingCustomer) {
    return (
      <PageContainer>
        <PageHeader
          title="Edit Customer"
          description="Update customer profile information"
          actions={
            <Button variant="outline" icon={ArrowLeft} onClick={() => navigate("/customers")}>
              Back to Customers
            </Button>
          }
        />
        <LoadingSkeleton count={3} type="card" />
      </PageContainer>
    );
  }

  if (isEdit && fetchError) {
    return (
      <PageContainer>
        <PageHeader
          title="Edit Customer"
          description="Update customer profile information"
          actions={
            <Button variant="outline" icon={ArrowLeft} onClick={() => navigate("/customers")}>
              Back to Customers
            </Button>
          }
        />
        <ErrorState message="Customer not found." onRetry={() => navigate("/customers")} actionLabel="Back to Customers" />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={isEdit ? "Edit Customer" : "Add New Customer"}
        description={
          isEdit
            ? "Update customer profile information"
            : "Register residential villas, apartments or commercial entities in Dubai"
        }
        actions={
          <Button
            variant="outline"
            icon={ArrowLeft}
            onClick={() => navigate(isEdit ? `/customers/${customerId}` : "/customers")}
          >
            {isEdit ? "Back" : "Cancel"}
          </Button>
        }
      />

      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-xs max-w-2xl mx-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Full Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  {...register("name")}
                  placeholder="e.g. Ahmed Al Maktoum"
                  className={`w-full pl-10 pr-3 py-2.5 bg-slate-50 border rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 ${
                    errors.name
                      ? "border-rose-400 focus:ring-rose-500 bg-rose-50/20"
                      : "border-slate-200 focus:ring-blue-500"
                  }`}
                />
              </div>
              {errors.name && <p className="text-[11px] text-rose-600 font-medium mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Phone Number *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  {...register("phone")}
                  placeholder="+971 50 123 4567"
                  className={`w-full pl-10 pr-3 py-2.5 bg-slate-50 border rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 ${
                    errors.phone
                      ? "border-rose-400 focus:ring-rose-500 bg-rose-50/20"
                      : "border-slate-200 focus:ring-blue-500"
                  }`}
                />
              </div>
              {errors.phone && <p className="text-[11px] text-rose-600 font-medium mt-1">{errors.phone.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  {...register("email")}
                  placeholder="client@domain.ae (optional)"
                  className={`w-full pl-10 pr-3 py-2.5 bg-slate-50 border rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 ${
                    errors.email
                      ? "border-rose-400 focus:ring-rose-500 bg-rose-50/20"
                      : "border-slate-200 focus:ring-blue-500"
                  }`}
                />
              </div>
              {errors.email && <p className="text-[11px] text-rose-600 font-medium mt-1">{errors.email.message}</p>}
            </div>

            <div className="relative" ref={typeDropdownRef}>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Customer Type *
              </label>
              <button
                type="button"
                onClick={() => setIsTypeDropdownOpen((prev) => !prev)}
                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 flex items-center justify-between text-left transition ${
                  errors.customerType
                    ? "border-rose-400 focus:ring-rose-500 bg-rose-50/20 text-slate-900"
                    : "border-slate-200 focus:ring-blue-500 text-slate-800"
                }`}
              >
                <span className="truncate">{selectedCustomerType || "Select Customer Type"}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ml-1 ${
                    isTypeDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {errors.customerType && (
                <p className="text-[11px] text-rose-600 font-medium mt-1">{errors.customerType.message}</p>
              )}

              {/* Dropdown Menu */}
              {isTypeDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg z-30 py-1 max-h-64 overflow-y-auto">
                  {/* Standard 7 Property Types */}
                  <div className="py-0.5">
                    {BUILTIN_PROPERTY_TYPES.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          setValue("customerType", type, { shouldValidate: true });
                          setIsTypeDropdownOpen(false);
                        }}
                        className={`w-full px-3.5 py-2 text-xs text-left font-medium transition flex items-center justify-between ${
                          selectedCustomerType === type
                            ? "bg-blue-50 text-blue-600 font-bold"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span>{type}</span>
                        {selectedCustomerType === type && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                      </button>
                    ))}

                    {/* Record-only custom type if selected and not in built-in list */}
                    {selectedCustomerType && !BUILTIN_PROPERTY_TYPES.includes(selectedCustomerType) && (
                      <button
                        type="button"
                        onClick={() => setIsTypeDropdownOpen(false)}
                        className="w-full px-3.5 py-2 text-xs text-left font-bold transition flex items-center justify-between bg-blue-50 text-blue-600"
                      >
                        <span>{selectedCustomerType}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                      </button>
                    )}
                  </div>

                  {/* Action: Add Custom Type */}
                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsTypeDropdownOpen(false);
                        setCustomTypeInput("");
                        setCustomTypeError("");
                        setIsAddCustomModalOpen(true);
                      }}
                      className="w-full px-3.5 py-2.5 text-xs text-left font-bold text-blue-600 hover:bg-blue-50/80 transition flex items-center gap-2 group cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
                      <span>+ Add Custom Type</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Property Address / Emirate *
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <textarea
                rows={3}
                {...register("address")}
                placeholder="Villa 45, Al Wasl Road, Jumeirah 2, Dubai, UAE"
                className={`w-full pl-10 pr-3 py-2.5 bg-slate-50 border rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 ${
                  errors.address
                    ? "border-rose-400 focus:ring-rose-500 bg-rose-50/20"
                    : "border-slate-200 focus:ring-blue-500"
                }`}
              />
            </div>
            {errors.address && <p className="text-[11px] text-rose-600 font-medium mt-1">{errors.address.message}</p>}
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <Button
              variant="outline"
              type="button"
              onClick={() => navigate(isEdit ? `/customers/${customerId}` : "/customers")}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={loading}>
              {isEdit ? "Save Changes" : "Create Customer"}
            </Button>
          </div>
        </form>
      </div>

      {/* Add Custom Type Modal */}
      <Modal
        isOpen={isAddCustomModalOpen}
        onClose={() => {
          setIsAddCustomModalOpen(false);
          setCustomTypeInput("");
          setCustomTypeError("");
        }}
        title="Add Custom Customer Type"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveCustomType} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Custom Customer Type <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={customTypeInput}
              onChange={(e) => {
                setCustomTypeInput(e.target.value);
                if (customTypeError) setCustomTypeError("");
              }}
              placeholder="e.g. IT Company, Embassy, Sports Club"
              autoFocus
              className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 ${
                customTypeError
                  ? "border-rose-400 focus:ring-rose-500 bg-rose-50/20"
                  : "border-slate-200 focus:ring-blue-500"
              }`}
            />
            {customTypeError && (
              <p className="text-[11px] text-rose-500 font-semibold mt-1.5">{customTypeError}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsAddCustomModalOpen(false);
                setCustomTypeInput("");
                setCustomTypeError("");
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Add Type
            </Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
};
