// Generates the Korean phrase, romanization and explanation from an English phrase with
// Google's Gemini API. The API key is typed in on the "Manage phrases" page and saved in
// this browser only (localStorage), so it is never part of the code.

// Change the model name here if Google replaces it with a newer one
const GEMINI_MODEL = "gemini-3.6-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const GEMINI_KEY_STORAGE_KEY = "korean-quiz-gemini-key";

// Returns the saved API key, or an empty string if there is none
function getGeminiKey() {
  try {
    return localStorage.getItem(GEMINI_KEY_STORAGE_KEY) || "";
  } catch (error) {
    return "";
  }
}

function saveGeminiKey(key) {
  localStorage.setItem(GEMINI_KEY_STORAGE_KEY, key);
}

function removeGeminiKey() {
  localStorage.removeItem(GEMINI_KEY_STORAGE_KEY);
}

// The instructions sent to Gemini together with the English phrase
function buildPrompt(english) {
  return `You help beginners learn everyday Korean.
Translate the English phrase below into natural, polite everyday Korean, the way a Korean
person would actually say it in daily life (polite 해요 style, do not use 당신).

Answer with JSON only, in this format:
{
  "korean": "the phrase in Hangul",
  "romanization": "Revised Romanization of Korean, lowercase, written as it is pronounced",
  "note": "one or two short sentences in English for a beginner: explain a useful word or grammar point in the phrase, or when to use it"
}

English phrase: ${english}`;
}

// Turns an error response from Gemini into a short message for the user
function getGeminiErrorMessage(status, details) {
  if (status === 400 && details.includes("API key")) {
    return "The Gemini API key is not valid. Check the key under \"Gemini API key\".";
  }
  if (status === 403) {
    return "The API key is not allowed to use Gemini. Make sure the Gemini API is enabled for it.";
  }
  if (status === 404) {
    return `The model "${GEMINI_MODEL}" was not found. Change GEMINI_MODEL in js/phrase-generator.js.`;
  }
  if (status === 429) {
    return "Too many requests or the free quota is used up. Wait a minute and try again.";
  }
  return `Gemini could not generate the phrase (error ${status}).`;
}

// Asks Gemini for the Korean version of an English phrase.
// Returns { korean, romanization, note } or throws an Error with a message for the user.
async function generatePhrase(english) {
  const apiKey = getGeminiKey();
  if (!apiKey) {
    throw new Error("Add your Gemini API key first (under \"Gemini API key\" below the form).");
  }

  let response;
  try {
    response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(english) }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    });
  } catch (error) {
    console.error("Gemini request failed:", error);
    throw new Error("Could not reach Gemini. Check your internet connection.");
  }

  if (!response.ok) {
    const details = await response.text();
    console.error("Gemini error:", response.status, details);
    throw new Error(getGeminiErrorMessage(response.status, details));
  }

  const data = await response.json();
  // The answer is in the text parts of the first candidate (thinking parts are skipped)
  const parts = data.candidates?.[0]?.content?.parts || [];
  const text = parts
    .filter((part) => part.text && !part.thought)
    .map((part) => part.text)
    .join("");

  let result;
  try {
    // Remove ```json fences in case the model adds them
    result = JSON.parse(text.replace(/```(json)?/g, "").trim());
  } catch (error) {
    console.error("Could not read Gemini answer:", text);
    throw new Error("Gemini gave an answer that could not be read. Try again.");
  }
  if (!result.korean) {
    throw new Error("Gemini did not return a Korean phrase. Try again.");
  }

  return {
    korean: String(result.korean).trim(),
    romanization: String(result.romanization || "").trim(),
    note: String(result.note || "").trim(),
  };
}
