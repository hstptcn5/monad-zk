import { GoogleGenAI } from "@google/genai";

// Note: In a real production app, calls should go through a backend.
// For this demo, we use the key from environment if available.
const apiKey = process.env.API_KEY || '';

let ai: GoogleGenAI | null = null;
if (apiKey) {
    ai = new GoogleGenAI({ apiKey });
}

export const generateAIExplanation = async (context: string): Promise<string> => {
  if (!ai) return "Gemini API Key not configured. Please check your environment.";

  try {
    const model = "gemini-2.5-flash";
    const prompt = `
      You are an expert ZK-ML (Zero Knowledge Machine Learning) engineer working on the Monad blockchain.
      Context: ${context}
      
      Explain briefly (max 2 sentences) what is technically happening in this step of the pipeline. 
      Use technical terms like "Circuit compilation", "Witness generation", "Halo2 Proof", "EVM Verifier", or "Monad Parallel Execution".
      Sound professional and enthusiastic about Monad's speed.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "Analyzing pipeline step...";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "AI agent is offline. Proceeding with manual verification.";
  }
};

export const analyzeMarketInput = async (): Promise<string> => {
    if (!ai) return "Simulating input data...";
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: "Generate a JSON-like string representing 3 input features for a crypto price prediction model (e.g. Bitcoin Volatility, ETH Gas, Volume). Format: { \"btc_vol\": 0.x, \"eth_gas\": x, \"vol\": x }. Just the JSON."
        });
        return response.text || "{ \"btc_vol\": 0.5, \"eth_gas\": 20, \"vol\": 1.2 }";
    } catch (e) {
        return "{ \"btc_vol\": 0.5, \"eth_gas\": 20, \"vol\": 1.2 }";
    }
}