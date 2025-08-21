// File: api/translate.js (UPDATED FOR GROQ)
import OpenAI from 'openai';

// --- THIS BLOCK IS THE MAIN CHANGE ---
const groq = new OpenAI({
    apiKey: process.env.GROQ_API_KEY, // Using the new Groq key
    baseURL: 'https://api.groq.com/openai/v1', // Pointing to Groq's servers
});
// ------------------------------------

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).send({ message: 'Only POST requests allowed' });
    }

    const { text, language } = req.body;

    if (!text || !language) {
        return res.status(400).send({ message: 'Missing text or language' });
    }

    try {
        const prompt = `Translate the following text into ${language}. Only return the translated text, nothing else.\n\nText: "${text}"`;

        const completion = await groq.chat.completions.create({
            model: "llama3-8b-8192", // Using a model available on Groq
            messages: [{ role: "user", content: prompt }],
        });

        const translatedText = completion.choices[0].message.content;
        res.status(200).json({ translatedText });

    } catch (error) {
        console.error('Error calling Groq for translation:', error);
        res.status(500).send({ message: 'Failed to translate text.' });
    }
};