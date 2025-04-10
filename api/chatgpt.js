// /api/chatgpt.js
const fetch = require('node-fetch'); // or use your preferred fetch implementation

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { content } = req.body;

        if (!content) {
            return res.status(400).json({ success: false, error: 'No content provided' });
        }

        try {
            const response = await fetch('https://api.openai.com/v1/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.CHATGPT_API_KEY}`, // Use the OpenAI API key stored in Vercel's environment variables
                },
                body: JSON.stringify({
                    model: "text-davinci-003", // or another model of your choice
                    prompt: content,
                    max_tokens: 1000,
                    temperature: 0.7,
                }),
            });

            const data = await response.json();

            if (data.choices && data.choices[0].text) {
                res.status(200).json({ success: true, output: data.choices[0].text.trim() });
            } else {
                res.status(500).json({ success: false, error: 'Failed to get response from ChatGPT' });
            }
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    } else {
        res.status(405).json({ success: false, error: 'Method not allowed' });
    }
}
