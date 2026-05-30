import { Request, Response } from "express";
import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { financialProfiles } from "../models/financial-profile.model";
import { IReqUser } from "../utils/interface";

const toNumericString = (value: unknown, fieldName: string) => {
  const parsed =
    typeof value === "string" || typeof value === "number"
      ? Number(value)
      : Number.NaN;

  if (!Number.isFinite(parsed)) {
    throw new TypeError(`${fieldName} harus berupa angka.`);
  }

  return parsed.toFixed(2);
};

const normalizeNullableText = (value: unknown) => {
  if (value === null) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  throw new Error("riskLevel dan financialGoal harus berupa string atau null.");
};

const getProfile = async (req: Request, res: Response) => {
  /*
    #swagger.tags = ['Financial Profile']
    #swagger.security = [{
      "bearerAuth": []
    }]
    #swagger.description = 'Mendapatkan data profil finansial user. Jika belum ada, Profil finansial belum diisi.'
  */
  try {
    const userId = (req as IReqUser).user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    let [profile] = await db
      .select()
      .from(financialProfiles)
      .where(eq(financialProfiles.userId, userId));

    if (!profile) {
      return res.status(200).json({
        message: "Profil finansial belum diisi.",
        data: null,
        isProfileCompleted: false,
      });
    }

    return res.status(200).json({
      message: "Berhasil mengambil profil finansial.",
      data: profile,
      isProfileCompleted: true,
    });
  } catch (error: any) {
    console.error("[Get Financial Profile Error]:", error);
    return res
      .status(500)
      .json({ message: error.message || "Internal server error" });
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

    const {
      monthlyIncome,
      savingsTarget,
      totalSavings,
      riskLevel,
      financialGoal,
    } = req.body;

    const updateData: {
      monthlyIncome?: string;
      savingsTarget?: string;
      totalSavings?: string;
      riskLevel?: string | null;
      financialGoal?: string | null;
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    try {
      if (monthlyIncome !== undefined)
        updateData.monthlyIncome = toNumericString(
          monthlyIncome,
          "monthlyIncome",
        );
      if (savingsTarget !== undefined)
        updateData.savingsTarget = toNumericString(
          savingsTarget,
          "savingsTarget",
        );
      if (totalSavings !== undefined)
        updateData.totalSavings = toNumericString(totalSavings, "totalSavings");
      if (riskLevel !== undefined)
        updateData.riskLevel = normalizeNullableText(riskLevel);
      if (financialGoal !== undefined)
        updateData.financialGoal = normalizeNullableText(financialGoal);
    } catch (validationError: any) {
      return res.status(400).json({ message: validationError.message });
    }

    const [existingProfile] = await db
      .select()
      .from(financialProfiles)
      .where(eq(financialProfiles.userId, userId));

    let profile;

    if (existingProfile) {
      const [updated] = await db
        .update(financialProfiles)
        .set(updateData)
        .where(eq(financialProfiles.userId, userId))
        .returning();
      profile = updated;
    } else {
      const [inserted] = await db
        .insert(financialProfiles)
        .values({
          userId,
          monthlyIncome: updateData.monthlyIncome ?? "0.00",
          savingsTarget: updateData.savingsTarget ?? "0.00",
          totalSavings: updateData.totalSavings ?? "0.00",
          riskLevel: updateData.riskLevel ?? null,
          financialGoal: updateData.financialGoal ?? null,
        })
        .returning();
      profile = inserted;
    }

    return res.status(200).json({
      message: "Berhasil memperbarui profil finansial.",
      data: profile,
      isProfileCompleted: true,
    });
  } catch (error: any) {
    console.error("[Update Financial Profile Error]:", error);
    return res
      .status(500)
      .json({ message: error.message || "Internal server error" });
  }
};

export default {
  getProfile,
  updateProfile,
};
