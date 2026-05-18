import { Request, Response } from "express";
import { getClassifyValidValues } from "../services/ai.service";

const getValidValues = async (req: Request, res: Response) => {
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

export default {
  getValidValues,
};
