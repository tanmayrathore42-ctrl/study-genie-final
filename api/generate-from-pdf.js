// File: api/generate-from-pdf.js (FINAL CORRECTED VERSION)
const { IncomingForm } = require('formidable');
const fs = require('fs');
const pdf = require('pdf-parse');
const OpenAI = require('openai'); // Correct require syntax

const groq = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
});

function extractJson(str) {
    const jsonStart = str.indexOf('{');
    const jsonEnd = str.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd === -1) {
        return null;
    }
    return str.substring(jsonStart, jsonEnd + 1);
}

// Use module.exports for CommonJS
module.exports = async (req, res) => {
    // This config needs to be inside the handler for Vercel + CommonJS
    const config = {
        api: {
            bodyParser: false,
        },
    };

    if (req.method !== 'POST') {
        return res.status(405).send({ message: 'Only POST requests allowed' });
    }

    try {
        const form = new IncomingForm();
        const data = await new Promise((resolve, reject) => {
            form.parse(req, (err, fields, files) => {
                if (err) return reject(err);
                resolve({ fields, files });
            });
        });

        const pdfFile = data.files.pdfFile[0];
        if (!pdfFile) {
            return res.status(400).json({ error: 'No PDF file uploaded.' });
        }

        const fileBuffer = fs.readFileSync(pdfFile.filepath);
        const pdfData = await pdf(fileBuffer);
        const text = pdfData.text;
        
        const prompt = `
            Based on the following text from a PDF, generate a study guide.
            Provide the output in a single, clean JSON object.
            The JSON object must have three keys: "summary", "quiz", and "flashcards".
            - The "summary" should be a concise 2-3 sentence paragraph.
            - The "quiz" should be an array of 3 multiple-choice questions. Each question object should have "question", "options" (an array of 4 strings), and "correctAnswer".
            - The "flashcards" should be an array of 4 objects. Each object should have a "front" (a key term or question) and a "back" (the definition or answer).
            You must only respond with the JSON object, and nothing else.
            
            Text: "${text.substring(0, 8000)}"
        `;

        const completion = await groq.chat.completions.create({
            model: "llama3-8b-8192",
            messages: [{ role: "user", content: prompt }],
        });
        
        const rawContent = completion.choices[0].message.content;
        const jsonString = extractJson(rawContent);

        if (!jsonString) {
            console.error("Failed to find JSON in AI response:", rawContent);
            throw new Error("AI did not return valid JSON.");
        }

        const resultJson = JSON.parse(jsonString);
        res.status(200).json(resultJson);

    } catch (error) {
        console.error('Server Error in generate-from-pdf:', error);
        res.status(500).json({ error: 'Failed to process PDF.' });
    }
};