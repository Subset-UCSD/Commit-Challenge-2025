type GeminiGenerateContentResponse = {
  candidates: {
    content: {
      parts: {
        text: string
      }[]
    }
  }[]
}

async function askGemini(prompt: string): Promise<string> {
  const response: GeminiGenerateContentResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API}`, {
    "headers": {
      "content-type": "application/json",
    },
    method: 'POST',
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ]
    })
  }).then(r => r.json()) as any
  return response.candidates[0].content.parts[0].text
}

export async function llm(prompt: string): Promise<string> {
  return askGemini(prompt)
}