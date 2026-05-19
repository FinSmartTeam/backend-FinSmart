import { Request, Response } from "express";
import { getClassifyValidValues, getModelInfo as getModelInfoService, askFinBot, classifyBehavior, getInvestmentRecommendation } from "../services/ai.service";

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

export default {
  getValidValues,
  getModelInfo,
  getBehavior,
  getRekomendasi,
  askFinBotChat,
};
