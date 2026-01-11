
import { GoogleGenAI } from "@google/genai";
import { Bet } from "../types";

export const getBettingInsights = async (bets: Bet[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const summary = bets.map(b => 
    `Jogo: ${b.match}, Odds: ${b.odds}, Stake: R$${b.stake}, Status: ${b.status}, Lucro: R$${b.profit}`
  ).join('\n');

  const prompt = `
    Como um analista profissional de apostas esportivas, analise o seguinte histórico de apostas e forneça 3 dicas práticas para melhorar os resultados:
    
    ${summary}

    Considere:
    1. Gestão de banca (stakes variadas).
    2. Odds médias.
    3. Frequência de vitórias vs perdas.
    
    Responda em português de forma concisa e profissional.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Erro ao obter insights:", error);
    return "Não foi possível gerar insights no momento. Verifique sua banca e mantenha a disciplina.";
  }
};
