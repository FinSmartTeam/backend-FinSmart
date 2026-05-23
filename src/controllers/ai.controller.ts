import { Request, Response } from "express";
import { getClassifyValidValues, getModelInfo as getModelInfoService, askFinBot, classifyBehavior, getInvestmentRecommendation, predictSpending as predictSpendingService, AIPredictSpendingHistoryItem } from "../services/ai.service";
import { db } from "../lib/db";
import { transactions } from "../models/transaction.model";
import { eq, asc } from "drizzle-orm";
import { IReqUser } from "../utils/interface";


const getValidValues = async (req: Request, res: Response) => {
  /*
    #swagger.tags = ['AI Services']
    #swagger.description = 'Mendapatkan valid values untuk keperluan input'
  */
  try {
    const data = await getClassifyValidValues();
    
    return res.status(200).json({
      message: "Berhasil mengambil valid values.",
      data,
    });
  } catch (error: any) {
    console.error("[AI Controller Error]:", error);
    return res.status(500).json({ 
      message: error.message || "Gagal mengambil valid values dari AI Service" 
    });
  }
};

const getModelInfo = async (req: Request, res: Response) => {
  /*
    #swagger.tags = ['AI Services']
    #swagger.description = 'Mendapatkan informasi model AI yang digunakan'
  */
  try {
    const data = await getModelInfoService();
    
    return res.status(200).json({
      message: "Berhasil mengambil model info.",
      data,
    });
  } catch (error: any) {
    console.error("[AI Controller Error]:", error);
    return res.status(500).json({ 
      message: error.message || "Gagal mendapatkan model info dari AI Service" 
    });
  }
};

const askFinBotChat = async (req: Request, res: Response) => {
  /*
    #swagger.tags = ['AI Services']
    #swagger.security = [{
      "bearerAuth": []
    }]
    #swagger.parameters['body'] = {
      in: 'body',
      description: 'Pertanyaan untuk FinBot',
      required: true,
      schema: {
        pertanyaan: 'Bagaimana cara menabung?'
      }
    }
  */
  try {
    const { pertanyaan } = req.body || {};

    if (!pertanyaan) {
      return res.status(400).json({ message: "Pertanyaan tidak boleh kosong" });
    }

    const data = await askFinBot({ pertanyaan });

    return res.status(200).json({
      message: "Berhasil mendapatkan jawaban FinBot.",
      data,
    });
  } catch (error: any) {
    console.error("[FinBot Chat Error]:", error);
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
};

const getBehavior = async (req: Request, res: Response) => {
  /*
    #swagger.tags = ['AI Services']
    #swagger.security = [{
      "bearerAuth": []
    }]
  */
  try {
    const { Income, Needs, Wants, Savings, Total_Spending, Financial_Balance } = req.body || {};

    if (
      Income === undefined ||
      Needs === undefined ||
      Wants === undefined ||
      Savings === undefined ||
      Total_Spending === undefined ||
      Financial_Balance === undefined
    ) {
      return res.status(400).json({ message: "Data tidak lengkap" });
    }

    if (
      typeof Income !== "number" ||
      typeof Needs !== "number" ||
      typeof Wants !== "number" ||
      typeof Savings !== "number" ||
      typeof Total_Spending !== "number" ||
      typeof Financial_Balance !== "number"
    ) {
      return res.status(400).json({ message: "Semua field harus berupa number" });
    }

    const data = await classifyBehavior({
      Income,
      Needs,
      Wants,
      Savings,
      Total_Spending,
      Financial_Balance,
    });

    return res.status(200).json({
      message: "Berhasil mendapatkan klasifikasi perilaku keuangan.",
      data,
    });
  } catch (error: any) {
    console.error("[Get Behavior Error]:", error);
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
};

const getRekomendasi = async (req: Request, res: Response) => {
  /*
    #swagger.tags = ['AI Services']
    #swagger.security = [{
      "bearerAuth": []
    }]
  */
  try {
    const { tabungan_total, total_pengeluaran_bulanan, tabungan_bulanan, income_bulanan } = req.body || {};

    if (
      tabungan_total === undefined ||
      total_pengeluaran_bulanan === undefined ||
      tabungan_bulanan === undefined ||
      income_bulanan === undefined
    ) {
      return res.status(400).json({ message: "Data tidak lengkap" });
    }

    if (
      typeof tabungan_total !== "number" ||
      typeof total_pengeluaran_bulanan !== "number" ||
      typeof tabungan_bulanan !== "number" ||
      typeof income_bulanan !== "number"
    ) {
      return res.status(400).json({ message: "Semua field harus berupa number" });
    }

    const data = await getInvestmentRecommendation({
      tabungan_total,
      total_pengeluaran_bulanan,
      tabungan_bulanan,
      income_bulanan,
    });

    return res.status(200).json({
      message: "Berhasil mendapatkan rekomendasi investasi.",
      data,
    });
  } catch (error: any) {
    console.error("[Get Rekomendasi Error]:", error);
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
};

const predictSpending = async (req: Request, res: Response) => {
  /*
    #swagger.tags = ['AI Services']
    #swagger.security = [{
      "bearerAuth": []
    }]
    #swagger.description = 'Memprediksi pengeluaran bulan depan berdasarkan histori transaksi user minimal 3 bulan terakhir.'
  */
  try {
    const userId = (req as IReqUser).user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userTransactions = await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId as string))
      .orderBy(asc(transactions.transactionDate));

    const grouped = new Map<string, AIPredictSpendingHistoryItem>();

    for (const t of userTransactions) {
      if (!t.transactionDate) continue;
      const d = new Date(t.transactionDate);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const key = `${year}-${month}`;

      if (!grouped.has(key)) {
        grouped.set(key, {
          bills_utilities: 0,
          education: 0,
          entertainment: 0,
          food_dining: 0,
          groceries: 0,
          health: 0,
          income: 0,
          others: 0,
          savings: 0,
          shopping: 0,
          total_spending: 0,
          transportation: 0
        });
      }

      const item = grouped.get(key)!;
      const amt = Number(t.amount);

      if (t.type === "income") {
        item.income += amt;
      } else if (t.type === "expense") {
        item.total_spending += amt;
        
        const cat = (t.category || "").toLowerCase();
        if (cat === "food & dining" || cat === "food") item.food_dining += amt;
        else if (cat === "transportation" || cat === "transport") item.transportation += amt;
        else if (cat === "shopping") item.shopping += amt;
        else if (cat === "groceries") item.groceries += amt;
        else if (cat === "bills & utilities" || cat === "bills" || cat === "utilities") item.bills_utilities += amt;
        else if (cat === "entertainment") item.entertainment += amt;
        else if (cat === "health") item.health += amt;
        else if (cat === "education") item.education += amt;
        else item.others += amt;
      }
    }

    const histori = Array.from(grouped.values()).map(item => {
      item.savings = item.income - item.total_spending;
      return item;
    });

    if (histori.length < 3) {
      return res.status(400).json({ message: "Data transaksi minimal 3 bulan diperlukan untuk prediksi spending." });
    }

    const payload = { histori };
    const data = await predictSpendingService(payload);

    return res.status(200).json({
      message: "Berhasil memprediksi pengeluaran bulan depan.",
      data,
    });
  } catch (error: any) {
    console.error("[Predict Spending Error]:", error);
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
};

export default {
  getValidValues,
  getModelInfo,
  getBehavior,
  getRekomendasi,
  askFinBotChat,
  predictSpending,
};
