const medicines = {
  dolo:      { ingredients: ["paracetamol"], aliases: ["dolo650", "dolo"] },
  crocin:    { ingredients: ["paracetamol"], aliases: ["crocin"] },
  calpol:    { ingredients: ["paracetamol"], aliases: ["calpol"] },
  brufen:    { ingredients: ["ibuprofen"], aliases: ["brufen"] },
  combiflam: { ingredients: ["ibuprofen", "paracetamol"], aliases: ["combiflam"] },
  cetzine:   { ingredients: ["cetirizine"], aliases: ["cetzine"] },
  allegra:   { ingredients: ["fexofenadine"], aliases: ["allegra"] },
  pan40:     { ingredients: ["pantoprazole"], aliases: ["pan40"] },
  azithral:  { ingredients: ["azithromycin"], aliases: ["azithral"] },
  okacet:    { ingredients: ["cetirizine"], aliases: ["okacet"] },
  pantocid:  { ingredients: ["pantoprazole"], aliases: ["pantocid"] },
  azee:      { ingredients: ["azithromycin"], aliases: ["azee"] },
  limcee:    { ingredients: ["ascorbic acid", "vitamin c"], aliases: ["limcee"] }
};

const ADVICE_WORDS = [
  "dose", "dosage", "how many", "how much", "how often", "how long",
  "side effect", "alcohol", "pregnan", "breastfeed", "child", "kid",
  "baby", "infant", "interact", "overdose", "safe to", "can i take",
  "can i give", "should i take", "should i give", "empty stomach",
  "with food", "mix", "combine"
];

const clean = (t) => String(t).toLowerCase().replace(/[^a-z0-9]/g, "");

module.exports = (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST" });
  }

  const question = String((req.body && req.body.question) || "");
  const lower = question.toLowerCase();
  const cleaned = clean(question);

  // 1) dosage / safety / personal advice -> polite refusal
  if (ADVICE_WORDS.some((w) => lower.includes(w))) {
    return res.json({
      type: "advice",
      message:
        "This prototype only shares general medicine information. It does not give dosage, safety or personal medical advice. Please ask a doctor or pharmacist."
    });
  }

  // 2) a medicine name was mentioned
  const byName = Object.keys(medicines).filter((key) =>
    medicines[key].aliases.some((a) => cleaned.includes(clean(a)))
  );
  if (byName.length > 0) {
    return res.json({ type: "medicines", keys: byName });
  }

  // 3) an ingredient was mentioned
  const byIngredient = Object.keys(medicines).filter((key) =>
    medicines[key].ingredients.some((i) => cleaned.includes(clean(i)))
  );
  if (byIngredient.length > 0) {
    return res.json({ type: "medicines", keys: byIngredient });
  }

  // 4) nothing found
  return res.json({
    type: "none",
    message: "I don't have that in this prototype yet. Try asking about a medicine name or an active ingredient."
  });
};
