const { buildSystemPrompt } = require("../systemPrompt");

async function generateEmail(req, res, next) {
  const { tone, recipientName, recipientRole, intent, keyPoints, senderName } = req.body;

  if (!intent || !recipientName) {
    const error = new Error("Please fill in at least the recipient name and the purpose of the email.");
    error.statusCode = 400;
    return next(error);
  }

  // System instructions (behavior rules) and user prompt (request payload)
  const systemPrompt = buildSystemPrompt();

  const userPrompt = `
Write an email with these details:
- Tone: ${tone}
- Recipient name: ${recipientName}
- Recipient role/relationship: ${recipientRole || "not specified"}
- Purpose of the email: ${intent}
- Key points to include: ${keyPoints || "not specified, use your best judgement"}
- Sender's name to sign off with: ${senderName || "not specified, leave a [Your Name] placeholder"}
`;

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === "paste_your_key_here") {
    const error = new Error("No Gemini API key found. Open the .env file and paste your API key into GEMINI_API_KEY.");
    error.statusCode = 500;
    return next(error);
  }

  const MODEL_NAME = "gemini-3.6-flash";
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`;

  try {
    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: userPrompt }],
          },
        ],
        generationConfig: {
          // Set thinking level low to prevent internal reasoning tokens from exhausting the max output budget
          thinkingConfig: {
            thinkingLevel: "low",
          },
          maxOutputTokens: 2048,
        },
      }),
    });

    const data = await geminiResponse.json();

    if (!geminiResponse.ok) {
      const error = new Error(data?.error?.message || "Something went wrong calling Gemini.");
      error.statusCode = 500;
      return next(error);
    }

    const candidate = data?.candidates?.[0];
    const draftText = candidate?.content?.parts?.[0]?.text?.trim();

    // Check if generation stopped prematurely due to maxOutputTokens limit
    if (candidate?.finishReason === "MAX_TOKENS") {
      const error = new Error(
        "The AI ran out of room and cut the email off early. Try again, or shorten your key points."
      );
      error.statusCode = 500;
      return next(error);
    }

    if (!draftText) {
      const error = new Error("The AI didn't return any text. Please try again.");
      error.statusCode = 500;
      return next(error);
    }

    res.json({ draft: draftText });

  } catch (err) {
    err.statusCode = 500;
    next(err);
  }
}

module.exports = { generateEmail };

