import { IncomingForm } from 'formidable';
import fs from 'fs';
import pdf from 'pdf-parse';
import OpenAI from 'openai';

export const config = {
    api: {
        bodyParser: false,
    },
};

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
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
            Do not include any text outside of the JSON object.

            Text: "${text.substring(0, 15000)}"
        `;

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
        });

        const resultJson = JSON.parse(completion.choices[0].message.content);
        res.status(200).json(resultJson);

    } catch (error) {
        console.error('Server Error:', error);
        res.status(500).json({ error: 'Failed to process PDF.' });
    }
}