# Korean Quiz

A simple website for learning Korean through multiple-choice quizzes.
Built with plain HTML, CSS and JavaScript (no frameworks).

## Features

- Start menu with three quizzes:
  1. **Hangul** – the sounds of the Korean letters
  2. **Everyday Phrases** – useful phrases with romanization
  3. **Grammar** – basic particles and verb endings
- 10 questions per quiz, stored in JSON files
- Questions and answer options are shuffled every round
- Instant right/wrong feedback with a short explanation
- Result view with score and percentage

## Project structure

```
index.html                   The page (menu, quiz and result views)
css/style.css                Styling
js/quiz.js                   Quiz logic and the list of quizzes in the menu
data/hangul-questions.json   Hangul questions
data/phrases-questions.json  Everyday phrase questions
data/grammar-questions.json  Grammar questions
```

## How to run

The questions are loaded with `fetch()`, which does not work when `index.html` is opened
directly from the file system (`file://`). Use a local server instead, for example:

- **VS Code:** install the *Live Server* extension, right-click `index.html` and choose *Open with Live Server*.

## Question format

All question files use the same format:

```json
{
  "title": "Everyday Phrases",
  "prompt": "What does this phrase mean?",
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
- `romanization`, `translation`, `note` and `prompt` (overrides the quiz prompt) are optional.

To add a new quiz, create a new JSON file in `data/` and add it to the `QUIZZES` list at the top of `js/quiz.js`.
