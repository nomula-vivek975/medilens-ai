module.exports = async (req, res) => {
  const { question } = req.body;

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-sonnet-5",
      max_tokens: 500,
      system: "You give simple, general information about medicines. No diagnosis, no doses. For personal medical questions, say to consult a doctor.",
      messages: [{ role: "user", content: question }]
    })
  });

  const data = await r.json();
  res.json({ answer: data.content[0].text });
};
