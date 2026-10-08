# Korean Quiz

A simple website for learning Korean through multiple-choice quizzes.
Built with plain HTML, CSS and JavaScript (no frameworks).

## Features

- Start menu with three quizzes:
  1. **Hangul** – listen to a sound and pick the right letter (with replay and slow mode)
  2. **Everyday Phrases** – useful phrases with romanization and audio
  3. **Grammar** – basic particles and verb endings, with hints, explanations and audio after answering
- **Manage phrases**: add, edit and delete your own phrases (CRUD)
- Daily grammar tip in the menu (a new tip every day)
- 10 random questions per round, stored in JSON files
- Questions and answer options are shuffled every round
- Instant right/wrong feedback with a short explanation
- Result view with score and percentage

## Project structure

```
index.html                   The page (menu, quiz, result and manage views)
css/style.css                Styling
js/quiz.js                   Quiz logic and the list of quizzes in the menu
js/phrase-store.js           Saves, adds, edits and deletes phrases (localStorage)
js/manage.js                 The "Manage phrases" page
data/hangul-questions.json   Hangul questions
data/phrases-questions.json  Everyday phrase questions
data/grammar-questions.json  Grammar questions
data/grammar-tips.json       Grammar tips shown in the menu
audio/                       MP3 files for the quiz questions
generate-audio.ps1           Creates the MP3 files with Google Cloud Text-to-Speech
```

## How to run

The questions are loaded with `fetch()`, which does not work when `index.html` is opened
directly from the file system (`file://`). Use a local server instead, for example:

- **VS Code:** install the *Live Server* extension, right-click `index.html` and choose *Open with Live Server*.

## Manage phrases (CRUD)

The **Manage phrases** page (button in the menu) lets you change the phrases in the
Everyday Phrases quiz:

- **Create** – add a phrase with Korean, romanization, meaning and an optional explanation
- **Read** – see all phrases in a list (and use them in the quiz)
- **Update** – edit a phrase with the Edit button
- **Delete** – remove a phrase with the Delete button

A website cannot write to the JSON file, so changes are saved in the browser with
`localStorage` (see `js/phrase-store.js`). The first time, the phrases from
`data/phrases-questions.json` are used. "Reset to the original phrases" removes all changes.

The wrong answers for new or edited phrases are picked from the other phrases. Each quiz
round uses 10 random questions. New phrases are read aloud with the browser's own voice,
since `generate-audio.ps1` only knows the phrases in the JSON file.

## Audio (Google Text-to-Speech)

All three quizzes play MP3 files from `audio/`. They are created once with
Google Cloud Text-to-Speech by the script `generate-audio.ps1`:

```
powershell -ExecutionPolicy Bypass -File .\generate-audio.ps1
```

File names come from the Korean text, for example `이거 얼마예요?` becomes
`audio/phrases/이거-얼마예요.mp3` (and `이거-얼마예요-slow.mp3` for the slow version).
Only files that do not exist yet are created, so after adding a question you just run the script again.

The script asks for your Google Cloud API key (or reads the `GOOGLE_TTS_API_KEY` environment
variable). The key is never saved in the project or sent from the website. Existing files are
skipped; add `-Force` to create them again, or `-Voice ko-KR-Wavenet-B` to try another voice.

If an audio file is missing, the quiz falls back to the browser's built-in speech
(Web Speech API), which needs a Korean voice. Chrome and Edge have one built in.

## Adding questions

Add a new object to the `questions` array in a JSON file in `data/`. For quizzes with sound,
run `generate-audio.ps1` afterwards to create the audio. Until then the browser voice is used.

All question files use the same format:

```json
{
  "title": "Everyday Phrases",
  "prompt": "What does this phrase mean?",
  "audioFolder": "audio/phrases",
  "questions": [
    {
      "id": 1,
      "korean": "물 주세요",
      "romanization": "mul juseyo",
      "options": ["Water, please", "Coffee, please", "The bill, please", "Help me, please"],
      "answer": "Water, please",
      "note": "Explanation shown after answering."
    }
  ]
}
```

- `answer` must match one of the `options` exactly.
- Each question needs either `korean` (text shown on screen) or `speak` (text read out loud, for listening questions).
- `audioFolder` (optional) turns on sound for the quiz: the play and slow buttons are shown and
  the audio files are read from that folder.
- `playAfterAnswer` (optional, with `audioFolder`) plays the sound only after answering, so it does
  not give away the answer. The grammar quiz uses this and reads the sentence with the blank (`___`)
  filled in. A question can set `audioText` to read something else instead.
- `romanization`, `translation`, `hint` (shown with the "Show hint" button), `note` and `prompt`
  (overrides the quiz prompt) are optional.

To add a new quiz, create a new JSON file in `data/` and add it to the `QUIZZES` list at the top of `js/quiz.js`.
