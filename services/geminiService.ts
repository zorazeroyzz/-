import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateCoolSlogan = async (name: string, tags: string[]): Promise<string> => {
  try {
    const ai = getClient();
    const prompt = `
      Create a short, edgy, high-energy slogan for a photographer named "${name}" who specializes in styles: ${tags.join(', ')}.
      The style should be "Cyberpunk", "Dohna Dohna", or "Pop Art".
      Use a mix of English and simple Chinese if appropriate.
      Format: Uppercase, use symbols like "//" or ">>".
      Keep it under 10 words. 
      Example: SOUL CAPTURE // 极致瞬间
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text?.trim() || "ERROR // SYSTEM FAIL";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "VISUAL // OVERDRIVE";
  }
};

export const enhanceDescription = async (text: string): Promise<string> => {
   try {
    const ai = getClient();
    const prompt = `
      Rewrite the following pricing description to sound more professional but "cool" and energetic, suited for a high-end anime photography commission sheet.
      Keep it concise.
      Text: "${text}"
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text?.trim() || text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return text;
  }
}