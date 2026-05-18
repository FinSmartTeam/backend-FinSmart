import { Request, Response } from "express";
import { eq, and, sql, desc } from "drizzle-orm";
import { db } from "../lib/db";
import { transactions } from "../models/transaction.model";
import { IReqUser } from "../utils/interface";

const getSummary = async (req: Request, res: Response) => {
  /*
    #swagger.tags = ['Dashboard']
    #swagger.security = [{
      "bearerAuth": []
    }]
    #swagger.description = 'Mendapatkan ringkasan total income, expense, balance, dan jumlah transaksi. Bisa di-filter berdasarkan month dan year opsional.'
    #swagger.parameters['month'] = { description: 'Filter bulan (1-12)', type: 'string', required: false }
    #swagger.parameters['year'] = { description: 'Filter tahun (contoh: 2026)', type: 'string', required: false }
  */
  try {
    const userId = (req as IReqUser).user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { month, year } = req.query;
    
    const conditions = [eq(transactions.userId, userId as string)];

    if (month) {
      conditions.push(sql`EXTRACT(MONTH FROM ${transactions.transactionDate}) = ${Number(month)}`);
    }
    
    if (year) {
      conditions.push(sql`EXTRACT(YEAR FROM ${transactions.transactionDate}) = ${Number(year)}`);
    }

    const result = await db
      .select({ type: transactions.type, amount: transactions.amount })
      .from(transactions)
      .where(and(...conditions));

    let totalIncome = 0;
    let totalExpense = 0;

    result.forEach((t) => {
      const amt = Number(t.amount);
      if (t.type === "income") {
        totalIncome += amt;
      } else if (t.type === "expense") {
        totalExpense += amt;
      }
    });

    const balance = totalIncome - totalExpense;
    const transactionCount = result.length;

    return res.status(200).json({
      message: "Berhasil mengambil ringkasan dashboard.",
      data: {
        totalIncome,
        totalExpense,
        balance,
        transactionCount,
      },
    });
  } catch (error: any) {
    console.error("[Dashboard Summary Error]:", error);
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
};

const getCategoryBreakdown = async (req: Request, res: Response) => {
  /*
    #swagger.tags = ['Dashboard']
    #swagger.security = [{
      "bearerAuth": []
    }]
    #swagger.description = 'Mendapatkan distribusi pengeluaran berdasarkan kategori untuk pie chart. Bisa di-filter berdasarkan month dan year opsional.'
    #swagger.parameters['month'] = { description: 'Filter bulan (1-12)', type: 'string', required: false }
    #swagger.parameters['year'] = { description: 'Filter tahun (contoh: 2026)', type: 'string', required: false }
  */
  try {
    const userId = (req as IReqUser).user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { month, year } = req.query;
    
    const conditions = [
      eq(transactions.userId, userId as string),
      eq(transactions.type, "expense")
    ];

    if (month) {
      conditions.push(sql`EXTRACT(MONTH FROM ${transactions.transactionDate}) = ${Number(month)}`);
    }
    
    if (year) {
      conditions.push(sql`EXTRACT(YEAR FROM ${transactions.transactionDate}) = ${Number(year)}`);
    }

    const data = await db
      .select({
        category: transactions.category,
        total: sql<number>`SUM(CAST(${transactions.amount} AS NUMERIC))`
      })
      .from(transactions)
      .where(and(...conditions))
      .groupBy(transactions.category)
      .orderBy(desc(sql`SUM(CAST(${transactions.amount} AS NUMERIC))`));

    const formattedData = data.map(item => ({
      category: item.category,
      total: Number(item.total)
    }));

    return res.status(200).json({
      message: "Berhasil mengambil distribusi kategori.",
      data: formattedData,
    });
  } catch (error: any) {
    console.error("[Dashboard Category Breakdown Error]:", error);
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
};

const getMonthlyData = async (req: Request, res: Response) => {
  /*
    #swagger.tags = ['Dashboard']
    #swagger.security = [{
      "bearerAuth": []
    }]
    #swagger.description = 'Mendapatkan grafik pemasukan dan pengeluaran per bulan. Bisa di-filter berdasarkan year opsional.'
    #swagger.parameters['year'] = { description: 'Filter tahun (contoh: 2026)', type: 'string', required: false }
  */
  try {
    const userId = (req as IReqUser).user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    let { year } = req.query;
    if (!year) {
      year = new Date().getFullYear().toString();
    }
    
    const conditions = [
      eq(transactions.userId, userId as string),
      sql`EXTRACT(YEAR FROM ${transactions.transactionDate}) = ${Number(year)}`
    ];

    const data = await db
      .select({
        type: transactions.type,
        amount: transactions.amount,
        month: sql<number>`EXTRACT(MONTH FROM ${transactions.transactionDate})`
      })
      .from(transactions)
      .where(and(...conditions));

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    const monthlyData = monthNames.map((name, index) => ({
      month: name,
      monthNumber: index + 1,
      income: 0,
      expense: 0,
      balance: 0
    }));

    data.forEach((item) => {
      const monthIdx = Number(item.month) - 1;
      const amt = Number(item.amount);

      if (monthlyData[monthIdx]) {
        if (item.type === "income") {
          monthlyData[monthIdx].income += amt;
        } else if (item.type === "expense") {
          monthlyData[monthIdx].expense += amt;
        }
      }
    });

    monthlyData.forEach(m => {
      m.balance = m.income - m.expense;
    });

    return res.status(200).json({
      message: "Berhasil mengambil data bulanan.",
      data: monthlyData,
    });
  } catch (error: any) {
    console.error("[Dashboard Monthly Data Error]:", error);
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
};

export default {
  getSummary,
  getCategoryBreakdown,
  getMonthlyData,
};
