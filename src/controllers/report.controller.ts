import { Request, Response } from "express";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { db } from "../lib/db";
import { transactions } from "../models/transaction.model";
import { financialProfiles } from "../models/financial-profile.model";
import { budgets } from "../models/budget.model";
import { IReqUser } from "../utils/interface";

const getMonthRange = (month: number, year: number) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);
  return { startDate, endDate };
};

const toNumber = (value: any): number => {
  if (!value) return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

const getMonthlyReport = async (req: Request, res: Response) => {
  /*
    #swagger.tags = ['Reports']
    #swagger.security = [{
      "bearerAuth": []
    }]
  */
  try {
    const userId = (req as IReqUser).user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const month = Number(req.query.month) || new Date().getMonth() + 1;
    const year = Number(req.query.year) || new Date().getFullYear();

    const { startDate, endDate } = getMonthRange(month, year);

    // Get all transactions for the month
    const monthlyTxs = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId as string),
          gte(transactions.transactionDate, startDate),
          lte(transactions.transactionDate, endDate)
        )
      )
      .orderBy(desc(transactions.transactionDate));

    let monthlyIncome = 0;
    let monthlyExpense = 0;
    const expenseByCategory: Record<string, number> = {};

    monthlyTxs.forEach((tx) => {
      const amount = toNumber(tx.amount);
      if (tx.type === "income") {
        monthlyIncome += amount;
      } else if (tx.type === "expense") {
        monthlyExpense += amount;
        const cat = tx.category || "Uncategorized";
        if (!expenseByCategory[cat]) {
          expenseByCategory[cat] = 0;
        }
        expenseByCategory[cat] += amount;
      }
    });

    const balance = monthlyIncome - monthlyExpense;

    // Category Breakdown & Top Spending
    const categoryBreakdown = Object.keys(expenseByCategory).map((cat) => ({
      category: cat,
      total: expenseByCategory[cat],
    }));

    let topSpendingCategory = null;
    if (categoryBreakdown.length > 0) {
      categoryBreakdown.sort((a, b) => b.total - a.total);
      topSpendingCategory = categoryBreakdown[0];
    }

    // Recent Transactions
    const recentTransactions = monthlyTxs.slice(0, 5);

    // Get Profile
    const [profile] = await db
      .select()
      .from(financialProfiles)
      .where(eq(financialProfiles.userId, userId as string));

    const profileData = profile
      ? {
          monthlyIncome: toNumber(profile.monthlyIncome),
          savingsTarget: toNumber(profile.savingsTarget),
          totalSavings: toNumber(profile.totalSavings),
          financialGoal: profile.financialGoal,
        }
      : {};

    // Get Budgets
    const userBudgets = await db
      .select()
      .from(budgets)
      .where(
        and(
          eq(budgets.userId, userId as string),
          eq(budgets.month, month),
          eq(budgets.year, year)
        )
      );

    const budgetStatus = userBudgets.map((b) => {
      const limitAmount = toNumber(b.limitAmount);
      const usedAmount = expenseByCategory[b.category] || 0;
      const remainingAmount = limitAmount - usedAmount;
      const percentage = limitAmount > 0 ? (usedAmount / limitAmount) * 100 : 0;

      let status = "safe";
      if (percentage >= 100) {
        status = "overbudget";
      } else if (percentage >= 80) {
        status = "warning";
      }

      return {
        category: b.category,
        limitAmount,
        usedAmount,
        remainingAmount,
        percentage: Number(percentage.toFixed(2)),
        status,
      };
    });

    const summary: any = {
      monthlyIncome,
      monthlyExpense,
      balance,
    };

    if (profile && toNumber(profile.monthlyIncome) > 0) {
      summary.profileMonthlyIncome = toNumber(profile.monthlyIncome);
    }

    return res.status(200).json({
      message: "Berhasil mengambil laporan bulanan.",
      data: {
        month,
        year,
        summary,
        topSpendingCategory,
        categoryBreakdown,
        recentTransactions,
        budgetStatus,
        financialProfile: profileData,
      },
    });
  } catch (error: any) {
    console.error("[Monthly Report Error]:", error);
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
};

export default {
  getMonthlyReport,
};
