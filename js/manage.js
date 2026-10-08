// The "Manage phrases" page: add, edit and delete the phrases in the Everyday Phrases quiz.
// The data functions (getPhrases, addPhrase, ...) are in phrase-store.js, and the
// Gemini functions (generatePhrase, getGeminiKey, ...) are in phrase-generator.js.

const manageView = document.getElementById("manage-view");
const manageButton = document.getElementById("manage-button");
const manageBackButton = document.getElementById("manage-back-button");
const phraseForm = document.getElementById("phrase-form");
const formTitle = document.getElementById("form-title");
const inputKorean = document.getElementById("input-korean");
const inputRomanization = document.getElementById("input-romanization");
const inputMeaning = document.getElementById("input-meaning");
const inputNote = document.getElementById("input-note");
const saveButton = document.getElementById("save-button");
const cancelEditButton = document.getElementById("cancel-edit-button");
const manageMessage = document.getElementById("manage-message");
const phraseCount = document.getElementById("phrase-count");
const phraseList = document.getElementById("phrase-list");
const resetButton = document.getElementById("reset-button");
const generateButton = document.getElementById("generate-button");
const keySettings = document.getElementById("key-settings");
const keyStatus = document.getElementById("key-status");
const inputKey = document.getElementById("input-key");
const saveKeyButton = document.getElementById("save-key-button");
const removeKeyButton = document.getElementById("remove-key-button");

// The id of the phrase being edited, or null when adding a new phrase
let editingId = null;

// Opens the manage page
async function showManageView() {
  showView(manageView);
  resetForm();
  manageMessage.classList.add("hidden");
  updateKeyStatus();
  await renderPhraseList();
}

// Shows a short message, for example "Phrase added."
function showManageMessage(text, isError = false) {
  manageMessage.textContent = text;
  manageMessage.classList.toggle("error", isError);
  manageMessage.classList.remove("hidden");
  manageMessage.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// Shows whether a Gemini API key is saved
function updateKeyStatus() {
  keyStatus.textContent = getGeminiKey() ? "A key is saved." : "No key saved yet.";
  inputKey.value = "";
}

// Fills in Korean, romanization and explanation from the English meaning with Gemini
async function generateFromEnglish() {
  const english = inputMeaning.value.trim();
  if (!english) {
    showManageMessage("Write the phrase in English first.", true);
    inputMeaning.focus();
    return;
  }
  if (!getGeminiKey()) {
    showManageMessage("Add your Gemini API key first.", true);
    keySettings.open = true;
    inputKey.focus();
    return;
  }

  generateButton.disabled = true;
  generateButton.textContent = "Generating...";
  try {
    const result = await generatePhrase(english);
    inputKorean.value = result.korean;
    inputRomanization.value = result.romanization;
    inputNote.value = result.note;
    showManageMessage("Generated. Check the result, then save the phrase.");
  } catch (error) {
    showManageMessage(error.message, true);
  } finally {
    generateButton.disabled = false;
    generateButton.textContent = "✨ Generate Korean";
  }
}

// Saves the API key typed into the key field
function saveKey() {
  const key = inputKey.value.trim();
  if (!key) {
    showManageMessage("Paste your API key in the field first.", true);
    return;
  }
  try {
    saveGeminiKey(key);
    updateKeyStatus();
    showManageMessage("The API key is saved in this browser.");
  } catch (error) {
    console.error("Could not save key:", error);
    showManageMessage("Could not save the key. Your browser may block saving data for this page.", true);
  }
}

// Removes the saved API key
function removeKey() {
  try {
    removeGeminiKey();
  } catch (error) {
    console.error("Could not remove key:", error);
  }
  updateKeyStatus();
  showManageMessage("The API key is removed.");
}

// Shows all phrases with an Edit and a Delete button each
async function renderPhraseList() {
  let phrases;
  try {
    phrases = await getPhrases();
  } catch (error) {
    console.error("Could not load phrases:", error);
    showManageMessage("Could not load the phrases. Make sure the page is opened through a local server.", true);
    return;
  }

  phraseCount.textContent = `Phrases (${phrases.length})`;
  phraseList.innerHTML = "";

  if (phrases.length === 0) {
    const empty = document.createElement("li");
    empty.className = "phrase-empty";
    empty.textContent = "No phrases yet. Add one with the form above.";
    phraseList.appendChild(empty);
    return;
  }

  phrases.forEach((phrase) => {
    const item = document.createElement("li");
    item.className = "phrase-item";

    const info = document.createElement("div");
    info.className = "phrase-info";

    const korean = document.createElement("span");
    korean.className = "phrase-korean";
    korean.lang = "ko";
    korean.textContent = phrase.korean;

    const romanization = document.createElement("span");
    romanization.className = "phrase-romanization";
    romanization.textContent = phrase.romanization || "";

    const meaning = document.createElement("span");
    meaning.className = "phrase-meaning";
    meaning.textContent = phrase.answer;

    info.append(korean, romanization, meaning);

    const actions = document.createElement("div");
    actions.className = "phrase-actions";

    const editButton = document.createElement("button");
    editButton.className = "small-button";
    editButton.textContent = "Edit";
    editButton.addEventListener("click", () => startEditing(phrase));

    const deleteButton = document.createElement("button");
    deleteButton.className = "small-button danger";
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", () => removePhrase(phrase));

    actions.append(editButton, deleteButton);
    item.append(info, actions);
    phraseList.appendChild(item);
  });
}

// Fills the form with a phrase so it can be edited
function startEditing(phrase) {
  editingId = phrase.id;
  inputKorean.value = phrase.korean;
  inputRomanization.value = phrase.romanization || "";
  inputMeaning.value = phrase.answer;
  inputNote.value = phrase.note || "";

  formTitle.textContent = "Edit phrase";
  saveButton.textContent = "Save changes";
  cancelEditButton.classList.remove("hidden");
  manageMessage.classList.add("hidden");

  phraseForm.scrollIntoView({ behavior: "smooth" });
  inputKorean.focus();
}

// Empties the form and switches it back to "Add a phrase"
function resetForm() {
  editingId = null;
  phraseForm.reset();
  formTitle.textContent = "Add a phrase";
  saveButton.textContent = "Add phrase";
  cancelEditButton.classList.add("hidden");
}

// Saves the form: adds a new phrase or updates the one being edited
async function savePhraseForm(event) {
  // Stop the browser from reloading the page when the form is submitted
  event.preventDefault();

  const phrase = {
    korean: inputKorean.value.trim(),
    romanization: inputRomanization.value.trim(),
    answer: inputMeaning.value.trim(),
    note: inputNote.value.trim(),
  };
  if (!phrase.korean || !phrase.answer) {
    showManageMessage("Please fill in both Korean and the meaning.", true);
    return;
  }

  try {
    if (editingId === null) {
      await addPhrase(phrase);
      showManageMessage(`Added "${phrase.korean}".`);
    } else {
      await updatePhrase(editingId, phrase);
      showManageMessage(`Saved changes to "${phrase.korean}".`);
    }
    resetForm();
    await renderPhraseList();
  } catch (error) {
    console.error("Could not save phrase:", error);
    showManageMessage("Could not save the phrase. Your browser may block saving data for this page.", true);
  }
}

// Deletes a phrase after asking the user to confirm
async function removePhrase(phrase) {
  if (!confirm(`Delete "${phrase.korean}" (${phrase.answer})?`)) {
    return;
  }
  try {
    await deletePhrase(phrase.id);
    if (editingId === phrase.id) {
      resetForm();
    }
    showManageMessage(`Deleted "${phrase.korean}".`);
    await renderPhraseList();
  } catch (error) {
    console.error("Could not delete phrase:", error);
    showManageMessage("Could not delete the phrase. Your browser may block saving data for this page.", true);
  }
}

// Throws away all changes and goes back to the phrases in the JSON file
async function resetAllPhrases() {
  if (!confirm("Reset to the original phrases? All added and edited phrases will be lost.")) {
    return;
  }
  try {
    resetPhrases();
  } catch (error) {
    console.error("Could not reset phrases:", error);
    showManageMessage("Could not reset the phrases. Your browser may block saving data for this page.", true);
    return;
  }
  resetForm();
  showManageMessage("The original phrases are back.");
  await renderPhraseList();
}

manageButton.addEventListener("click", showManageView);
manageBackButton.addEventListener("click", () => showView(menuView));
phraseForm.addEventListener("submit", savePhraseForm);
cancelEditButton.addEventListener("click", resetForm);
resetButton.addEventListener("click", resetAllPhrases);
generateButton.addEventListener("click", generateFromEnglish);
saveKeyButton.addEventListener("click", saveKey);
removeKeyButton.addEventListener("click", removeKey);
