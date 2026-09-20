// =====================================================================
// MediLens AI prototype - script.js
//
// SAMPLE DATASET: general information only, for an educational demo.
// Check every entry against the real pack / manufacturer leaflet
// before you present it as fact, and name your source in the deck.
// =====================================================================

const medicines = {
    dolo: {
        name: "Dolo-650",
        ingredients: ["Paracetamol"],
        strength: "650 mg",
        form: "Tablet",
        category: "Pain and fever",
        uses: "Pain and fever relief",
        aliases: ["dolo", "d0lo"]
    },

    crocin: {
        name: "Crocin",
        ingredients: ["Paracetamol"],
        strength: "500 mg",
        form: "Tablet",
        category: "Pain and fever",
        uses: "Pain and fever relief",
        aliases: ["crocin", "crocln"]
    },

    calpol: {
        name: "Calpol",
        ingredients: ["Paracetamol"],
        strength: "500 mg",
        form: "Tablet",
        category: "Pain and fever",
        uses: "Pain and fever relief",
        aliases: ["calpol", "calpo1"]
    },

    brufen: {
        name: "Brufen",
        ingredients: ["Ibuprofen"],
        strength: "400 mg",
        form: "Tablet",
        category: "Pain and fever",
        uses: "Pain, inflammation and fever relief",
        aliases: ["brufen"]
    },

    combiflam: {
        name: "Combiflam",
        ingredients: ["Ibuprofen", "Paracetamol"],
        strength: "400 mg + 325 mg",
        form: "Tablet",
        category: "Pain and fever",
        uses: "Pain and fever relief",
        aliases: ["combiflam", "comblflam"]
    },

    cetzine: {
        name: "Cetzine",
        ingredients: ["Cetirizine"],
        strength: "10 mg",
        form: "Tablet",
        category: "Allergy",
        uses: "Relief from allergy symptoms such as sneezing, runny nose and itching",
        aliases: ["cetzine", "cetz1ne"]
    },

    allegra: {
        name: "Allegra",
        ingredients: ["Fexofenadine"],
        strength: "120 mg",
        form: "Tablet",
        category: "Allergy",
        uses: "Relief from allergy symptoms such as sneezing and itching",
        aliases: ["allegra", "aliegra"]
    },

    pan40: {
        name: "Pan-40",
        ingredients: ["Pantoprazole"],
        strength: "40 mg",
        form: "Gastro-resistant tablet",
        category: "Acidity",
        uses: "Acid reflux and acidity-related stomach problems",
        aliases: []
    },

    azithral: {
        name: "Azithral 500",
        ingredients: ["Azithromycin"],
        strength: "500 mg",
        form: "Tablet",
        category: "Antibiotic",
        uses: "Treating certain bacterial infections",
        note: "Antibiotics are prescription medicines. They work only " +
              "against bacterial infections and should be used only as " +
              "directed by a doctor.",
        aliases: ["azithral", "azithra1"]
    },

    okacet: {
        name: "Okacet",
        ingredients: ["Cetirizine"],
        strength: "10 mg",
        form: "Tablet",
        category: "Allergy",
        uses: "Relief from allergy symptoms such as sneezing, runny nose and itching",
        aliases: ["okacet"]
    },

    pantocid: {
        name: "Pantocid 40",
        ingredients: ["Pantoprazole"],
        strength: "40 mg",
        form: "Gastro-resistant tablet",
        category: "Acidity",
        uses: "Acid reflux and acidity-related stomach problems",
        aliases: ["pantocid"]
    },

    azee: {
        name: "Azee 500",
        ingredients: ["Azithromycin"],
        strength: "500 mg",
        form: "Tablet",
        category: "Antibiotic",
        uses: "Treating certain bacterial infections",
        note: "Antibiotics are prescription medicines. They work only " +
              "against bacterial infections and should be used only as " +
              "directed by a doctor.",
        aliases: []
    },

    limcee: {
        name: "Limcee",
        ingredients: ["Ascorbic acid (Vitamin C)"],
        strength: "500 mg",
        form: "Chewable tablet",
        category: "Vitamin supplement",
        uses: "Vitamin C supplement",
        aliases: ["limcee", "limcec"]
    }
};


// Words that mean the person wants dosage / safety / personal advice.
// MediLens only shares general information, so these get a polite refusal.
const ADVICE_WORDS = [
    "dose", "dosage", "how many", "how much", "how often", "how long",
    "side effect", "alcohol", "pregnan", "breastfeed", "child", "kid",
    "baby", "infant", "interact", "overdose", "safe to", "can i take",
    "can i give", "should i take", "should i give", "empty stomach",
    "with food", "mix", "combine"
];


// ---------------- HELPERS ----------------

// lowercase and keep only letters and digits (makes OCR matching forgiving)
function clean(text) {
    return String(text).toLowerCase().replace(/[^a-z0-9]/g, "");
}

// user-typed and OCR text must never be inserted into the page unescaped
function escapeHTML(text) {
    return String(text).replace(/[&<>"']/g, function (c) {
        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            "\"": "&quot;",
            "'": "&#39;"
        }[c];
    });
}

function ingredientText(m) {
    return m.ingredients.join(" + ");
}

// "Ascorbic acid (Vitamin C)" -> ["ascorbic acid", "vitamin c"]
function ingredientNames(ingredient) {
    return ingredient
        .split(/[()]/)
        .map(function (s) { return s.trim().toLowerCase(); })
        .filter(Boolean);
}

function allIngredients() {
    const seen = [];
    Object.keys(medicines).forEach(function (key) {
        medicines[key].ingredients.forEach(function (ing) {
            if (seen.indexOf(ing) === -1) {
                seen.push(ing);
            }
        });
    });
    return seen;
}

function supportedNames() {
    return Object.keys(medicines).map(function (key) {
        return medicines[key].name;
    });
}

function showResult(html) {
    document.getElementById("result").innerHTML = html;
}


// ---------------- MATCHING LOGIC (no page access) ----------------

// Brand names only. We deliberately do NOT match on strength or ingredient
// here, so another brand of the same ingredient is never mislabelled.
//
// fuzzy = true (used by the scanner only) also tolerates small OCR mistakes
// such as 0/o, 1/l/i, 5/s and rn/m.
function brandNames(m) {
    return [clean(m.name)].concat(m.aliases.map(clean)).filter(Boolean);
}

// makes look-alike characters identical so OCR slips do not matter
function normalizeOCR(text) {
    return clean(text)
        .replace(/rn/g, "m")
        .replace(/0/g, "o")
        .replace(/[1i]/g, "l")
        .replace(/5/g, "s");
}

// true if `needle` appears in `haystack` with at most `maxMismatch`
// different characters
function fuzzyContains(haystack, needle, maxMismatch) {

    const L = needle.length;

    for (let i = 0; i + L <= haystack.length; i++) {

        let bad = 0;

        for (let j = 0; j < L && bad <= maxMismatch; j++) {
            if (haystack.charCodeAt(i + j) !== needle.charCodeAt(j)) {
                bad++;
            }
        }

        if (bad <= maxMismatch) {
            return true;
        }
    }

    return false;
}

function findMedicinesInText(text, fuzzy) {

    const cleaned = clean(text);
    const keys = Object.keys(medicines);

    // 1) exact brand-name match
    const exact = keys.filter(function (key) {
        return brandNames(medicines[key]).some(function (n) {
            return cleaned.indexOf(n) !== -1;
        });
    });

    if (exact.length > 0 || !fuzzy) {
        return exact;
    }

    // 2) OCR-tolerant match (only names of 6+ characters)
    const norm = normalizeOCR(text);

    return keys.filter(function (key) {
        return brandNames(medicines[key]).some(function (n) {

            if (n.length < 6) {
                return false;
            }

            const allowed = n.length >= 10 ? 2 : 1;

            return fuzzyContains(norm, normalizeOCR(n), allowed);
        });
    });
}

function findIngredientsInText(text) {
    const cleaned = clean(text);

    return allIngredients().filter(function (ing) {
        return ingredientNames(ing).some(function (n) {
            return cleaned.indexOf(clean(n)) !== -1;
        });
    });
}

function matchedIngredients(query) {
    const q = query.trim().toLowerCase();

    if (q.length < 3) {
        return [];
    }

    return allIngredients().filter(function (ing) {
        return ingredientNames(ing).some(function (n) {
            return n.indexOf(q) !== -1 || q.indexOf(n) !== -1;
        });
    });
}

function medicinesByIngredient(query) {
    const matched = matchedIngredients(query);

    return Object.keys(medicines).filter(function (key) {
        return medicines[key].ingredients.some(function (ing) {
            return matched.indexOf(ing) !== -1;
        });
    });
}

function isAdviceQuestion(question) {
    const q = question.toLowerCase();

    return ADVICE_WORDS.some(function (w) {
        return q.indexOf(w) !== -1;
    });
}


// ---------------- SHARED HTML PIECES ----------------

const NOTICE_TEXT =
    "This information is displayed for educational demonstration of " +
    "the MediLens AI prototype. It is not personal medical advice.";

function noticeBox(text) {
    return `
        <div class="warning">
            <strong>⚠️ Prototype Notice</strong>
            <p>${text || NOTICE_TEXT}</p>
        </div>
    `;
}

function sourcesBox() {
    return `
        <div class="source">
            <strong>📚 Evidence &amp; Sources</strong>
            <p>
                The full version of MediLens AI would connect this
                information to verified medical and pharmaceutical
                sources.
            </p>
        </div>
    `;
}

function noteBox(m) {
    if (!m.note) {
        return "";
    }

    return `
        <div class="source">
            <strong>💡 Good to know</strong>
            <p>${m.note}</p>
        </div>
    `;
}

function medicineFacts(m) {
    const label = m.ingredients.length > 1
        ? "Active Ingredients"
        : "Active Ingredient";

    return `
        <p>
            <strong>🧪 ${label}</strong><br>
            ${ingredientText(m)}
        </p>

        <p>
            <strong>⚖️ Strength</strong><br>
            ${m.strength}
        </p>

        <p>
            <strong>💊 Form</strong><br>
            ${m.form}
        </p>

        <p>
            <strong>🏷️ Category</strong><br>
            ${m.category}
        </p>
    `;
}

// A list of medicines (used by ingredient search, scan fallback and Ask AI)
function renderMedicineList(heading, intro, keys) {
    const items = keys.map(function (key) {
        const m = medicines[key];

        return `
            <div class="source">
                💊 <strong>${m.name}</strong>

                <p>
                    <strong>Active ingredient:</strong>
                    ${ingredientText(m)}<br>
                    <strong>Strength:</strong> ${m.strength}<br>
                    <strong>Form:</strong> ${m.form}<br>
                    <strong>General information:</strong>
                    ${m.uses}
                </p>
            </div>
        `;
    }).join("");

    showResult(`
        <div class="medicine-card">

            <h2>🔎 Search Result</h2>

            <p style="text-align:center; color:#667085;">
                ${intro}
            </p>

            <hr>

            <h3>${heading}</h3>

            ${items}

            ${noticeBox(
                "This result is based on the demo medicine database " +
                "used in the MediLens AI prototype."
            )}

            ${sourcesBox()}

        </div>
    `);
}


// ---------------- SCAN MEDICINE ----------------

function scanMedicine() {
    document.getElementById("medicineImage").click();
}


// Loads the photo, sizes it so text is big enough for OCR (but not slow),
// and turns it into a high-contrast grayscale canvas.
function prepareImage(file) {
    return new Promise(function (resolve, reject) {

        const url = URL.createObjectURL(file);
        const image = new Image();

        image.onload = function () {

            const longest = Math.max(image.width, image.height);

            let scale = 1;

            if (longest > 2400) {
                scale = 2400 / longest;
            } else if (longest < 1200) {
                scale = 1200 / longest;
            }

            const canvas = document.createElement("canvas");
            canvas.width = Math.round(image.width * scale);
            canvas.height = Math.round(image.height * scale);

            canvas.getContext("2d")
                .drawImage(image, 0, 0, canvas.width, canvas.height);

            URL.revokeObjectURL(url);

            try {
                enhanceContrast(canvas);
            } catch (e) {
                console.warn("Contrast step skipped:", e);
            }

            resolve(canvas);
        };

        image.onerror = function () {
            URL.revokeObjectURL(url);
            reject(new Error("Could not load the selected image."));
        };

        image.src = url;
    });
}


// grayscale + stretch so the darkest 2% becomes black, brightest 2% white
function enhanceContrast(canvas) {

    const ctx = canvas.getContext("2d");
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = img.data;
    const hist = new Array(256).fill(0);

    for (let i = 0; i < d.length; i += 4) {
        const g = Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]);
        d[i] = d[i + 1] = d[i + 2] = g;
        hist[g]++;
    }

    const total = d.length / 4;
    let low = 0;
    let high = 255;
    let acc = 0;

    for (let v = 0; v < 256; v++) {
        acc += hist[v];
        if (acc >= total * 0.02) { low = v; break; }
    }

    acc = 0;

    for (let v = 255; v >= 0; v--) {
        acc += hist[v];
        if (acc >= total * 0.02) { high = v; break; }
    }

    const range = Math.max(1, high - low);

    for (let i = 0; i < d.length; i += 4) {
        const v = Math.min(255, Math.max(0, Math.round((d[i] - low) * 255 / range)));
        d[i] = d[i + 1] = d[i + 2] = v;
    }

    ctx.putImageData(img, 0, 0);
}


// light text on a dark background (common on foil strips) reads better inverted
function invertedCopy(canvas) {

    const copy = document.createElement("canvas");
    copy.width = canvas.width;
    copy.height = canvas.height;

    const ctx = copy.getContext("2d");
    ctx.drawImage(canvas, 0, 0);

    const img = ctx.getImageData(0, 0, copy.width, copy.height);
    const d = img.data;

    for (let i = 0; i < d.length; i += 4) {
        d[i] = 255 - d[i];
        d[i + 1] = 255 - d[i + 1];
        d[i + 2] = 255 - d[i + 2];
    }

    ctx.putImageData(img, 0, 0);

    return copy;
}


// One OCR pass. Sparse-text mode suits packaging, where words are scattered.
// If that mode is not available, it falls back to the plain OCR call.
async function runOCR(canvas, label) {

    const logger = function (info) {
        if (info.status === "recognizing text") {
            showResult(
                "🔍 " + label + "... " +
                Math.round(info.progress * 100) + "%"
            );
        }
    };

    let worker = null;

    try {

        worker = await Tesseract.createWorker("eng", 1, { logger: logger });

        await worker.setParameters({ tessedit_pageseg_mode: "11" });

        const result = await worker.recognize(canvas);

        return result.data.text || "";

    } catch (error) {

        console.warn("Sparse OCR failed, using simple OCR:", error);

        const result = await Tesseract.recognize(canvas, "eng", { logger: logger });

        return result.data.text || "";

    } finally {

        if (worker) {
            try { await worker.terminate(); } catch (e) { /* ignore */ }
        }
    }
}


async function showImage(event) {

    const file = event.target.files[0];

    if (!file) {
        return;
    }

    showResult("🔍 Reading medicine image...");

    try {

        const canvas = await prepareImage(file);

        let text = await runOCR(canvas, "Reading text");

        // nothing recognised? try once more on the inverted image
        if (findMedicinesInText(text, true).length === 0) {
            const second = await runOCR(invertedCopy(canvas), "Trying again");
            text = text + "\n" + second;
        }

        handleScanText(text);

    } catch (error) {

        console.error(error);

        showResult("❌ OCR failed. Please try again.");

    } finally {

        // lets the person pick the same photo again
        event.target.value = "";
    }
}


function handleScanText(text) {

    console.log("OCR TEXT:", text);

    const matches = findMedicinesInText(text, true);

    // exactly one brand found -> confident match
    if (matches.length === 1) {
        showMedicine(medicines[matches[0]]);
        return;
    }

    // more than one brand found -> do not guess
    if (matches.length > 1) {

        const names = matches.map(function (key) {
            return medicines[key].name;
        }).join(", ");

        showResult(`
            <div class="medicine-card">

                <h2>🔍 Medicine Scan Result</h2>

                <p>
                    More than one medicine name was detected:
                    <strong>${names}</strong>.
                </p>

                <div class="warning">
                    <strong>💡 Try this</strong>
                    <p>
                        Scan one medicine at a time so MediLens AI
                        does not confuse them.
                    </p>
                </div>

            </div>
        `);
        return;
    }

    // no brand, but an ingredient we know was read from the pack
    const ingredients = findIngredientsInText(text);

    if (ingredients.length > 0) {

        const keys = Object.keys(medicines).filter(function (key) {
            return medicines[key].ingredients.some(function (ing) {
                return ingredients.indexOf(ing) !== -1;
            });
        });

        // did the pack also show a strength we know (e.g. "650 mg")?
        const cleaned = clean(text);

        const sameStrength = keys.filter(function (key) {
            const number = medicines[key].strength.match(/\d+/);
            return number && cleaned.indexOf(number[0] + "mg") !== -1;
        });

        let intro;
        let shownKeys = keys;

        if (sameStrength.length === 1) {

            shownKeys = sameStrength;

            intro = "Brand not recognised, but the ingredient and strength (" +
                    medicines[sameStrength[0]].strength +
                    ") were read from the pack. Closest match in this " +
                    "prototype, please confirm against the pack:";

        } else if (sameStrength.length > 1) {

            shownKeys = sameStrength;

            intro = "Brand not recognised, but the ingredient and strength " +
                    "were read from the pack. Supported medicines matching both:";

        } else {

            intro = "Brand not recognised, but this ingredient was read from " +
                    "the pack. Supported medicines with it:";
        }

        renderMedicineList(
            "🧪 " + escapeHTML(ingredients.join(" / ")),
            intro,
            shownKeys
        );
        return;
    }

    // nothing recognised
    const shown = text.trim().slice(0, 300);

    showResult(`
        <div class="medicine-card">

            <h2>🔍 Medicine Scan Result</h2>

            <p>
                I couldn't confidently identify this medicine.
            </p>

            <p>
                <strong>OCR detected:</strong>
            </p>

            <p>
                ${shown ? escapeHTML(shown) : "No readable text"}
            </p>

            <div class="warning">
                <strong>💡 Try this</strong>

                <p>
                    Take a clear photo of the medicine name on the
                    package, in good light and without glare. You can
                    also search by ingredient or use Ask AI.
                </p>
            </div>

        </div>
    `);
}


function showMedicine(m) {

    showResult(`
        <div class="medicine-card">

            <h2>💊 Medicine Detected</h2>

            <p style="text-align:center; color:#667085;">
                MediLens AI prototype result
            </p>

            <hr>

            <h3>${m.name}</h3>

            ${medicineFacts(m)}

            <hr>

            <h3>📋 General Information</h3>

            <p>${m.uses}</p>

            ${noteBox(m)}

            ${noticeBox()}

            ${sourcesBox()}

        </div>
    `);
}


// ---------------- INGREDIENT SEARCH ----------------

function searchIngredient() {

    document.getElementById("ingredientSearch").style.display = "block";

    document.getElementById("ingredientInput").focus();
}


function findIngredient() {

    const query = document
        .getElementById("ingredientInput")
        .value
        .trim();

    if (!query) {
        showResult("⚠️ Please enter an ingredient.");
        return;
    }

    const keys = medicinesByIngredient(query);

    if (keys.length > 0) {

        renderMedicineList(
            "🧪 " + escapeHTML(matchedIngredients(query).join(" / ")),
            "Medicines found in this prototype",
            keys
        );
        return;
    }

    showResult(`
        <div class="medicine-card">

            <h2>🔎 Search Result</h2>

            <p>
                No prototype result found for
                <strong>${escapeHTML(query)}</strong>.
            </p>

            <div class="warning">
                <strong>💡 Try this</strong>

                <p>
                    Ingredients in this prototype:<br>
                    <strong>${escapeHTML(allIngredients().join(", "))}</strong>
                </p>
            </div>

        </div>
    `);
}


// ---------------- ASK AI ----------------

function askAI() {

    document.getElementById("aiSearch").style.display = "block";

    document.getElementById("aiInput").focus();
}


function askQuestionLocal() {

    const question = document
        .getElementById("aiInput")
        .value
        .trim();

    if (!question) {
        showResult("⚠️ Please enter a question.");
        return;
    }

    const safeQuestion = escapeHTML(question);
    const found = findMedicinesInText(question);


    // dosage / safety / personal advice -> polite refusal
    if (isAdviceQuestion(question)) {

        showResult(`
            <div class="medicine-card">

                <h2>🤖 MediLens AI</h2>

                <p>
                    <strong>Your question:</strong><br>
                    ${safeQuestion}
                </p>

                <hr>

                <div class="warning">

                    <strong>⚠️ I can't help with that</strong>

                    <p>
                        This prototype only shares general medicine
                        information. It does not give dosage, safety
                        or personal medical advice. Please ask a
                        doctor or pharmacist.
                    </p>

                </div>

                <p>
                    You can ask what a supported medicine is, or
                    search by active ingredient.
                </p>

            </div>
        `);
        return;
    }


    // exactly one medicine named
    if (found.length === 1) {

        const m = medicines[found[0]];

        showResult(`
            <div class="medicine-card">

                <h2>🤖 MediLens AI</h2>

                <p>
                    <strong>Your question:</strong><br>
                    ${safeQuestion}
                </p>

                <hr>

                <h3>${m.name}</h3>

                ${medicineFacts(m)}

                <p>
                    <strong>General information:</strong><br>
                    ${m.uses}
                </p>

                ${noteBox(m)}

                <div class="warning">

                    <strong>⚠️ Important</strong>

                    <p>
                        This information is for education only and
                        does not replace advice from a qualified
                        healthcare professional.
                    </p>

                </div>

            </div>
        `);
        return;
    }


    // several medicines named -> list them and point to Compare
    if (found.length > 1) {

        renderMedicineList(
            "💊 Medicines mentioned",
            "You mentioned more than one medicine. Use Compare to " +
            "see them side by side.",
            found
        );
        return;
    }


    // an ingredient named -> list medicines that contain it
    const keys = medicinesByIngredient(question).length > 0
        ? medicinesByIngredient(question)
        : Object.keys(medicines).filter(function (key) {
            const ingredients = findIngredientsInText(question);
            return medicines[key].ingredients.some(function (ing) {
                return ingredients.indexOf(ing) !== -1;
            });
        });

    if (keys.length > 0) {

        renderMedicineList(
            "🧪 " + escapeHTML(
                findIngredientsInText(question).join(" / ") ||
                matchedIngredients(question).join(" / ")
            ),
            "Supported medicines with this ingredient",
            keys
        );
        return;
    }


    // nothing recognised
    showResult(`
        <div class="medicine-card">

            <h2>🤖 MediLens AI</h2>

            <p>
                I don't have that in this prototype yet. Currently it
                supports:
            </p>

            <p>
                ${supportedNames().map(function (n) {
                    return "💊 " + n;
                }).join("<br>")}
            </p>

        </div>
    `);
}


// ---------------- COMPARE ----------------

function compareMedicines() {
    document.getElementById("compareSearch").style.display = "block";
}


function compareColumn(m) {
    return `
        <div style="
            flex:1;
            padding:18px;
            background:#f8fafc;
            border-radius:12px;
            text-align:center;
        ">

            <h3>${m.name}</h3>

            <p>
                <strong>Ingredient</strong><br>
                ${ingredientText(m)}
            </p>

            <p>
                <strong>Strength</strong><br>
                ${m.strength}
            </p>

            <p>
                <strong>Form</strong><br>
                ${m.form}
            </p>

            <p>
                <strong>Category</strong><br>
                ${m.category}
            </p>

        </div>
    `;
}


function sharedIngredients(m1, m2) {
    return m1.ingredients.filter(function (i) {
        return m2.ingredients.indexOf(i) !== -1;
    });
}


// Says how the two medicines relate. It never says which one is "better".
function ingredientCheckText(m1, m2) {

    const shared = sharedIngredients(m1, m2);

    const same =
        shared.length === m1.ingredients.length &&
        shared.length === m2.ingredients.length;

    if (same) {
        return `Both contain the same active ingredient:
                <strong>${ingredientText(m1)}</strong>. They are
                different brands of the same medicine.`;
    }

    if (shared.length > 0) {
        return `They share the active ingredient
                <strong>${shared.join(" + ")}</strong>, but their full
                ingredient lists differ.`;
    }

    if (m1.category === m2.category) {
        return `Different active ingredients, but both are listed
                under <strong>${m1.category}</strong>.`;
    }

    return "These two medicines have different active ingredients " +
           "and different categories.";
}


// lists only the details that actually differ
function differences(m1, m2) {

    const fields = [
        ["Active ingredient", function (m) { return ingredientText(m); }],
        ["Strength", function (m) { return m.strength; }],
        ["Form", function (m) { return m.form; }],
        ["Category", function (m) { return m.category; }]
    ];

    return fields
        .filter(function (f) { return f[1](m1) !== f[1](m2); })
        .map(function (f) {
            return `<strong>${f[0]}:</strong> ${f[1](m1)} vs ${f[1](m2)}`;
        });
}


function showComparison() {

    const key1 = document.getElementById("medicine1").value;
    const key2 = document.getElementById("medicine2").value;

    if (!key1 || !key2) {
        showResult("⚠️ Please select two medicines.");
        return;
    }

    if (key1 === key2) {
        showResult("⚠️ Please select two different medicines.");
        return;
    }

    const m1 = medicines[key1];
    const m2 = medicines[key2];

    const diffs = differences(m1, m2);

    const diffText = diffs.length > 0
        ? diffs.join("<br>")
        : "No differences in the details shown here.";

    showResult(`
        <div class="medicine-card">

            <h2>⚖️ Medicine Comparison</h2>

            <p style="text-align:center; color:#667085;">
                Prototype comparison
            </p>

            <div style="
                display:flex;
                gap:15px;
                margin-top:25px;
            ">
                ${compareColumn(m1)}
                ${compareColumn(m2)}
            </div>

            <div class="source">
                <strong>🔎 Ingredient check</strong>
                <p>${ingredientCheckText(m1, m2)}</p>
            </div>

            <div class="source">
                <strong>📊 Key differences</strong>
                <p>${diffText}</p>
            </div>

            <hr>

            <h3>📋 General Information</h3>

            <p>
                <strong>${m1.name}:</strong><br>
                ${m1.uses}
            </p>

            <p>
                <strong>${m2.name}:</strong><br>
                ${m2.uses}
            </p>

            ${noteBox(m1.note ? m1 : m2)}

            ${noticeBox(
                "This comparison only shows differences in the listed " +
                "details. It does not say which medicine is better; that " +
                "is a decision for a doctor or pharmacist. Educational " +
                "demonstration only."
            )}

            ${sourcesBox()}

        </div>
    `);
}


// ---------------- STARTUP ----------------

// fills both Compare dropdowns from the dataset, grouped by category
// so it is easy to pick a meaningful pair (no HTML edits needed)
function populateCompareOptions() {

    const groups = {};
    const order = [];

    Object.keys(medicines).forEach(function (key) {

        const category = medicines[key].category;

        if (!groups[category]) {
            groups[category] = [];
            order.push(category);
        }

        groups[category].push(
            `<option value="${key}">${medicines[key].name}</option>`
        );
    });

    const options = order.map(function (category) {
        return `<optgroup label="${category}">` +
               groups[category].join("") +
               `</optgroup>`;
    }).join("");

    ["medicine1", "medicine2"].forEach(function (id, index) {

        const select = document.getElementById(id);

        if (!select) {
            return;
        }

        const first = index === 0
            ? "Select first medicine"
            : "Select second medicine";

        select.innerHTML = `<option value="">${first}</option>` + options;
    });
}


// press Enter instead of clicking the button
function bindEnter(id, action) {

    const input = document.getElementById(id);

    if (!input) {
        return;
    }

    input.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
            action();
        }
    });
}


function initMediLens() {
    populateCompareOptions();
    bindEnter("ingredientInput", findIngredient);
    bindEnter("aiInput", askQuestion);
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMediLens);
} else {
    initMediLens();
}
// ---------------- ASK AI (uses the backend, falls back to local) ----------------

async function askQuestion() {

    const question = document
        .getElementById("aiInput")
        .value
        .trim();

    if (!question) {
        showResult("⚠️ Please enter a question.");
        return;
    }

    showResult("🤖 Thinking...");

    try {

        const res = await fetch("/api/ask", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question: question })
        });

        if (!res.ok) {
            throw new Error("Backend returned " + res.status);
        }

        const data = await res.json();

        showBackendAnswer(question, data);

    } catch (error) {

        console.warn("Backend unavailable, using built-in answers:", error);

        askQuestionLocal();
    }
}


function showBackendAnswer(question, data) {

    const keys = (data.keys || []).filter(function (k) {
        return medicines[k];
    });

    if (data.type === "medicines" && keys.length === 1) {
        showMedicine(medicines[keys[0]]);
        return;
    }

    if (data.type === "medicines" && keys.length > 1) {
        renderMedicineList(
            "💊 Matching medicines",
            "Answer from the MediLens backend",
            keys
        );
        return;
    }

    showResult(`
        <div class="medicine-card">

            <h2>🤖 MediLens AI</h2>

            <p>
                <strong>Your question:</strong><br>
                ${escapeHTML(question)}
            </p>

            <hr>

            <div class="warning">
                <p>${escapeHTML(data.message || "I don't have that in this prototype yet.")}</p>
            </div>

        </div>
    `);
}
