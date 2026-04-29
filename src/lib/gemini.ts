import { GoogleGenAI, Type } from "@google/genai";
import { Category } from '../data/catalog';

export const testGeminiApiKey = async (apiKey: string): Promise<boolean> => {
  if (!apiKey) return false;
  try {
    const ai = new GoogleGenAI({ apiKey });
    await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: "Test",
    });
    return true;
  } catch (error) {
    return false;
  }
};

export const classifyProductWithGemini = async (productName: string, apiKey: string): Promise<Category> => {
  if (!apiKey) {
    throw new Error('Gemini API key is required');
  }

  const ai = new GoogleGenAI({ apiKey });

  const categories: Category[] = [
    'Pieczywo', 'Nabiał i jajka', 'Mięso i wędliny', 'Owoce', 'Warzywa',
    'Napoje', 'Słodycze i przekąski', 'Kawa i herbata', 'Sypkie i makarony',
    'Przyprawy i sosy', 'Mrożonki', 'Gotowe dania', 'Chemia gospodarcza',
    'Kosmetyki', 'Dla zwierząt', 'Inne'
  ];

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: `User wants to add a shopping item named: "${productName}". 
Assign it to the most appropriate category from the following list: ${categories.join(', ')}. 
Respond ONLY with the category name exactly as written in the list.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
             category: {
                 type: Type.STRING,
                 enum: categories
             }
          },
          required: ["category"]
        }
      }
    });

    try {
        const textStr = response.text || "{}";
        const json = JSON.parse(textStr);
        if (json.category && categories.includes(json.category as Category)) {
             return json.category as Category;
        }
    } catch(e) {
        console.error("Failed to parse Gemini response", e);
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
  }
  
  return 'Inne';
};
