// Stores the phrases for the Everyday Phrases quiz, so they can be added, edited and deleted.
// A website cannot write to the JSON file, so changes are saved in the browser (localStorage).
// The first time, the phrases from the JSON file are used as the starting list.

const PHRASES_URL = "data/phrases-questions.json";
const PHRASES_STORAGE_KEY = "korean-quiz-phrases";

// Loads the original phrases from the JSON file
async function loadDefaultPhrases() {
  const response = await fetch(PHRASES_URL);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  const data = await response.json();
  return data.questions;
}

// Returns the saved phrases, or null if nothing has been saved yet
function readSavedPhrases() {
  try {
    const json = localStorage.getItem(PHRASES_STORAGE_KEY);
    return json ? JSON.parse(json) : null;
  } catch (error) {
    console.error("Could not read saved phrases:", error);
    return null;
  }
}

// Saves the whole list of phrases in the browser
function savePhrases(phrases) {
  localStorage.setItem(PHRASES_STORAGE_KEY, JSON.stringify(phrases));
}

// READ: returns all phrases (the saved ones, or the original ones if nothing is saved)
async function getPhrases() {
  return readSavedPhrases() ?? (await loadDefaultPhrases());
}

// CREATE: adds a new phrase and gives it the next free id
async function addPhrase(phrase) {
  const phrases = await getPhrases();
  const nextId = phrases.reduce((max, p) => Math.max(max, p.id), 0) + 1;
  phrases.push({ ...phrase, id: nextId });
  savePhrases(phrases);
}

// UPDATE: changes the phrase with the given id
async function updatePhrase(id, changes) {
  const phrases = await getPhrases();
  const updated = phrases.map((p) => (p.id === id ? { ...p, ...changes } : p));
  savePhrases(updated);
}

// DELETE: removes the phrase with the given id
async function deletePhrase(id) {
  const phrases = await getPhrases();
  savePhrases(phrases.filter((p) => p.id !== id));
}

// Removes all changes, so the original phrases from the JSON file are used again
function resetPhrases() {
  localStorage.removeItem(PHRASES_STORAGE_KEY);
}
