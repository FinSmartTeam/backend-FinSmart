import { AI_SERVICE_URL } from "../utils/env";

export interface AIClassifyPayload {
  Amount: number;
  Payment_Method: string;
  Week_Day: string;
  Month: string;
  Time_Of_Day: string;
  MerchantName: string;
  Day: number;
}

export interface AIClassifyResponse {
  kategori: string;
  confidence: number;
  top3_prob: Record<string, number> | any;
}

export interface AIBehaviorPayload {
  Income: number;
  Needs: number;
  Wants: number;
  Savings: number;
  Total_Spending: number;
  Financial_Balance: number;
}

export interface AIBehaviorResponse {
  [key: string]: any;
}

export interface AIRekomendasiPayload {
  tabungan_total: number;
  total_pengeluaran_bulanan: number;
  tabungan_bulanan: number;
  income_bulanan: number;
}

export interface AIRekomendasiResponse {
  [key: string]: any;
}

export interface AIFinBotPayload {
  pertanyaan: string;
}

export interface AIFinBotResponse {
  [key: string]: any;
}

const fetchFromAI = async <T>(
  endpoint: string,
  payload?: any,
  method: string = "POST"
): Promise<T> => {
  const url = `${AI_SERVICE_URL}${endpoint}`;

  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (payload) {
    options.body = JSON.stringify(payload);
  }

  let response: Response;
  try {
    response = await fetch(url, options);
  } catch (error: any) {
    console.error(`[AI Service Error] Network failure on ${url}:`, error.message);
    throw new Error(`Koneksi ke AI Service gagal: ${error.message}`);
  }

  if (!response.ok) {
    let errorText = "";
    try {
      errorText = await response.text();
    } catch (e) {}
    
    console.error(`[AI Service Error] ${method} ${url} returned ${response.status}:`, errorText);
    throw new Error(`AI Service merespons dengan error ${response.status}: ${errorText}`);
  }

  return (await response.json()) as T;
};

export const classifyTransaction = async (
  payload: AIClassifyPayload
): Promise<AIClassifyResponse> => {
  return fetchFromAI<AIClassifyResponse>("/classify", payload);
};

export const classifyBehavior = async (
  payload: AIBehaviorPayload
): Promise<AIBehaviorResponse> => {
  return fetchFromAI<AIBehaviorResponse>("/behavior", payload);
};

export const getInvestmentRecommendation = async (
  payload: AIRekomendasiPayload
): Promise<AIRekomendasiResponse> => {
  return fetchFromAI<AIRekomendasiResponse>("/rekomendasi", payload);
};

export const askFinBot = async (
  payload: AIFinBotPayload
): Promise<AIFinBotResponse> => {
  return fetchFromAI<AIFinBotResponse>("/finbot/chat", payload);
};

export const getClassifyValidValues = async (): Promise<any> => {
  return fetchFromAI<any>("/classify/valid-values", null, "GET");
};