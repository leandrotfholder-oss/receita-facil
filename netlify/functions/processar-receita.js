import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `Você é um assistente especializado em leitura de receitas médicas brasileiras.
Analise a imagem da receita e extraia as informações com precisão.
Responda SEMPRE em JSON puro, sem markdown, sem blocos de código.
Se não conseguir ler algum campo, use null.
Seja conservador: nunca invente informações que não estão claramente visíveis.`;

const USER_PROMPT = `Analise esta receita médica e retorne um JSON com esta estrutura exata:

{
  "medicamentos": [
    {
      "nome_original": "nome como escrito na receita",
      "nome_legivel": "nome em letras maiúsculas legíveis",
      "dosagem": "ex: 500mg",
      "forma": "ex: comprimido, cápsula, solução",
      "posologia": "ex: 1 comprimido a cada 8 horas",
      "duracao": "ex: por 7 dias",
      "quantidade": "ex: 21 comprimidos"
    }
  ],
  "medico": {
    "nome": "nome do médico se visível",
    "crm": "CRM se visível"
  },
  "paciente": "nome do paciente se visível",
  "data": "data da receita se visível",
  "observacoes": "instruções adicionais se houver",
  "legibilidade": "boa|regular|ruim",
  "tipo_receita": "comum|controlada|especial"
}`;

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Método não permitido" }),
    };
  }

  try {
    const { image, farmacia_id } = JSON.parse(event.body);

    if (!image) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Imagem não enviada" }),
      };
    }

    // Remove prefixo base64 se presente
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

    const response = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: base64Data,
              },
            },
            {
              type: "text",
              text: USER_PROMPT,
            },
          ],
        },
      ],
    });

    const rawText = response.content[0].text.trim();

    let resultado;
    try {
      resultado = JSON.parse(rawText);
    } catch {
      // fallback: tenta extrair JSON da resposta
      const match = rawText.match(/\{[\s\S]*\}/);
      resultado = match ? JSON.parse(match[0]) : { erro_parse: rawText };
    }

    // Log simples para analytics (em produção: salvar no banco)
    console.log(
      JSON.stringify({
        farmacia_id: farmacia_id || "desconhecida",
        timestamp: new Date().toISOString(),
        medicamentos_count: resultado.medicamentos?.length || 0,
        legibilidade: resultado.legibilidade,
        tipo_receita: resultado.tipo_receita,
        tokens_usados: response.usage?.input_tokens + response.usage?.output_tokens,
      })
    );

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ sucesso: true, resultado }),
    };
  } catch (err) {
    console.error("Erro ao processar receita:", err);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        sucesso: false,
        error: "Erro ao processar receita. Tente novamente.",
      }),
    };
  }
};
