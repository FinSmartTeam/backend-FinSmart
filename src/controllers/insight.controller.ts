import { Request, Response } from "express";
import { eq, and, gte, lte } from "drizzle-orm";
import { db } from "../lib/db";
import { transactions } from "../models/transaction.model";
import { financialProfiles } from "../models/financial-profile.model";
import { IReqUser } from "../utils/interface";
import { classifyBehavior, getInvestmentRecommendation } from "../services/ai.service";

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

const isNeedsCategory = (category: string): boolean => {
  const needs = [
    "groceries",
    "health",
    "education",
    "transportation",
    "bills",
    "utilities",
    "rent",
    "insurance",
    "food",
    "food & dining",
  ];
  return needs.includes(category.toLowerCase());
};

const getUserFinancialProfile = async (userId: string) => {
  const [profile] = await db
    .select()
    .from(financialProfiles)
    .where(eq(financialProfiles.userId, userId));
  return profile;
};

const getMonthlyTransactionSummary = async (userId: string, month: number, year: number) => {
  const { startDate, endDate } = getMonthRange(month, year);

  const txs = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        gte(transactions.transactionDate, startDate),
        lte(transactions.transactionDate, endDate)
      )
    );

  let totalIncome = 0;
  let totalExpense = 0;
  let needs = 0;
  let wants = 0;

  txs.forEach((tx) => {
    const amount = toNumber(tx.amount);
    if (tx.type === "income") {
      totalIncome += amount;
    } else if (tx.type === "expense") {
      totalExpense += amount;
      if (isNeedsCategory(tx.category)) {
        needs += amount;
      } else {
        wants += amount;
      }
    }
  });

  return { totalIncome, totalExpense, needs, wants };
};

const getBehaviorInsight = async (req: Request, res: Response) => {
  /*
    #swagger.tags = ['Insights']
    #swagger.security = [{
      "bearerAuth": []
    }]
  */
  try {
    const userId = (req as IReqUser).user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const month = Number(req.query.month) || new Date().getMonth() + 1;
    const year = Number(req.query.year) || new Date().getFullYear();

    const profile = await getUserFinancialProfile(userId as string);
    const summary = await getMonthlyTransactionSummary(userId as string, month, year);

    let Income = 0;
    if (profile && toNumber(profile.monthlyIncome) > 0) {
      Income = toNumber(profile.monthlyIncome);
    } else {
      Income = summary.totalIncome;
    }

    const Total_Spending = summary.totalExpense;
    const Needs = summary.needs;
    const Wants = summary.wants;
    const Savings = Income - Total_Spending;
    const Financial_Balance = Income - Total_Spending;

    const payload = {
      Income,
      Needs,
      Wants,
      Savings,
      Total_Spending,
      Financial_Balance,
    };

    const aiResult = await classifyBehavior(payload);

    return res.status(200).json({
      message: "Berhasil mendapatkan insight perilaku keuangan.",
      data: {
        input: payload,
        result: aiResult,
      },
    });
  } catch (error: any) {
    console.error("[Behavior Insight Error]:", error);
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
};

const getInvestmentInsight = async (req: Request, res: Response) => {
  /*
    #swagger.tags = ['Insights']
    #swagger.security = [{
      "bearerAuth": []
    }]
  */
  try {
    const userId = (req as IReqUser).user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const month = Number(req.query.month) || new Date().getMonth() + 1;
    const year = Number(req.query.year) || new Date().getFullYear();

    const profile = await getUserFinancialProfile(userId as string);
    const summary = await getMonthlyTransactionSummary(userId as string, month, year);

    const tabungan_total = profile ? toNumber(profile.totalSavings) : 0;
    
    let income_bulanan = 0;
    if (profile && toNumber(profile.monthlyIncome) > 0) {
      income_bulanan = toNumber(profile.monthlyIncome);
    } else {
      income_bulanan = summary.totalIncome;
    }

    const total_pengeluaran_bulanan = summary.totalExpense;
    const tabungan_bulanan = income_bulanan - total_pengeluaran_bulanan;

    const payload = {
      tabungan_total,
      total_pengeluaran_bulanan,
      tabungan_bulanan,
      income_bulanan,
    };

    const aiResult = await getInvestmentRecommendation(payload);

    return res.status(200).json({
      message: "Berhasil mendapatkan rekomendasi investasi.",
      data: {
        input: payload,
        result: aiResult,
      },
    });
  } catch (error: any) {
    console.error("[Investment Insight Error]:", error);
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
};

export default {
  getBehaviorInsight,
  getInvestmentInsight,
};
