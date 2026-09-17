import { Invoice } from "../models/Invoice.js";
import { Payment } from "../models/Payment.js";
import { Expense } from "../models/Expense.js";
import { Service } from "../models/Service.js";
import { Contract } from "../models/Contract.js";
import { roundHalfUp } from "../utils/money.js";

export const dashboardService = {
  getDashboardData: async (period = "month") => {
    // 1. Financial KPIs
    const [invoiceStats, expenseStats, paymentStats] = await Promise.all([
      Invoice.aggregate([
        { $match: { isDeleted: false, status: { $ne: "CANCELLED" } } },
        {
          $group: {
            _id: null,
            totalPaid: { $sum: "$paidAmount" },
            pendingPayments: { $sum: "$balanceAmount" }
          }
        }
      ]),
      Expense.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: null, totalExpenses: { $sum: "$amount" } } }
      ]),
      Payment.aggregate([
        { $match: { isDeleted: false, status: "COMPLETED" } },
        { $group: { _id: null, totalCollected: { $sum: "$amount" } } }
      ])
    ]);

    const totalRevenue = roundHalfUp(paymentStats[0]?.totalCollected || invoiceStats[0]?.totalPaid || 0);
    const totalExpenses = roundHalfUp(expenseStats[0]?.totalExpenses || 0);
    const netProfit = roundHalfUp(totalRevenue - totalExpenses);
    const pendingPayments = roundHalfUp(invoiceStats[0]?.pendingPayments || 0);

    // 2. Operational KPIs
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [servicesToday, completedServices, upcomingServices, activeContracts] = await Promise.all([
      Service.countDocuments({
        isDeleted: false,
        scheduledDate: { $gte: todayStart, $lte: todayEnd }
      }),
      Service.countDocuments({ isDeleted: false, status: "COMPLETED" }),
      Service.countDocuments({ isDeleted: false, status: "UPCOMING" }),
      Contract.countDocuments({ isDeleted: false, status: "ACTIVE" })
    ]);

    // 3. 7-Day Chart Data Aggregation
    const chartDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const chartData = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
      const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);

      const [dayPayments, dayExpenses] = await Promise.all([
        Payment.aggregate([
          { $match: { isDeleted: false, status: "COMPLETED", paymentDate: { $gte: dayStart, $lte: dayEnd } } },
          { $group: { _id: null, total: { $sum: "$amount" } } }
        ]),
        Expense.aggregate([
          { $match: { isDeleted: false, date: { $gte: dayStart, $lte: dayEnd } } },
          { $group: { _id: null, total: { $sum: "$amount" } } }
        ])
      ]);

      chartData.push({
        day: chartDays[dayStart.getDay()],
        revenue: roundHalfUp(dayPayments[0]?.total || 0),
        expense: roundHalfUp(dayExpenses[0]?.total || 0)
      });
    }

    // 4. Recent Activity Feed
    const [latestServices, latestPayments, latestExpenses] = await Promise.all([
      Service.find({ isDeleted: false }).sort({ createdAt: -1 }).limit(3),
      Payment.find({ isDeleted: false }).sort({ paymentDate: -1 }).limit(2),
      Expense.find({ isDeleted: false }).sort({ date: -1 }).limit(2)
    ]);

    const recentActivity = [
      ...latestServices.map((s) => ({
        id: s._id.toString(),
        title: `${s.serviceType} - ${s.customerName}`,
        description: `Property: ${s.propertyAddress}`,
        amount: s.totalAmount,
        status: s.status,
        time: s.createdAt,
        type: "service"
      })),
      ...latestPayments.map((p) => ({
        id: p._id.toString(),
        title: `Payment Received (${p.paymentMethod})`,
        description: `${p.customerName} - Invoice #${p.invoiceNumber}`,
        amount: p.amount,
        status: "Paid",
        time: p.paymentDate,
        type: "payment"
      })),
      ...latestExpenses.map((e) => ({
        id: e._id.toString(),
        title: `Expense Logged: ${e.categoryName}`,
        description: e.description,
        amount: e.amount,
        status: "Expense",
        time: e.date,
        type: "expense"
      }))
    ].sort((a, b) => new Date(b.time) - new Date(a.time));

    return {
      financials: {
        todayRevenue: totalRevenue,
        todayExpenses: totalExpenses,
        netProfit,
        pendingPayments
      },
      operations: {
        servicesToday: servicesToday || latestServices.length,
        completedServices,
        upcomingServices,
        activeContracts
      },
      chartData,
      recentActivity
    };
  }
};
