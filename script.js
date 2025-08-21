const form = document.getElementById('input-form');
const pdfInput = document.getElementById('pdf-input');
const resultsContainer = document.getElementById('results-container');
const loadingIndicator = document.getElementById('loading');
const outputContainer = document.getElementById('output');
const summaryOutput = document.getElementById('summary-output');
const quizOutput = document.getElementById('quiz-output');
const flashcardsContainer = document.getElementById('flashcards-container');
const translateControls = document.getElementById('translate-controls');
const languageSelect = document.getElementById('language-select');
const translateBtn = document.getElementById('translate-btn');

let originalSummary = '';

form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const file = pdfInput.files[0];
    if (!file) {
        alert('Please select a PDF file first!');
        return;
    }

    const formData = new FormData();
    formData.append('pdfFile', file);

    resultsContainer.classList.remove('hidden');
    outputContainer.classList.add('hidden');
    loadingIndicator.classList.remove('hidden');
    translateControls.classList.add('hidden');

    try {
        const response = await fetch('/api/generate-from-pdf', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();

        originalSummary = data.summary;
        summaryOutput.innerText = originalSummary;

        quizOutput.innerHTML = '';
        data.quiz.forEach((q, index) => {
            const questionEl = document.createElement('div');
            questionEl.classList.add('question-block');
            let optionsHTML = q.options.map(opt => `<button class="outline" data-option="${opt}">${opt}</button>`).join('');
            questionEl.innerHTML = `<p><strong>${index + 1}. ${q.question}</strong></p><div class="options-container" data-correct-answer="${q.correctAnswer}">${optionsHTML}</div>`;
            quizOutput.appendChild(questionEl);
        });

        flashcardsContainer.innerHTML = '';
        data.flashcards.forEach(card => {
            const cardEl = document.createElement('div');
            cardEl.classList.add('flashcard');
            cardEl.innerHTML = `<div class="flashcard-inner"><div class="flashcard-front">${card.front}</div><div class="flashcard-back">${card.back}</div></div>`;
            cardEl.addEventListener('click', () => cardEl.classList.toggle('is-flipped'));
            flashcardsContainer.appendChild(cardEl);
        });

        translateControls.classList.remove('hidden');

    } catch (error) {
        console.error('Error:', error);
        alert('Something went wrong. Please try again.');
    } finally {
        loadingIndicator.classList.add('hidden');
        outputContainer.classList.remove('hidden');
    }
});

quizOutput.addEventListener('click', (event) => {
    if (event.target.tagName === 'BUTTON') {
        const button = event.target;
        const optionsContainer = button.parentElement;
        const correctAnswer = optionsContainer.dataset.correctAnswer;
        const selectedAnswer = button.dataset.option;

        optionsContainer.querySelectorAll('button').forEach(btn => {
            btn.disabled = true;
            if (btn.dataset.option === correctAnswer) {
                btn.classList.add('correct');
            }
        });

        if (selectedAnswer !== correctAnswer) {
            button.classList.add('incorrect');
        }
    }
});

translateBtn.addEventListener('click', async () => {
    const language = languageSelect.value;
    translateBtn.setAttribute('aria-busy', 'true');
    translateBtn.disabled = true;

    try {
        const response = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: originalSummary, language: language }),
        });
        if (!response.ok) throw new Error(`Translation failed!`);
        const data = await response.json();
        summaryOutput.innerText = data.translatedText;
    } catch (error) {
        console.error('Translate Error:', error);
        alert('Could not translate the summary.');
    } finally {
        translateBtn.removeAttribute('aria-busy');
        translateBtn.disabled = false;
    }
});