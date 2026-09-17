import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  CalendarDays,
  User,
  Plus,
  ArrowRight,
  Calendar as CalendarIcon,
  Sparkles
} from "lucide-react";
import {
  format,
  parseISO,
  isValid,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  isTomorrow,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  isWithinInterval,
  startOfDay,
  endOfDay
} from "date-fns";
import { serviceApi } from "../../services/serviceApi";
import { PageContainer } from "../../components/common/PageContainer";
import { PageHeader } from "../../components/common/PageHeader";
import { Button } from "../../components/common/Button";
import { LoadingSkeleton } from "../../components/common/LoadingSkeleton";
import { ErrorState } from "../../components/common/ErrorState";
import { EmptyState } from "../../components/common/EmptyState";
import { StatusBadge } from "../../components/common/StatusBadge";
import { formatDate } from "../../utils/formatters";

export const CalendarView = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState("month"); // "month", "week", "day"
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["calendarServices"],
    queryFn: () => serviceApi.getServices()
  });

  const services = useMemo(() => data?.services || [], [data]);

  // Safe Date Parser
  const parseServiceDate = (dateVal) => {
    if (!dateVal) return null;
    let d = typeof dateVal === "string" ? parseISO(dateVal) : dateVal;
    if (!isValid(d)) d = new Date(dateVal);
    return isValid(d) ? d : null;
  };

  // Navigation handlers
  const handlePrev = () => {
    if (viewMode === "month") {
      setCurrentDate((prev) => subMonths(prev, 1));
    } else if (viewMode === "week") {
      setCurrentDate((prev) => subWeeks(prev, 1));
    } else {
      setCurrentDate((prev) => subDays(prev, 1));
    }
    setSelectedDate(null);
  };

  const handleNext = () => {
    if (viewMode === "month") {
      setCurrentDate((prev) => addMonths(prev, 1));
    } else if (viewMode === "week") {
      setCurrentDate((prev) => addWeeks(prev, 1));
    } else {
      setCurrentDate((prev) => addDays(prev, 1));
    }
    setSelectedDate(null);
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  // Current period bounds
  const currentPeriodInterval = useMemo(() => {
    if (viewMode === "month") {
      return {
        start: startOfDay(startOfMonth(currentDate)),
        end: endOfDay(endOfMonth(currentDate))
      };
    } else if (viewMode === "week") {
      return {
        start: startOfDay(startOfWeek(currentDate, { weekStartsOn: 0 })),
        end: endOfDay(endOfWeek(currentDate, { weekStartsOn: 0 }))
      };
    } else {
      return {
        start: startOfDay(currentDate),
        end: endOfDay(currentDate)
      };
    }
  }, [viewMode, currentDate]);

  // Month grid days (always full 7-col weeks covering the month)
  const monthDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentDate]);

  // Week days
  const weekDays = useMemo(() => {
    const wStart = startOfWeek(currentDate, { weekStartsOn: 0 });
    const wEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: wStart, end: wEnd });
  }, [currentDate]);

  // Appointments mapped by Day for quick lookup
  const getServicesForDay = (day) => {
    return services.filter((s) => {
      const sDate = parseServiceDate(s.scheduledDate);
      return sDate && isSameDay(sDate, day);
    });
  };

  // Synchronized appointments for Right Panel
  const panelAppointments = useMemo(() => {
    let list = [];
    if (selectedDate) {
      list = services.filter((s) => {
        const sDate = parseServiceDate(s.scheduledDate);
        return sDate && isSameDay(sDate, selectedDate);
      });
    } else {
      list = services.filter((s) => {
        const sDate = parseServiceDate(s.scheduledDate);
        return (
          sDate &&
          isWithinInterval(sDate, {
            start: currentPeriodInterval.start,
            end: currentPeriodInterval.end
          })
        );
      });
    }

    return [...list].sort((a, b) => {
      const da = parseServiceDate(a.scheduledDate) || 0;
      const db = parseServiceDate(b.scheduledDate) || 0;
      return da - db;
    });
  }, [services, selectedDate, currentPeriodInterval]);

  // Group panel appointments by date
  const groupedPanelAppointments = useMemo(() => {
    const groups = {};
    panelAppointments.forEach((item) => {
      const d = parseServiceDate(item.scheduledDate);
      if (!d) return;
      const key = format(d, "yyyy-MM-dd");
      if (!groups[key]) {
        groups[key] = {
          date: d,
          items: []
        };
      }
      groups[key].items.push(item);
    });
    return Object.values(groups);
  }, [panelAppointments]);

  // Format period title in control bar
  const periodHeaderTitle = useMemo(() => {
    if (viewMode === "month") {
      return format(currentDate, "MMMM yyyy");
    } else if (viewMode === "week") {
      const wStart = startOfWeek(currentDate, { weekStartsOn: 0 });
      const wEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
      if (isSameMonth(wStart, wEnd)) {
        return `${format(wStart, "dd")} – ${format(wEnd, "dd MMMM yyyy")}`;
      }
      return `${format(wStart, "dd MMM")} – ${format(wEnd, "dd MMM yyyy")}`;
    } else {
      return format(currentDate, "EEEE, dd MMMM yyyy");
    }
  }, [viewMode, currentDate]);

  const weekdaysHeader = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <PageContainer>
      <PageHeader
        title="Pest Control Service Schedule"
        description="Interactive calendar view of upcoming, completed and rescheduled treatments"
        actions={
          <Button variant="primary" icon={Plus} onClick={() => navigate("/services/new")}>
            Schedule Service
          </Button>
        }
      />

      {/* Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrev}
              title="Previous period"
              aria-label="Previous period"
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              onClick={handleNext}
              title="Next period"
              aria-label="Next period"
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h3 className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight">
            {periodHeaderTitle}
          </h3>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600 self-end sm:self-auto">
          {["month", "week", "day"].map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => {
                setViewMode(mode);
                setSelectedDate(null);
              }}
              className={`px-3.5 py-1.5 rounded-lg capitalize transition cursor-pointer ${
                viewMode === mode
                  ? "bg-white text-slate-900 shadow-2xs font-bold"
                  : "hover:text-slate-900"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton count={4} type="card" />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : (
        /* TWO-COLUMN CALENDAR WORKSPACE */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: MAIN CALENDAR */}
          <div className="lg:col-span-7 xl:col-span-8 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4 min-w-0">
            {/* MONTH VIEW */}
            {viewMode === "month" && (
              <div className="space-y-2">
                {/* Weekday labels */}
                <div className="grid grid-cols-7 gap-1 text-center border-b border-slate-100 pb-2.5">
                  {weekdaysHeader.map((d) => (
                    <div
                      key={d}
                      className="text-[11px] font-bold text-slate-400 uppercase tracking-wider"
                    >
                      {d}
                    </div>
                  ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-1 sm:gap-1.5 auto-rows-fr">
                  {monthDays.map((day) => {
                    const isCurMonth = isSameMonth(day, currentDate);
                    const dayServices = getServicesForDay(day);
                    const isCurrentDay = isToday(day);
                    const isSelected = selectedDate && isSameDay(day, selectedDate);

                    return (
                      <div
                        key={day.toISOString()}
                        onClick={() => setSelectedDate(isSelected ? null : day)}
                        className={`min-h-[88px] sm:min-h-[102px] p-1.5 sm:p-2 rounded-2xl border transition-all flex flex-col justify-between cursor-pointer select-none ${
                          isSelected
                            ? "border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/40"
                            : isCurrentDay
                            ? "border-blue-200 bg-blue-50/20 hover:border-blue-300"
                            : isCurMonth
                            ? "border-slate-100 bg-white hover:bg-slate-50/80 hover:border-slate-200"
                            : "border-slate-50 bg-slate-50/40 text-slate-300 opacity-60"
                        }`}
                      >
                        {/* Day Number Header */}
                        <div className="flex items-center justify-between">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              isCurrentDay
                                ? "bg-blue-600 text-white shadow-xs"
                                : isSelected
                                ? "bg-slate-900 text-white"
                                : isCurMonth
                                ? "text-slate-800"
                                : "text-slate-400"
                            }`}
                          >
                            {format(day, "d")}
                          </span>

                          {dayServices.length > 0 && (
                            <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600">
                              {dayServices.length}
                            </span>
                          )}
                        </div>

                        {/* Events list for Day */}
                        <div className="space-y-1 mt-1 overflow-hidden">
                          {dayServices.slice(0, 2).map((s) => (
                            <div
                              key={s.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/services/${s.id}`);
                              }}
                              title={`${s.serviceNumber} - ${s.customerName} (${s.serviceType})`}
                              className={`px-1.5 py-0.5 rounded-lg text-[10px] font-semibold truncate transition-colors flex items-center gap-1 cursor-pointer ${
                                s.status === "COMPLETED"
                                  ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100"
                                  : s.status === "RESCHEDULED"
                                  ? "bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-100"
                                  : "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100"
                              }`}
                            >
                              <span className="truncate">
                                {s.serviceNumber} · {s.serviceType}
                              </span>
                            </div>
                          ))}

                          {dayServices.length > 2 && (
                            <p className="text-[9px] font-bold text-slate-500 pl-1">
                              +{dayServices.length - 2} more
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* WEEK VIEW */}
            {viewMode === "week" && (
              <div className="grid grid-cols-1 sm:grid-cols-7 gap-3">
                {weekDays.map((day) => {
                  const dayServices = getServicesForDay(day);
                  const isCurrentDay = isToday(day);
                  const isSelected = selectedDate && isSameDay(day, selectedDate);

                  return (
                    <div
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(isSelected ? null : day)}
                      className={`rounded-2xl border p-3 flex flex-col min-h-[360px] transition-all cursor-pointer ${
                        isSelected
                          ? "border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/30"
                          : isCurrentDay
                          ? "border-blue-200 bg-blue-50/10"
                          : "border-slate-200/80 bg-slate-50/40 hover:bg-slate-50"
                      }`}
                    >
                      {/* Day Column Header */}
                      <div className="text-center pb-2.5 border-b border-slate-200/60 mb-2.5">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                          {format(day, "EEE")}
                        </span>
                        <span
                          className={`w-7 h-7 mx-auto mt-1 rounded-full flex items-center justify-center text-xs font-extrabold ${
                            isCurrentDay
                              ? "bg-blue-600 text-white shadow-xs"
                              : isSelected
                              ? "bg-slate-900 text-white"
                              : "text-slate-800"
                          }`}
                        >
                          {format(day, "d")}
                        </span>
                      </div>

                      {/* Day Appointments */}
                      <div className="space-y-2 flex-1 overflow-y-auto">
                        {dayServices.length === 0 ? (
                          <div className="h-full flex items-center justify-center py-8">
                            <span className="text-[10px] text-slate-400 italic">No services</span>
                          </div>
                        ) : (
                          dayServices.map((s) => (
                            <div
                              key={s.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/services/${s.id}`);
                              }}
                              className="p-2.5 rounded-xl bg-white border border-slate-200/80 hover:border-blue-300 hover:shadow-xs transition space-y-1 block cursor-pointer"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-900">
                                  {s.serviceNumber}
                                </span>
                                <StatusBadge status={s.status} size="sm" />
                              </div>
                              <p className="text-[11px] font-bold text-blue-600 truncate">
                                {s.serviceType}
                              </p>
                              <p className="text-[10px] text-slate-600 truncate">{s.customerName}</p>
                              <p className="text-[10px] font-semibold text-slate-500 flex items-center gap-1 pt-1 border-t border-slate-100">
                                <Clock className="w-3 h-3 text-slate-400" />
                                {formatDate(s.scheduledDate, "hh:mm a")}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* DAY VIEW */}
            {viewMode === "day" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="font-extrabold text-base text-slate-900">
                      {format(currentDate, "EEEE, dd MMMM yyyy")}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium">
                      Daily pest control treatment schedule
                    </p>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                    {getServicesForDay(currentDate).length} scheduled
                  </span>
                </div>

                {getServicesForDay(currentDate).length === 0 ? (
                  <EmptyState
                    title="No service appointments for this day"
                    description="Click Schedule Service to book a new pest control treatment."
                    actionLabel="Schedule Service"
                    onAction={() => navigate("/services/new")}
                  />
                ) : (
                  <div className="space-y-3">
                    {getServicesForDay(currentDate).map((s) => (
                      <Link
                        key={s.id}
                        to={`/services/${s.id}`}
                        className="p-4 rounded-2xl border border-slate-200/80 hover:border-blue-300 hover:shadow-md transition bg-slate-50/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 block"
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-slate-900">
                              {s.serviceNumber}
                            </span>
                            <StatusBadge status={s.status} size="sm" />
                          </div>
                          <h5 className="font-bold text-sm text-blue-600 truncate">{s.serviceType}</h5>
                          <div className="flex items-center gap-4 text-xs text-slate-600 flex-wrap">
                            <span className="font-semibold text-slate-900">
                              Client: {s.customerName}
                            </span>
                            <span className="flex items-center gap-1 text-slate-500">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              {s.propertyAddress}
                            </span>
                          </div>
                        </div>

                        <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                          <span className="flex items-center gap-1.5 text-xs font-bold text-slate-900 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                            <Clock className="w-3.5 h-3.5 text-blue-600" />
                            {formatDate(s.scheduledDate, "hh:mm a")}
                          </span>
                          <span className="text-xs text-blue-600 font-semibold flex items-center gap-1 mt-1 sm:mt-2">
                            View details <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT: SCHEDULED SERVICE APPOINTMENTS PANEL */}
          <div className="lg:col-span-5 xl:col-span-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4 flex flex-col lg:sticky lg:top-6 max-h-[800px]">
            {/* Panel Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-extrabold text-sm text-slate-900 truncate">
                    Scheduled Services
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium truncate">
                    {selectedDate ? (
                      <span className="flex items-center gap-1.5">
                        {format(selectedDate, "dd MMM yyyy")}
                        <button
                          type="button"
                          onClick={() => setSelectedDate(null)}
                          className="text-blue-600 font-bold hover:underline ml-1 cursor-pointer"
                        >
                          (Show all)
                        </button>
                      </span>
                    ) : viewMode === "month" ? (
                      format(currentDate, "MMMM yyyy")
                    ) : viewMode === "week" ? (
                      "Current Week"
                    ) : (
                      format(currentDate, "dd MMMM yyyy")
                    )}
                  </p>
                </div>
              </div>

              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 shrink-0">
                {panelAppointments.length}{" "}
                {panelAppointments.length === 1 ? "appointment" : "appointments"}
              </span>
            </div>

            {/* Scrollable Appointment List */}
            <div className="overflow-y-auto pr-1 space-y-4 flex-1 divide-y divide-slate-100/80">
              {panelAppointments.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
                    <CalendarDays className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-slate-700">No service appointments</p>
                  <p className="text-[11px] text-slate-400 max-w-[200px] mx-auto">
                    {selectedDate
                      ? "No appointments scheduled for the selected date."
                      : "No service appointments scheduled for this period."}
                  </p>
                </div>
              ) : (
                groupedPanelAppointments.map((group) => {
                  const isTodayGroup = isToday(group.date);
                  const isTomorrowGroup = isTomorrow(group.date);

                  return (
                    <div key={group.date.toISOString()} className="pt-3 first:pt-0 space-y-2.5">
                      {/* Date Group Header */}
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                            isTodayGroup
                              ? "bg-blue-600 text-white"
                              : isTomorrowGroup
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {isTodayGroup
                            ? `Today · ${format(group.date, "dd MMM")}`
                            : isTomorrowGroup
                            ? `Tomorrow · ${format(group.date, "dd MMM")}`
                            : format(group.date, "EEEE, dd MMM yyyy")}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {group.items.length} {group.items.length === 1 ? "job" : "jobs"}
                        </span>
                      </div>

                      {/* Appointment Cards */}
                      <div className="space-y-2">
                        {group.items.map((s) => {
                          const customerType =
                            s.customerId?.customerType || s.customerType;
                          const propertySize = s.propertyType;

                          return (
                            <Link
                              key={s.id}
                              to={`/services/${s.id}`}
                              className="p-3.5 rounded-2xl border border-slate-200/80 bg-white hover:border-blue-400 hover:shadow-md transition-all group block space-y-2"
                            >
                              {/* Header row */}
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-extrabold text-xs text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">
                                  {s.serviceNumber}
                                </span>
                                <StatusBadge status={s.status} size="sm" />
                              </div>

                              {/* Service Type & Customer */}
                              <div>
                                <h5 className="font-bold text-xs text-slate-900 leading-snug">
                                  {s.serviceType}
                                </h5>
                                <p className="text-[11px] font-semibold text-slate-600 mt-0.5">
                                  Client:{" "}
                                  <span className="text-slate-900 font-bold">
                                    {s.customerName}
                                  </span>
                                </p>
                              </div>

                              {/* Metadata */}
                              <div className="space-y-1.5 pt-2 text-[11px] text-slate-500 border-t border-slate-100">
                                <div className="flex items-center gap-2 text-slate-700 font-medium">
                                  <CalendarDays className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                  <span>{formatDate(s.scheduledDate, "dd MMM yyyy")}</span>
                                  <span className="text-slate-300">•</span>
                                  <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                  <span>{formatDate(s.scheduledDate, "hh:mm a")}</span>
                                </div>

                                <div className="flex items-center gap-1.5 text-slate-600 truncate">
                                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span className="truncate">{s.propertyAddress}</span>
                                </div>

                                {(customerType || propertySize) && (
                                  <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
                                    {customerType && (
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                                        {customerType}
                                      </span>
                                    )}
                                    {propertySize && (
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
                                        {propertySize}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};
