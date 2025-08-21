import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

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

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
        });

        const translatedText = completion.choices[0].message.content;
        res.status(200).json({ translatedText });

    } catch (error)
    {
        console.error('Error calling OpenAI for translation:', error);
        res.status(500).send({ message: 'Failed to translate text.' });
    }
};