// Translates English phrases into Korean with the translator that is built into the browser
// (the Translator API in Chrome 138+ and Edge 148+ on a computer). It needs no API key and
// translates on the computer itself. The first time, the browser downloads the language model.

// The translator is created once and then reused
let englishToKorean = null;

// Returns true if this browser has a built-in translator
function hasBuiltInTranslator() {
  return "Translator" in self;
}

// Creates the English → Korean translator. onProgress is called with 0–100 while the
// language model is downloading.
async function getTranslator(onProgress) {
  if (englishToKorean) {
    return englishToKorean;
  }

  const languages = { sourceLanguage: "en", targetLanguage: "ko" };
  const availability = await Translator.availability(languages);
  if (availability === "unavailable") {
    throw new Error("The browser cannot translate from English to Korean.");
  }

  englishToKorean = await Translator.create({
    ...languages,
    monitor(monitor) {
      monitor.addEventListener("downloadprogress", (event) => {
        onProgress(Math.round(event.loaded * 100));
      });
    },
  });
  return englishToKorean;
}

// Translates an English phrase and romanizes the result.
// Returns { korean, romanization } or throws an Error with a message for the user.
async function translatePhrase(english, onProgress = () => {}) {
  if (!hasBuiltInTranslator()) {
    throw new Error(
      "This browser has no built-in translator. Use Chrome (version 138 or newer) on a computer, or fill in the fields yourself."
    );
  }

  let korean;
  try {
    const translator = await getTranslator(onProgress);
    korean = await translator.translate(english);
  } catch (error) {
    console.error("Translation failed:", error);
    throw new Error(error.message || "The translation failed. Try again.");
  }

  korean = korean.trim();
  return { korean, romanization: romanize(korean) };
}
