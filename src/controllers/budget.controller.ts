import { Request, Response } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db } from "../lib/db";
import { budgets } from "../models/budget.model";
import { transactions } from "../models/transaction.model";
import { IReqUser } from "../utils/interface";

const create = async (req: Request, res: Response) => {
  /*
    #swagger.tags = ['Budgets']
    #swagger.security = [{
      "bearerAuth": []
    }]
    #swagger.parameters['body'] = {
      in: 'body',
      description: 'Data budget baru',
      required: true,
      schema: {
        category: 'Food',
        limitAmount: 1500000,
        month: 5,
        year: 2026
      }
    }
  */
  try {
    const userId = (req as IReqUser).user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { category, limitAmount, month, year } = req.body || {};

    if (!category || limitAmount === undefined || !month || !year) {
      return res.status(400).json({ message: "Data tidak lengkap" });
    }

    if (month < 1 || month > 12) {
      return res.status(400).json({ message: "Bulan harus antara 1-12" });
    }

    if (Number(limitAmount) <= 0) {
      return res.status(400).json({ message: "Limit amount harus lebih dari 0" });
    }

    // Check if duplicate
    const [existing] = await db
      .select()
      .from(budgets)
      .where(
        and(
          eq(budgets.userId, userId as string),
          eq(budgets.category, category),
          eq(budgets.month, Number(month)),
          eq(budgets.year, Number(year))
        )
      );

    if (existing) {
      return res.status(400).json({ message: "Budget untuk kategori ini di bulan dan tahun yang sama sudah ada" });
    }

    const [newBudget] = await db
      .insert(budgets)
      .values({
        userId: userId as string,
        category,
        limitAmount: String(limitAmount),
        month: Number(month),
        year: Number(year),
      })
      .returning();

    return res.status(201).json({
      message: "Berhasil membuat budget.",
      data: newBudget,
    });
  } catch (error: any) {
    console.error("[Create Budget Error]:", error);
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
};

const findAll = async (req: Request, res: Response) => {
  /*
    #swagger.tags = ['Budgets']
    #swagger.security = [{
      "bearerAuth": []
    }]
    #swagger.parameters['month'] = { description: 'Filter bulan (1-12)', type: 'string', required: false }
    #swagger.parameters['year'] = { description: 'Filter tahun (contoh: 2026)', type: 'string', required: false }
  */
  try {
    const userId = (req as IReqUser).user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { month, year } = req.query;
    const conditions = [eq(budgets.userId, userId as string)];

    if (month) conditions.push(eq(budgets.month, Number(month)));
    if (year) conditions.push(eq(budgets.year, Number(year)));

    const result = await db
      .select()
      .from(budgets)
      .where(and(...conditions));

    return res.status(200).json({
      message: "Berhasil mengambil data budget.",
      data: result,
    });
  } catch (error: any) {
    console.error("[Get Budgets Error]:", error);
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
};

const findOne = async (req: Request, res: Response) => {
  /*
    #swagger.tags = ['Budgets']
    #swagger.security = [{
      "bearerAuth": []
    }]
  */
  try {
    const userId = (req as IReqUser).user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { id } = req.params;
    
    const [budget] = await db
      .select()
      .from(budgets)
      .where(and(eq(budgets.id, id as string), eq(budgets.userId, userId as string)));

    if (!budget) {
      return res.status(404).json({ message: "Budget tidak ditemukan" });
    }

    return res.status(200).json({
      message: "Berhasil mengambil data budget.",
      data: budget,
    });
  } catch (error: any) {
    console.error("[Get Budget Error]:", error);
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
};

const update = async (req: Request, res: Response) => {
  /*
    #swagger.tags = ['Budgets']
    #swagger.security = [{
      "bearerAuth": []
    }]
    #swagger.parameters['body'] = {
      in: 'body',
      description: 'Data update budget',
      required: true,
      schema: {
        limitAmount: 2000000
      }
    }
  */
  try {
    const userId = (req as IReqUser).user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { id } = req.params;
    const { limitAmount } = req.body || {};

    if (limitAmount !== undefined && Number(limitAmount) <= 0) {
      return res.status(400).json({ message: "Limit amount harus lebih dari 0" });
    }

    const updateData: any = { updatedAt: new Date() };
    if (limitAmount !== undefined) updateData.limitAmount = String(limitAmount);

    const [updatedBudget] = await db
      .update(budgets)
      .set(updateData)
      .where(and(eq(budgets.id, id as string), eq(budgets.userId, userId as string)))
      .returning();

    if (!updatedBudget) {
      return res.status(404).json({ message: "Budget tidak ditemukan" });
    }

    return res.status(200).json({
      message: "Berhasil update budget.",
      data: updatedBudget,
    });
  } catch (error: any) {
    console.error("[Update Budget Error]:", error);
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
};

const remove = async (req: Request, res: Response) => {
  /*
    #swagger.tags = ['Budgets']
    #swagger.security = [{
      "bearerAuth": []
    }]
  */
  try {
    const userId = (req as IReqUser).user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { id } = req.params;

    const [deletedBudget] = await db
      .delete(budgets)
      .where(and(eq(budgets.id, id as string), eq(budgets.userId, userId as string)))
      .returning();

    if (!deletedBudget) {
      return res.status(404).json({ message: "Budget tidak ditemukan" });
    }

    return res.status(200).json({
      message: "Berhasil menghapus budget.",
      data: deletedBudget,
    });
  } catch (error: any) {
    console.error("[Delete Budget Error]:", error);
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
};

const getStatus = async (req: Request, res: Response) => {
  /*
    #swagger.tags = ['Budgets']
    #swagger.security = [{
      "bearerAuth": []
    }]
    #swagger.description = 'Mendapatkan status real-time penggunaan budget (membandingkan limit dan total transaksi expense).'
    #swagger.parameters['month'] = { description: 'Filter bulan (1-12)', type: 'string', required: true }
    #swagger.parameters['year'] = { description: 'Filter tahun (contoh: 2026)', type: 'string', required: true }
  */
  try {
    const userId = (req as IReqUser).user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const monthNum = Number(req.query.month) || new Date().getMonth() + 1;
    const yearNum = Number(req.query.year) || new Date().getFullYear();

    const userBudgets = await db
      .select()
      .from(budgets)
      .where(
        and(
          eq(budgets.userId, userId as string),
          eq(budgets.month, monthNum),
          eq(budgets.year, yearNum)
        )
      );

    if (userBudgets.length === 0) {
      return res.status(200).json({ message: "Berhasil mengambil status budget.", data: [] });
    }

    const expenseData = await db
      .select({
        category: transactions.category,
        total: sql<number>`SUM(CAST(${transactions.amount} AS NUMERIC))`
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId as string),
          eq(transactions.type, "expense"),
          sql`EXTRACT(MONTH FROM ${transactions.transactionDate}) = ${monthNum}`,
          sql`EXTRACT(YEAR FROM ${transactions.transactionDate}) = ${yearNum}`
        )
      )
      .groupBy(transactions.category);

    const expenseMap: Record<string, number> = {};
    expenseData.forEach((item) => {
      expenseMap[item.category] = Number(item.total);
    });

    const data = userBudgets.map((budget) => {
      const limitAmt = Number(budget.limitAmount);
      const usedAmt = expenseMap[budget.category] || 0;
      const remainingAmt = limitAmt - usedAmt;
      const percentage = limitAmt > 0 ? (usedAmt / limitAmt) * 100 : 0;
      
      let status = "safe";
      if (percentage >= 100) status = "overbudget";
      else if (percentage >= 70) status = "warning";

      return {
        id: budget.id,
        category: budget.category,
        limitAmount: limitAmt,
        usedAmount: usedAmt,
        remainingAmount: remainingAmt,
        percentage: Number(percentage.toFixed(2)),
        status,
      };
    });

    return res.status(200).json({ message: "Berhasil mengambil status budget.", data });
  } catch (error: any) {
    console.error("[Get Budget Status Error]:", error);
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
};

export default {
  create,
  findAll,
  findOne,
  update,
  remove,
  getStatus,
};
