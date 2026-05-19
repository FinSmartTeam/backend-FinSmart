import { Request, Response } from "express";
import { getClassifyValidValues, getModelInformation, askFinBot } from "../services/ai.service";

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
    const data = await getModelInformation();
    
    return res.status(200).json({
      message: "Berhasil mendapatkan model info.",
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

export default {
  getValidValues,
  getModelInfo,
  askFinBotChat,
};
