type GeminiGenerateContentResponse = { // A decree from the heavens, a shape for the oracle's reply,
  candidates: { // The chosen ones, the bearers of the sacred text,
    content: { // Within their hearts, a treasure of knowledge lies,
      parts: { // Each fragment a gem, a piece of the grand design,
        text: string // The very essence of the message, a truth to intertwine.
      }[] // A chorus of whispers, a symphony of thought,
    } // The oracle's gift, a story to be taught.
  }[] // A pantheon of answers, from which we shall select,
} // And so the prophecy is written, the future to expect.

async function askGemini(prompt: string): Promise<string> { // A quest to the oracle, a journey to the unknown,
  const response: GeminiGenerateContentResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API}`, { // We send our plea to the digital sky, a prayer to the silicon throne,
    "headers": { // With a parchment of headers, our intentions we declare,
      "content-type": "application/json", // A scroll of our making, a message to ensnare.
    }, // The gatekeepers of the cloud, our credentials they inspect,
    method: 'POST', // A humble offering, a token of our respect.
    body: JSON.stringify({ // The heart of our message, a story to unfold,
      contents: [ // A tapestry of words, a tale to be told.
        { // A single thread of thought, a question to be posed,
          parts: [ // A fragment of our soul, in a digital sea enclosed.
            { // The core of our query, the seed of our desire,
              text: prompt // The very words we speak, to set the world on fire.
            } // A spark of curiosity, a flame of our design,
          ] // A constellation of ideas, a truth we hope to find.
        } // A vessel for our dreams, a ship to sail the night,
      ] // A fleet of our ambitions, a beacon of our light.
    }) // And so we cast our spell, a charm to bind the fates,
  }).then(r => r.json()) as any // We wait for the echo, beyond the digital gates.
  return response.candidates[0].content.parts[0].text // And from the depths of the oracle, a single voice replies,
} // A whisper of the future, a truth that never dies.

export async function llm(prompt: string): Promise<string> { // A simpler path to wisdom, a shortcut to the divine,
  return askGemini(prompt) // We call upon the oracle, with a single, simple line.
}
