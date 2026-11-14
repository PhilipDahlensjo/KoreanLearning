// Turns Korean text (Hangul) into Latin letters with the Revised Romanization of Korean.
// Korean is written as it is pronounced, so the most common sound changes between
// syllables are handled too (for example 감사합니다 becomes "gamsahamnida").
// Rare cases may still come out slightly wrong, so the result can be edited in the form.

// Every Hangul syllable is built from an initial consonant, a vowel and an optional final consonant
const INITIALS = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
const VOWELS = ["a", "ae", "ya", "yae", "eo", "e", "yeo", "ye", "o", "wa", "wae", "oe", "yo", "u", "wo", "we", "wi", "yu", "eu", "ui", "i"];
const FINALS = ["", "ㄱ", "ㄲ", "ㄳ", "ㄴ", "ㄵ", "ㄶ", "ㄷ", "ㄹ", "ㄺ", "ㄻ", "ㄼ", "ㄽ", "ㄾ", "ㄿ", "ㅀ", "ㅁ", "ㅂ", "ㅄ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];

// How an initial consonant is written
const INITIAL_ROMAN = {
  "ㄱ": "g", "ㄲ": "kk", "ㄴ": "n", "ㄷ": "d", "ㄸ": "tt", "ㄹ": "r", "ㅁ": "m", "ㅂ": "b", "ㅃ": "pp", "ㅅ": "s",
  "ㅆ": "ss", "ㅇ": "", "ㅈ": "j", "ㅉ": "jj", "ㅊ": "ch", "ㅋ": "k", "ㅌ": "t", "ㅍ": "p", "ㅎ": "h",
};

// How a final consonant sounds at the end of a syllable
const FINAL_SOUND = {
  "": "", "ㄱ": "k", "ㄲ": "k", "ㄳ": "k", "ㄴ": "n", "ㄵ": "n", "ㄶ": "n", "ㄷ": "t", "ㄹ": "l", "ㄺ": "k",
  "ㄻ": "m", "ㄼ": "l", "ㄽ": "l", "ㄾ": "l", "ㄿ": "p", "ㅀ": "l", "ㅁ": "m", "ㅂ": "p", "ㅄ": "p", "ㅅ": "t",
  "ㅆ": "t", "ㅇ": "ng", "ㅈ": "t", "ㅊ": "t", "ㅋ": "k", "ㅌ": "t", "ㅍ": "p", "ㅎ": "t",
};

// Double final consonants: the first part stays, the second part can move to the next syllable
const DOUBLE_FINALS = {
  "ㄳ": ["ㄱ", "ㅅ"], "ㄵ": ["ㄴ", "ㅈ"], "ㄶ": ["ㄴ", "ㅎ"], "ㄺ": ["ㄹ", "ㄱ"], "ㄻ": ["ㄹ", "ㅁ"], "ㄼ": ["ㄹ", "ㅂ"],
  "ㄽ": ["ㄹ", "ㅅ"], "ㄾ": ["ㄹ", "ㅌ"], "ㄿ": ["ㄹ", "ㅍ"], "ㅀ": ["ㄹ", "ㅎ"], "ㅄ": ["ㅂ", "ㅅ"],
};

// k, t and p become ng, n and m before ㄴ or ㅁ (for example 합니다 → hamnida)
const NASAL = { k: "ng", t: "n", p: "m" };

// Splits a Hangul syllable into its parts, or returns null for other characters
function splitSyllable(char) {
  const code = char.charCodeAt(0) - 0xac00;
  if (code < 0 || code > 11171) {
    return null;
  }
  return {
    initial: INITIALS[Math.floor(code / 588)],
    vowel: VOWELS[Math.floor((code % 588) / 28)],
    final: FINALS[code % 28],
    initialRoman: null, // Set when a sound change gives a special spelling
    finalRoman: null,
  };
}

// Applies the sound changes between a syllable and the next one in the same word
function applySoundChanges(current, next) {
  if (current.final === "") {
    return;
  }

  // A final consonant before a silent ㅇ moves to the next syllable (이름이 → ireumi)
  if (next.initial === "ㅇ" && current.final !== "ㅇ") {
    let [stay, move] = DOUBLE_FINALS[current.final] || ["", current.final];
    if (move === "ㅎ") {
      // ㅎ is silent here, so the consonant before it moves instead (싫어요 → sireoyo)
      move = stay || "ㅇ";
      stay = "";
    }
    if (next.vowel === "i" && move === "ㄷ") {
      move = "ㅈ"; // 굳이 → guji
    }
    if (next.vowel === "i" && move === "ㅌ") {
      move = "ㅊ"; // 같이 → gachi
    }
    current.final = stay;
    next.initial = move;
    return;
  }

  // ㅎ makes the next ㄱ, ㄷ, ㅈ or ㅂ aspirated (좋고 → joko)
  const hFinals = { "ㅎ": "", "ㄶ": "ㄴ", "ㅀ": "ㄹ" };
  const aspirated = { "ㄱ": "ㅋ", "ㄷ": "ㅌ", "ㅈ": "ㅊ", "ㅂ": "ㅍ" };
  if (current.final in hFinals && aspirated[next.initial]) {
    next.initial = aspirated[next.initial];
    current.final = hFinals[current.final];
    return;
  }

  const sound = FINAL_SOUND[current.final];

  // k, t or p followed by ㅎ becomes one aspirated sound (축하 → chuka)
  if (next.initial === "ㅎ" && NASAL[sound] && !DOUBLE_FINALS[current.final]) {
    next.initial = { k: "ㅋ", t: "ㅌ", p: "ㅍ" }[sound];
    current.final = "";
    return;
  }

  // ㄹ after ㄴ or ㄹ is written ll, after other consonants it sounds like n (독립 → dongnip)
  if (next.initial === "ㄹ") {
    if (sound === "l" || sound === "n") {
      current.finalRoman = "l";
      next.initialRoman = "l";
    } else {
      next.initialRoman = "n";
      current.finalRoman = NASAL[sound] || null;
    }
    return;
  }

  // ㄹ before ㄴ makes it sound like l (설날 → seollal)
  if (next.initial === "ㄴ" && sound === "l") {
    next.initialRoman = "l";
    return;
  }

  // k, t and p become ng, n and m before ㄴ or ㅁ
  if ((next.initial === "ㄴ" || next.initial === "ㅁ") && NASAL[sound]) {
    current.finalRoman = NASAL[sound];
  }
}

// Romanizes one word (the sound changes only happen inside a word)
function romanizeWord(word) {
  const parts = [...word].map((char) => splitSyllable(char) || char);

  for (let i = 0; i < parts.length - 1; i++) {
    if (typeof parts[i] === "object" && typeof parts[i + 1] === "object") {
      applySoundChanges(parts[i], parts[i + 1]);
    }
  }

  return parts
    .map((part) => {
      if (typeof part === "string") {
        return part; // Punctuation and other characters are kept as they are
      }
      const initial = part.initialRoman ?? INITIAL_ROMAN[part.initial];
      const final = part.finalRoman ?? FINAL_SOUND[part.final];
      return initial + part.vowel + final;
    })
    .join("");
}

// Romanizes a whole text, keeping spaces between the words
function romanize(text) {
  return text
    .split(/(\s+)/)
    .map((piece) => (/^\s+$/.test(piece) ? piece : romanizeWord(piece)))
    .join("");
}
