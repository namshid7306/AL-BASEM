import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Bug,
  ShieldCheck,
  Leaf
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const loginSchema = z.object({
  email: z.string().min(1, "Email address is required").email("Please enter a valid email address"),
  password: z.string().min(4, "Password must be at least 4 characters")
});

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  const onSubmit = async (data) => {
    setApiError("");
    setIsSubmitting(true);
    try {
      await login(data);
      navigate("/");
    } catch (err) {
      setApiError(err.message || "Invalid email or password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-[#F0F4F8] selection:bg-[#00B4D8] selection:text-white font-sans">
      {/* ─────────────────────────────────────────────────────────────
          MAIN CENTERED LOGIN CONTAINER (Desktop: ~70vw / ~80vh)
          ───────────────────────────────────────────────────────────── */}
      <div className="w-full max-w-[1120px] min-h-[580px] lg:h-[640px] xl:h-[670px] flex flex-col lg:flex-row bg-white rounded-[26px] shadow-[0_20px_60px_-15px_rgba(5,59,80,0.18)] border border-slate-200/80 overflow-hidden transition-all">
        
        {/* ─────────────────────────────────────────────────────────────
            LEFT HALF — AL BASEM HERO & BRANDING (50% Width)
            ───────────────────────────────────────────────────────────── */}
        <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-8 xl:p-10 overflow-hidden bg-slate-950">
          {/* Background Technician Photo — Clearly Visible */}
          <img
            src="/login-technician.jpg"
            alt="AL BASEM Professional Pest Control Technician"
            className="absolute inset-0 w-full h-full object-cover object-center transform scale-102"
          />

          {/* Moderate Ambient Vignette Overlays (Soft Contrast, Not Dark) */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/70 via-slate-950/25 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-slate-950/35 pointer-events-none" />

          {/* Top Brand Tagline */}
          <div className="relative z-10">
            <p className="text-[11px] xl:text-xs font-semibold tracking-[0.25em] text-white/95 uppercase mb-1">
              Cleaner Spaces
            </p>
            <p className="text-[11px] xl:text-xs font-semibold tracking-[0.25em] text-white/95 uppercase mb-2">
              Healthier Tomorrows
            </p>
            <div className="w-8 h-0.5 bg-[#C41230]" />
          </div>

          {/* Center Main Headline & 4 Clean Line Features */}
          <div className="relative z-10 my-auto py-4">
            <h1 className="text-3xl xl:text-4xl font-extrabold text-white leading-[1.12] tracking-tight mb-7">
              Professional<br />
              <span className="text-[#00B4D8]">Cleaning &</span><br />
              <span className="text-[#00B4D8]">Pest Control</span><br />
              Solutions
            </h1>

            {/* 4 Service Features (Clean Line Icons Directly on Image, No Boxes) */}
            <div className="grid grid-cols-4 gap-2.5 xl:gap-3 max-w-md pt-1 mt-20">
              {/* Feature 1 */}
              <div className="flex flex-col items-center text-center">
                <Sparkles className="w-6 h-6 text-white mb-2 shrink-0 drop-shadow-xs" />
                <span className="text-[10px] xl:text-[11px] font-bold text-white tracking-wider uppercase leading-tight">
                  Cleaning<br />Services
                </span>
              </div>

              {/* Feature 2 */}
              <div className="flex flex-col items-center text-center">
                <Bug className="w-6 h-6 text-white mb-2 shrink-0 drop-shadow-xs" />
                <span className="text-[10px] xl:text-[11px] font-bold text-white tracking-wider uppercase leading-tight">
                  Pest Control<br />Solutions
                </span>
              </div>

              {/* Feature 3 */}
              <div className="flex flex-col items-center text-center">
                <ShieldCheck className="w-6 h-6 text-white mb-2 shrink-0 drop-shadow-xs" />
                <span className="text-[10px] xl:text-[11px] font-bold text-white tracking-wider uppercase leading-tight">
                  Safe &<br />Trusted
                </span>
              </div>

              {/* Feature 4 */}
              <div className="flex flex-col items-center text-center">
                <Leaf className="w-6 h-6 text-white mb-2 shrink-0 drop-shadow-xs" />
                <span className="text-[10px] xl:text-[11px] font-bold text-white tracking-wider uppercase leading-tight">
                  A Healthier<br />Environment
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Brand Partner Line */}
          <div className="relative z-10">
            <div className="w-8 h-0.5 bg-[#C41230] mb-2.5" />
            <p className="text-[10px] xl:text-[11px] font-bold tracking-[0.18em] text-white/90 uppercase">
              AL BASEM &nbsp;|&nbsp; YOUR PARTNER IN A CLEANER, SAFER UAE
            </p>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            RIGHT HALF — LOGIN PORTAL PANEL (50% Width)
            ───────────────────────────────────────────────────────────── */}
        <div className="w-full lg:w-1/2 flex flex-col justify-between items-center p-6 sm:p-7 xl:p-9 relative bg-white overflow-hidden">
          {/* Subtle Organic Background Shapes */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-slate-100/60 via-blue-50/20 to-transparent rounded-bl-full pointer-events-none -z-0" />
          <div className="absolute bottom-0 left-0 w-52 h-52 bg-gradient-to-tr from-slate-50/70 via-transparent to-transparent rounded-tr-full pointer-events-none -z-0" />

          {/* Top Logo Section */}
          <div className="text-center relative z-10 pt-1 shrink-0">
            <img
              src="/al-basem-logo-clean.png"
              alt="AL BASEM CLEANING & PEST CONTROL"
              className="h-20 xl:h-24 w-auto mx-auto object-contain mb-1.5"
            />
            <div className="w-8 h-0.5 bg-[#C41230] mx-auto mb-1.5" />
            <p className="text-[9px] xl:text-[10px] font-bold tracking-[0.22em] text-slate-400 uppercase">
              Clean Spaces. Brighter Tomorrows.
            </p>
          </div>

          {/* Center Form Section */}
          <div className="w-full max-w-[360px] xl:max-w-[390px] mx-auto relative z-10 my-auto py-1">
            {/* Welcome Heading */}
            <div className="text-center mb-2.5 xl:mb-3">
              <h2 className="text-2xl xl:text-3xl font-bold text-[#053B50] tracking-tight mb-0.5">
                Welcome Back
              </h2>
              <p className="text-xs xl:text-sm text-slate-500 font-medium">
                Sign in to access your AL BASEM management system.
              </p>
            </div>

            {/* Stable Error Slot with Reserved Height */}
            <div className="w-full min-h-[44px] mb-2.5 flex items-center justify-center">
              {apiError ? (
                <div className="w-full p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2 font-medium animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span className="leading-tight">{apiError}</span>
                </div>
              ) : null}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              {/* Email Address */}
              <div>
                <div className="relative rounded-xl">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    {...register("email")}
                    placeholder="Email address"
                    className="block w-full pl-10 pr-4 py-2.5 xl:py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#053B50] focus:border-transparent transition shadow-2xs"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-rose-600 font-medium pl-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <div className="relative rounded-xl">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                    placeholder="Password"
                    className="block w-full pl-10 pr-10 py-2.5 xl:py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#053B50] focus:border-transparent transition shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-rose-600 font-medium pl-1">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Full Width Sign In Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-1 py-2.5 xl:py-3 px-6 bg-[#053B50] hover:bg-[#032838] active:bg-[#021c27] text-white font-bold text-sm rounded-xl transition duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span>Signing In...</span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Bottom Skyline Section */}
          <div className="w-full text-center pt-1 pb-1 relative z-10 flex flex-col items-center shrink-0">
            <img
              src="/dubai-skyline.png"
              alt="UAE Skyline"
              className="w-[88%] sm:w-[92%] max-w-[460px] xl:max-w-[500px] h-auto max-h-16 xl:max-h-20 mx-auto object-contain opacity-60 mb-1.5 select-none pointer-events-none"
            />
            <p className="text-[9px] xl:text-[10px] font-bold tracking-[0.22em] text-slate-400 uppercase mb-1.5">
              Serving a Cleaner, Healthier UAE
            </p>
            <div className="w-8 h-0.5 bg-[#C41230] mx-auto" />
          </div>
        </div>

      </div>
    </div>
  );
};
