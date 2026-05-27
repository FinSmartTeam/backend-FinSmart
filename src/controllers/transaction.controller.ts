import { Request, Response } from "express";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import { db } from "../lib/db";
import { transactions } from "../models/transaction.model";
import { classifyTransaction } from "../services/ai.service";
import { IReqUser } from "../utils/interface";

const getDatePartsForAI = (dateInput?: string | Date) => {
  const date = dateInput ? new Date(dateInput) : new Date();

  return {
    Week_Day: date.toLocaleDateString("en-US", { weekday: "long" }),
    Month: date.toLocaleDateString("en-US", { month: "long" }),
    Day: date.getDate(),
  };
};

const create = async (req: Request, res: Response) => {
  /*
    #swagger.tags = ['Transactions']
    #swagger.security = [{
      "bearerAuth": []
    }]
    #swagger.description = 'Membuat transaksi baru. Jika type expense, akan menggunakan AI otomatis.'
    #swagger.requestBody = {
      required: true,
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/CreateTransactionRequest" }
        }
      }
    }
  */
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

    let finalCategory = category || (type === "income" ? "Income" : "Uncategorized");
    let aiCategoryVal = null;
    let confidenceScoreVal = null;
    let sourceVal: "manual" | "ai" | "import" = "manual";

    if (type === "expense") {
      const dateParts = getDatePartsForAI(date);

      const aiPayload = {
        Amount: Number(amount),
        Payment_Method: paymentMethod || "Debit Card",
        MerchantName: merchantName || "Amazon",
        Time_Of_Day: timeOfDay || "Evening",
        Week_Day: dateParts.Week_Day,
        Month: dateParts.Month,
        Day: dateParts.Day,
      };

      try {
        const aiResult = await classifyTransaction(aiPayload);
        if (aiResult && aiResult.kategori) {
          finalCategory = aiResult.kategori;
          aiCategoryVal = aiResult.kategori;
          confidenceScoreVal = aiResult.confidence ? String(aiResult.confidence) : null;
          sourceVal = "ai";
        }
      } catch (aiError) {
        console.error("AI classification failed, falling back to manual:", aiError);
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
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
};

const findAll = async (req: Request, res: Response) => {
  /*
    #swagger.tags = ['Transactions']
    #swagger.security = [{
      "bearerAuth": []
    }]
    #swagger.description = 'Mendapatkan daftar semua transaksi milik user yang login.'
  */
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
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
};

const findOne = async (req: Request, res: Response) => {
  /*
    #swagger.tags = ['Transactions']
    #swagger.security = [{
      "bearerAuth": []
    }]
    #swagger.description = 'Mendapatkan detail transaksi berdasarkan ID.'
  */
  try {
    const userId = (req as IReqUser).user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id as string)) {
      return res.status(400).json({ message: "Format ID transaksi tidak valid" });
    }

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
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
};

const update = async (req: Request, res: Response) => {
  /*
    #swagger.tags = ['Transactions']
    #swagger.security = [{
      "bearerAuth": []
    }]
    #swagger.description = 'Mengubah transaksi berdasarkan ID. Endpoint ini mendukung update parsial (hanya field yang dikirim yang akan diubah).<br><br>**Field yang diizinkan untuk diubah:**<br>- `type` ("income" atau "expense")<br>- `amount`<br>- `category`<br>- `description`<br>- `merchantName`<br>- `paymentMethod`<br>- `location`<br>- `accountType`<br>- `transactionTypeRaw`<br>- `deviceUsed`<br>- `merchantType`<br>- `loyaltyProgram`<br>- `timeOfDay`<br>- `currency`<br>- `transactionDate`<br><br>**Catatan:**<br>- Field `id`, `userId`, `createdAt`, dan `updatedAt` tidak dapat diubah melalui request ini dan akan diabaikan.'
    #swagger.requestBody = {
      required: true,
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/UpdateTransactionRequest" }
        }
      }
    }
  */
  try {
    const userId = (req as IReqUser).user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id.toString())) {
      return res.status(400).json({ message: "Format ID transaksi tidak valid" });
    }

    const allowedFields = [
      "type",
      "amount",
      "category",
      "description",
      "merchantName",
      "paymentMethod",
      "location",
      "accountType",
      "transactionTypeRaw",
      "deviceUsed",
      "merchantType",
      "loyaltyProgram",
      "timeOfDay",
      "currency",
      "transactionDate",
    ];

    const updateData: any = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    if (updateData.type !== undefined && updateData.type !== "income" && updateData.type !== "expense") {
      return res.status(400).json({ message: "type jika dikirim hanya boleh income atau expense" });
    }

    if (updateData.amount !== undefined) {
      const amountNum = Number(updateData.amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        return res.status(400).json({ message: "amount jika dikirim harus number dan lebih besar dari 0" });
      }
      updateData.amount = String(updateData.amount);
    }

    if (updateData.transactionDate !== undefined) {
      const date = new Date(updateData.transactionDate);
      if (isNaN(date.getTime())) {
        return res.status(400).json({ message: "transactionDate jika dikirim harus valid date" });
      }
      updateData.transactionDate = date;
    }

    if (updateData.category !== undefined && typeof updateData.category === "string" && updateData.category.trim() === "") {
      return res.status(400).json({ message: "category jika dikirim tidak boleh string kosong" });
    }

    if (updateData.currency === "" || (req.body.hasOwnProperty("currency") && !req.body.currency)) {
      updateData.currency = "IDR";
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "Payload tidak valid atau tidak ada data yang diupdate" });
    }

    updateData.updatedAt = new Date();

    const [updatedTransaction] = await db
      .update(transactions)
      .set(updateData)
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
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
};

const remove = async (req: Request, res: Response) => {
  /*
    #swagger.tags = ['Transactions']
    #swagger.security = [{
      "bearerAuth": []
    }]
    #swagger.description = 'Menghapus transaksi berdasarkan ID.'
  */
  try {
    const userId = (req as IReqUser).user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id.toString())) {
      return res.status(400).json({ message: "Format ID transaksi tidak valid" });
    }

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
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
};

export default {
  create,
  findAll,
  findOne,
  update,
  remove,
};
