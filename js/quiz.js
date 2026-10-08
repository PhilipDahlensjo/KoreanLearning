// Quizzes shown in the menu. Each quiz has its own question file.
const QUIZZES = [
  {
    title: "Hangul",
    description: "Learn the sounds of the Korean letters.",
    file: "data/hangul-questions.json",
  },
  {
    title: "Everyday Phrases",
    description: "Useful phrases for daily life in Korea.",
    file: "data/phrases-questions.json",
  },
  {
    title: "Grammar",
    description: "Basic particles and verb endings.",
    file: "data/grammar-questions.json",
  },
];

// File with the grammar tips shown in the menu
const TIPS_URL = "data/grammar-tips.json";

// Views
const menuView = document.getElementById("menu-view");
const quizView = document.getElementById("quiz-view");
const resultView = document.getElementById("result-view");

// Menu view elements
const menuContainer = document.getElementById("menu");
const errorMessage = document.getElementById("error-message");
const dailyTip = document.getElementById("daily-tip");
const tipTitle = document.getElementById("tip-title");
const tipText = document.getElementById("tip-text");
const tipExamples = document.getElementById("tip-examples");

// Quiz view elements
const quitButton = document.getElementById("quit-button");
const progressText = document.getElementById("progress");
const promptText = document.getElementById("prompt");
const koreanText = document.getElementById("korean");
const romanizationText = document.getElementById("romanization");
const translationText = document.getElementById("translation");
const optionsContainer = document.getElementById("options");
const feedbackBox = document.getElementById("feedback");
const feedbackText = document.getElementById("feedback-text");
const feedbackNote = document.getElementById("feedback-note");
const nextButton = document.getElementById("next-button");

// Result view elements
const resultTitle = document.getElementById("result-title");
const scoreText = document.getElementById("score");
const resultMessage = document.getElementById("result-message");
const restartButton = document.getElementById("restart-button");
const menuButton = document.getElementById("menu-button");

// Quiz state
let currentQuiz = null;  // The quiz data loaded from the selected JSON file
let questions = [];      // The questions for the current round, in shuffled order
let currentIndex = 0;    // Index of the question being shown
let score = 0;           // Number of correct answers

// Returns a new array with the items in random order (Fisher-Yates shuffle)
function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Hides all views and shows only the given one
function showView(view) {
  [menuView, quizView, resultView].forEach((v) => v.classList.add("hidden"));
  view.classList.remove("hidden");
}

// Creates one menu button per quiz
function createMenu() {
  QUIZZES.forEach((quiz, index) => {
    const button = document.createElement("button");
    button.className = "menu-option";

    const title = document.createElement("span");
    title.className = "menu-title";
    title.textContent = `${index + 1}. ${quiz.title}`;

    const description = document.createElement("span");
    description.className = "menu-description";
    description.textContent = quiz.description;

    button.append(title, description);
    button.addEventListener("click", () => loadQuiz(quiz));
    menuContainer.appendChild(button);
  });
}

// Returns an index that stays the same for the whole day and moves on by one each new day
function getDailyIndex(count) {
  const now = new Date();
  const todayAtMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayNumber = Math.floor(todayAtMidnight.getTime() / (24 * 60 * 60 * 1000));
  return dayNumber % count;
}

// Loads the grammar tips and shows today's tip in the menu
async function loadDailyTip() {
  try {
    const response = await fetch(TIPS_URL);
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    const data = await response.json();
    const tip = data.tips[getDailyIndex(data.tips.length)];

    tipTitle.textContent = tip.title;
    tipText.textContent = tip.text;
    tipExamples.innerHTML = "";
    tip.examples.forEach((example) => {
      const korean = document.createElement("p");
      korean.className = "tip-korean";
      korean.lang = "ko";
      korean.textContent = example.korean;

      const english = document.createElement("p");
      english.className = "tip-english";
      english.textContent = example.english;

      tipExamples.append(korean, english);
    });

    dailyTip.classList.remove("hidden");
  } catch (error) {
    // The tip is a bonus, so the menu still works if it cannot be loaded
    console.error("Could not load grammar tips:", error);
  }
}

// Enables or disables all menu buttons (used while a quiz is loading)
function setMenuDisabled(disabled) {
  for (const button of menuContainer.children) {
    button.disabled = disabled;
  }
}

// Loads the questions for the selected quiz from its JSON file and starts it
async function loadQuiz(quiz) {
  errorMessage.classList.add("hidden");
  setMenuDisabled(true);
  try {
    const response = await fetch(quiz.file);
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    currentQuiz = await response.json();
    startQuiz();
  } catch (error) {
    console.error("Could not load questions:", error);
    errorMessage.textContent =
      "Could not load the questions. Make sure the page is opened through a local server (for example Live Server in VS Code).";
    errorMessage.classList.remove("hidden");
  } finally {
    setMenuDisabled(false);
  }
}

// Resets the state and starts a new round with shuffled questions
function startQuiz() {
  questions = shuffle(currentQuiz.questions);
  currentIndex = 0;
  score = 0;
  showView(quizView);
  showQuestion();
}

// Shows the current question and creates one button per answer option
function showQuestion() {
  const question = questions[currentIndex];

  progressText.textContent = `${currentQuiz.title} · Question ${currentIndex + 1} of ${questions.length}`;
  // A question can have its own prompt, otherwise the quiz's prompt is used
  promptText.textContent = question.prompt || currentQuiz.prompt;
  koreanText.textContent = question.korean;
  // Romanization and translation are optional and hidden by CSS when empty
  romanizationText.textContent = question.romanization || "";
  translationText.textContent = question.translation ? `"${question.translation}"` : "";

  feedbackBox.classList.add("hidden");
  nextButton.classList.add("hidden");

  optionsContainer.innerHTML = "";
  shuffle(question.options).forEach((option) => {
    const button = document.createElement("button");
    button.className = "option";
    button.textContent = option;
    button.addEventListener("click", () => checkAnswer(button, question));
    optionsContainer.appendChild(button);
  });
}

// Checks the selected answer and shows right/wrong feedback directly
function checkAnswer(selectedButton, question) {
  const isCorrect = selectedButton.textContent === question.answer;
  if (isCorrect) {
    score++;
  }

  // Lock all options and always highlight the correct one
  for (const button of optionsContainer.children) {
    button.disabled = true;
    if (button.textContent === question.answer) {
      button.classList.add("correct");
    }
  }
  if (!isCorrect) {
    selectedButton.classList.add("wrong");
  }

  feedbackText.textContent = isCorrect
    ? "Correct!"
    : `Wrong. The correct answer is "${question.answer}".`;
  feedbackNote.textContent = question.note || "";
  feedbackBox.className = isCorrect ? "feedback correct" : "feedback wrong";

  const isLastQuestion = currentIndex === questions.length - 1;
  nextButton.textContent = isLastQuestion ? "See result" : "Next";
  nextButton.classList.remove("hidden");
  nextButton.focus();
}

// Goes to the next question, or to the result view after the last one
function nextQuestion() {
  currentIndex++;
  if (currentIndex < questions.length) {
    showQuestion();
  } else {
    showResult();
  }
}

// Shows the final score and a short message based on the percentage
function showResult() {
  const percent = Math.round((score / questions.length) * 100);
  resultTitle.textContent = `Your result: ${currentQuiz.title}`;
  scoreText.textContent = `${score} / ${questions.length} (${percent}%)`;

  if (percent === 100) {
    resultMessage.textContent = "Perfect! 잘했어요! (Well done!)";
  } else if (percent >= 70) {
    resultMessage.textContent = "Great job! You know most of these.";
  } else if (percent >= 40) {
    resultMessage.textContent = "Good start! Try again to learn the rest.";
  } else {
    resultMessage.textContent = "Keep practicing. You will get there!";
  }

  showView(resultView);
}

quitButton.addEventListener("click", () => showView(menuView));
nextButton.addEventListener("click", nextQuestion);
restartButton.addEventListener("click", startQuiz);
menuButton.addEventListener("click", () => showView(menuView));

createMenu();
loadDailyTip();
