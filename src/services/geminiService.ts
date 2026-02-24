import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const generateCode = async (prompt: string, language: string = "javascript") => {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Act as a senior software engineer. Generate high-quality, professional code for the following request in ${language}. 
    If the request is for a web app, provide HTML, CSS, and JS combined into a single HTML structure if possible, or separate blocks.
    Request: ${prompt}`,
    config: {
      temperature: 0.7,
    },
  });
  return response.text;
};

export const debugCode = async (code: string, language: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Debug the following ${language} code. Identify errors, explain them, and provide the fixed code.
    Code:
    ${code}`,
  });
  return response.text;
};

export const processVoiceCommand = async (transcript: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `The user said: "${transcript}". 
    Interpret this as a coding command. 
    If they want to build something, describe what to build. 
    If they want to fix something, explain the fix.
    Return a JSON object with:
    {
      "intent": "build" | "fix" | "other",
      "description": "clear description of the task",
      "suggestedLanguage": "javascript" | "python" | "html" | etc
    }`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          intent: { type: Type.STRING },
          description: { type: Type.STRING },
          suggestedLanguage: { type: Type.STRING }
        },
        required: ["intent", "description", "suggestedLanguage"]
      }
    }
  });
  return JSON.parse(response.text);
};
