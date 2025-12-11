import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found. Please set process.env.API_KEY.");
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

export const generateDohnaStyleAvatar = async (base64Image: string): Promise<string> => {
  try {
    const ai = getClient();
    
    // Remove header if present
    const cleanBase64 = base64Image.split(',')[1] || base64Image;

    const prompt = `
      Transform this image into the specific art style of the game "Dohna Dohna wa Uta" (Alicesoft).
      Key characteristics:
      - Thick, varied line weight (black outlines).
      - Flat, high-saturation coloring (Hot Pink, Cyan, Yellow).
      - Pop-art, vector illustration aesthetic.
      - "Trash Candy" vibe.
      - 2D Anime style, very crisp, no blurring.
      - Keep the character composition but make it look like a sticker from the game.
      - White background.
    `;

    // Using gemini-3-pro-image-preview (Nano Banana Pro) as requested for high quality style transfer
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/png',
              data: cleanBase64
            }
          },
          { text: prompt }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: '1:1',
          imageSize: '1K'
        }
      }
    });

    // Extract image
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error("No image generated");
  } catch (error) {
    console.error("Dohna Gen Error:", error);
    throw error;
  }
};