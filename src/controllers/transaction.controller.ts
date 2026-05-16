import { Request, Response } from "express";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import { db } from "../lib/db";
import { transactions } from "../models/transaction.model";
import { classifyTransaction } from "../services/ai.service";
import { IReqUser } from "../utils/interface";

const create = async (req: Request, res: Response) => {
  try {
    const userId = (req as IReqUser).user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const {
      type,
      amount,
      description,
      merchantName,
      paymentMethod,
      location,
      accountType,
      transactionTypeRaw,
      deviceUsed,
      merchantType,
      loyaltyProgram,
      timeOfDay,
      currency,
      transactionDate,
      category,
    } = req.body;

    if (type !== "income" && type !== "expense") {
      return res.status(400).json({ message: "type wajib income atau expense" });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "amount wajib ada dan lebih besar dari 0" });
    }

    const date = transactionDate ? new Date(transactionDate) : new Date();

    let finalCategory = category || "Uncategorized";
    let aiCategoryVal = null;
    let confidenceScoreVal = null;
    let sourceVal: "manual" | "ai" | "import" = "manual";

    if (type === "expense") {
      const weekdayOptions: Intl.DateTimeFormatOptions = { weekday: "long" };
      const monthOptions: Intl.DateTimeFormatOptions = { month: "long" };
      
      const weekdayStr = date.toLocaleDateString("en-US", weekdayOptions);
      const monthStr = date.toLocaleDateString("en-US", monthOptions);

      const aiPayload = {
        Amount: Number(amount),
        PaymentMethod: paymentMethod || "Cash",
        Location: location || "Unknown",
        AccountType: accountType || "Savings",
        TransactionType: transactionTypeRaw || "Debit",
        DeviceUsed: deviceUsed || "Mobile",
        MerchantType: merchantType || "Other",
        LoyaltyProgram: loyaltyProgram ? "Yes" : "No",
        Weekday: weekdayStr,
        Month: monthStr,
        TimeOfDay: timeOfDay || "Unknown",
      };

      const aiResult = await classifyTransaction(aiPayload);

      if (aiResult && aiResult.kategori) {
        finalCategory = aiResult.kategori;
        aiCategoryVal = aiResult.kategori;
        confidenceScoreVal = aiResult.confidence ? String(aiResult.confidence) : null;
        sourceVal = "ai";
      }
    }

    const [newTransaction] = await db
      .insert(transactions)
      .values({
        userId,
        type,
        amount: String(amount),
        category: finalCategory,
        description,
        merchantName,
        paymentMethod,
        location,
        accountType,
        transactionTypeRaw,
        deviceUsed,
        merchantType,
        loyaltyProgram: !!loyaltyProgram,
        timeOfDay,
        currency: currency || "IDR",
        transactionDate: date,
        source: sourceVal,
        aiCategory: aiCategoryVal,
        confidenceScore: confidenceScoreVal,
      })
      .returning();

    return res.status(201).json({
      message: "Berhasil membuat transaksi",
      data: newTransaction,
    });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const findAll = async (req: Request, res: Response) => {
  try {
    const userId = (req as IReqUser).user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { type, category, startDate, endDate } = req.query;

    const conditions = [eq(transactions.userId, userId as string)];

    if (type) {
      conditions.push(eq(transactions.type, type as "income" | "expense"));
    }

    if (category) {
      conditions.push(eq(transactions.category, category as string));
    }

    if (startDate) {
      conditions.push(gte(transactions.transactionDate, new Date(startDate as string)));
    }

    if (endDate) {
      conditions.push(lte(transactions.transactionDate, new Date(endDate as string)));
    }

    const result = await db
      .select()
      .from(transactions)
      .where(and(...conditions))
      .orderBy(desc(transactions.transactionDate));

    return res.status(200).json({
      message: "Berhasil mengambil transaksi",
      data: result,
    });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const findOne = async (req: Request, res: Response) => {
  try {
    const userId = (req as IReqUser).user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;

    const [transaction] = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, id as string), eq(transactions.userId, userId as string)));

    if (!transaction) {
      return res.status(404).json({ message: "Transaksi tidak ditemukan" });
    }

    return res.status(200).json({
      message: "Berhasil mengambil transaksi",
      data: transaction,
    });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const update = async (req: Request, res: Response) => {
  try {
    const userId = (req as IReqUser).user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;
    const body = { ...req.body };

    if (body.userId) {
      delete body.userId;
    }
    
    body.updatedAt = new Date();
    
    if (body.amount !== undefined) {
      body.amount = String(body.amount);
    }
    if (body.transactionDate !== undefined) {
      body.transactionDate = new Date(body.transactionDate);
    }

    const [updatedTransaction] = await db
      .update(transactions)
      .set(body)
      .where(and(eq(transactions.id, id as string), eq(transactions.userId, userId as string)))
      .returning();

    if (!updatedTransaction) {
      return res.status(404).json({ message: "Transaksi tidak ditemukan" });
    }

    return res.status(200).json({
      message: "Berhasil update transaksi",
      data: updatedTransaction,
    });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const remove = async (req: Request, res: Response) => {
  try {
    const userId = (req as IReqUser).user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;

    const [deletedTransaction] = await db
      .delete(transactions)
      .where(and(eq(transactions.id, id as string), eq(transactions.userId, userId as string)))
      .returning();

    if (!deletedTransaction) {
      return res.status(404).json({ message: "Transaksi tidak ditemukan" });
    }

    return res.status(200).json({
      message: "Berhasil menghapus transaksi",
      data: deletedTransaction,
    });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export default {
  create,
  findAll,
  findOne,
  update,
  remove,
};
