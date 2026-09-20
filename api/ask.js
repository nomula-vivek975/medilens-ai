const medicines = [
  {
    name: "Dolo-650",
    keywords: ["dolo"],
    ingredient: "Paracetamol",
    use: "fever and mild to moderate pain",
    caution: "Do not take more than the dose on the label. Be careful if you have liver problems."
  },
  {
    name: "Crocin",
    keywords: ["crocin"],
    ingredient: "Paracetamol",
    use: "fever and mild pain like headache",
    caution: "Do not combine with other paracetamol medicines."
  },
  {
    name: "Calpol",
    keywords: ["calpol"],
    ingredient: "Paracetamol",
    use: "fever and pain, also available as syrup for children",
    caution: "Follow the age and weight based dose on the label."
  }
  // add your other medicines here in the same format
];

module.exports = (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST" });
  }

  const question = ((req.body && req.body.question) || "").toLowerCase();

  const found = medicines.filter(m =>
    m.keywords.some(k => question.includes(k)) ||
    question.includes(m.ingredient.toLowerCase())
  );

  if (found.length === 0) {
    return res.json({
      answer: "Sorry, I only know a few sample medicines right now. Try asking about Dolo-650, Crocin or Calpol."
    });
  }

  const text = found
    .map(m => `${m.name} (${m.ingredient}) is used for ${m.use}. ${m.caution}`)
    .join("\n\n");

  res.json({
    answer: text + "\n\nThis is general information only. Please consult a doctor or pharmacist."
  });
};
