import { GoogleGenAI, Type, ThinkingLevel, GenerateContentResponse } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const getAIClient = (userKey?: string) => {
  if (userKey) return new GoogleGenAI({ apiKey: userKey });
  return ai;
};

export const generateCode = async (prompt: string, language: string = "javascript", useThinking: boolean = false, userKey?: string) => {
  const client = getAIClient(userKey);
  const config: any = {
    temperature: 0.7,
  };

  // Use Flash for speed, Pro only for thinking
  const model = useThinking ? "gemini-3.1-pro-preview" : "gemini-3-flash-preview";

  if (useThinking) {
    config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
  } else {
    // Minimize latency for non-thinking tasks
    config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
  }

  const response = await client.models.generateContent({
    model,
    contents: `Act as a senior software engineer. Generate high-quality, professional code for the following request in ${language}. 
    If the request is for a web app, provide HTML, CSS, and JS combined into a single HTML structure if possible, or separate blocks.
    Request: ${prompt}`,
    config,
  });
  return response.text;
};

export const generateCodeStream = async (prompt: string, language: string = "javascript", useThinking: boolean = false, onChunk: (text: string) => void, userKey?: string) => {
  const client = getAIClient(userKey);
  const config: any = {
    temperature: 0.7,
  };

  const model = useThinking ? "gemini-3.1-pro-preview" : "gemini-3-flash-preview";

  if (useThinking) {
    config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
  } else {
    config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
  }

  const response = await client.models.generateContentStream({
    model,
    contents: `Act as a senior software engineer. Generate high-quality, professional code for the following request in ${language}. 
    If the request is for a web app, provide HTML, CSS, and JS combined into a single HTML structure if possible, or separate blocks.
    Request: ${prompt}`,
    config,
  });

  let fullText = "";
  for await (const chunk of response) {
    const text = chunk.text;
    if (text) {
      fullText += text;
      onChunk(fullText);
    }
  }
  return fullText;
};

export const fastFix = async (code: string, language: string, userKey?: string) => {
  const client = getAIClient(userKey);
  const response = await client.models.generateContent({
    model: "gemini-2.5-flash-lite-latest",
    contents: `Quickly identify and fix the most obvious bug in this ${language} code. Return ONLY the fixed code.
    Code:
    ${code}`,
    config: {
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
    }
  });
  return response.text;
};

export const debugCode = async (code: string, language: string, userKey?: string) => {
  const client = getAIClient(userKey);
  const response = await client.models.generateContent({
    model: "gemini-3-flash-preview", // Switched to flash for speed
    contents: `Debug the following ${language} code. Identify errors, explain them, and provide the fixed code.
    Code:
    ${code}`,
    config: {
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
    }
  });
  return response.text;
};

export const processVoiceCommand = async (transcript: string, userKey?: string) => {
  const client = getAIClient(userKey);
  const response = await client.models.generateContent({
    model: "gemini-3-flash-preview", // Switched to flash for speed
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
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
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

export const manipulateCode = async (code: string, language: string, action: string, userKey?: string) => {
  const client = getAIClient(userKey);
  const response = await client.models.generateContent({
    model: "gemini-3-flash-preview", // Switched to flash for speed
    contents: `Act as a senior software engineer. Perform the following action on the provided ${language} code snippet.
    Action: ${action}
    Code:
    ${code}
    
    Return ONLY the modified code snippet, no explanations or markdown code blocks.`,
    config: {
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
    }
  });
  return response.text;
};

export const chatWithAI = async (message: string, history: { role: string, parts: { text: string }[] }[], userKey?: string) => {
  const client = getAIClient(userKey);
  const chat = client.chats.create({
    model: "gemini-3-flash-preview", // Switched to flash for speed
    config: {
      systemInstruction: "You are Nexus AI, a professional coding assistant. You help developers build, debug, and optimize their code. Be concise, technical, and helpful.",
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
    },
    history,
  });

  const response = await chat.sendMessage({ message });
  return response.text;
};

export const chatWithAIStream = async (message: string, history: { role: string, parts: { text: string }[] }[], onChunk: (text: string) => void, userKey?: string) => {
  const client = getAIClient(userKey);
  const chat = client.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: "You are Nexus AI, a professional coding assistant. You help developers build, debug, and optimize their code. Be concise, technical, and helpful.",
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
    },
    history,
  });

  const response = await chat.sendMessageStream({ message });
  let fullText = "";
  for await (const chunk of response) {
    const text = (chunk as GenerateContentResponse).text;
    if (text) {
      fullText += text;
      onChunk(fullText);
    }
  }
  return fullText;
};
