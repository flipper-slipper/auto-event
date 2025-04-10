const fetch = require('node-fetch'); // or use your preferred fetch implementation

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { content } = req.body;

        if (!content) {
            return res.status(400).json({ success: false, error: 'No content provided' });
        }

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.CHATGPT_API_KEY}`, // Use the OpenAI API key stored in Vercel's environment variables
                },
                body: JSON.stringify({
                    model: "gpt-4",  // Use the GPT-4 model
                    messages: [
                        { role: "system", content: "You are a helpful assistant." },  // Optional system message
                        { role: "user", content: content }  // User's input
                    ],
                    max_tokens: 100,
                    temperature: 0.7,
                }),
            });

            const data = await response.json();

            if (data.choices && data.choices[0].message) {
                res.status(200).json({ success: true, output: data.choices[0].message.content.trim() });
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
