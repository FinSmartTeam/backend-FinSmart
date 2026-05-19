import { Request, Response } from "express";
import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { financialProfiles } from "../models/financial-profile.model";
import { IReqUser } from "../utils/interface";

const getProfile = async (req: Request, res: Response) => {
  /*
    #swagger.tags = ['Financial Profile']
    #swagger.security = [{
      "bearerAuth": []
    }]
    #swagger.description = 'Mendapatkan data profil finansial user. Jika belum ada, otomatis dibuat default.'
  */
  try {
    const userId = (req as IReqUser).user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    let [profile] = await db
      .select()
      .from(financialProfiles)
      .where(eq(financialProfiles.userId, userId as string));

    if (!profile) {
      const [newProfile] = await db
        .insert(financialProfiles)
        .values({
          userId: userId as string,
          monthlyIncome: "0",
          savingsTarget: "0",
          totalSavings: "0",
        })
        .returning();
      profile = newProfile;
    }

    return res.status(200).json({
      message: "Berhasil mengambil profil finansial.",
      data: profile,
    });
  } catch (error: any) {
    console.error("[Get Financial Profile Error]:", error);
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
};

const updateProfile = async (req: Request, res: Response) => {
  /*
    #swagger.tags = ['Financial Profile']
    #swagger.security = [{
      "bearerAuth": []
    }]
    #swagger.description = 'Memperbarui profil finansial user.'
  */
  try {
    const userId = (req as IReqUser).user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { monthlyIncome, savingsTarget, totalSavings, riskLevel, financialGoal } = req.body;

    const [existingProfile] = await db
      .select()
      .from(financialProfiles)
      .where(eq(financialProfiles.userId, userId as string));

    let profile;

    const updateData: any = {};
    if (monthlyIncome !== undefined) updateData.monthlyIncome = String(monthlyIncome);
    if (savingsTarget !== undefined) updateData.savingsTarget = String(savingsTarget);
    if (totalSavings !== undefined) updateData.totalSavings = String(totalSavings);
    if (riskLevel !== undefined) updateData.riskLevel = riskLevel;
    if (financialGoal !== undefined) updateData.financialGoal = financialGoal;
    
    updateData.updatedAt = new Date();

    if (existingProfile) {
      const [updated] = await db
        .update(financialProfiles)
        .set(updateData)
        .where(eq(financialProfiles.userId, userId as string))
        .returning();
      profile = updated;
    } else {
      const [inserted] = await db
        .insert(financialProfiles)
        .values({
          userId: userId as string,
          monthlyIncome: updateData.monthlyIncome || "0",
          savingsTarget: updateData.savingsTarget || "0",
          totalSavings: updateData.totalSavings || "0",
          riskLevel: updateData.riskLevel || null,
          financialGoal: updateData.financialGoal || null,
        })
        .returning();
      profile = inserted;
    }

    return res.status(200).json({
      message: "Berhasil memperbarui profil finansial.",
      data: profile,
    });
  } catch (error: any) {
    console.error("[Update Financial Profile Error]:", error);
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
};

export default {
  getProfile,
  updateProfile,
};
