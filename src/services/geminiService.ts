import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const generateCode = async (prompt: string, language: string = "javascript", useThinking: boolean = false) => {
  const config: any = {
    temperature: 0.7,
  };

  if (useThinking) {
    config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
  }

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Act as a senior software engineer. Generate high-quality, professional code for the following request in ${language}. 
    If the request is for a web app, provide HTML, CSS, and JS combined into a single HTML structure if possible, or separate blocks.
    Request: ${prompt}`,
    config,
  });
  return response.text;
};

export const fastFix = async (code: string, language: string, customApiKey?: string) => {
  const client = customApiKey ? new GoogleGenAI({ apiKey: customApiKey }) : ai;
  const response = await client.models.generateContent({
    model: "gemini-2.5-flash-lite-latest",
    contents: `Quickly identify and fix the most obvious bug in this ${language} code. Return ONLY the fixed code.
    Code:
    ${code}`,
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

export const manipulateCode = async (code: string, language: string, action: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Act as a senior software engineer. Perform the following action on the provided ${language} code snippet.
    Action: ${action}
    Code:
    ${code}
    
    Return ONLY the modified code snippet, no explanations or markdown code blocks.`,
  });
  return response.text;
};

export const chatWithAI = async (message: string, history: { role: string, parts: { text: string }[] }[]) => {
  const chat = ai.chats.create({
    model: "gemini-3.1-pro-preview",
    config: {
      systemInstruction: "You are Nexus AI, a professional coding assistant. You help developers build, debug, and optimize their code. Be concise, technical, and helpful.",
    },
    history,
  });

  const response = await chat.sendMessage({ message });
  return response.text;
};
