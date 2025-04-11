// File: /api/chatgpt.js
const https = require('https');

// This is the main export that Vercel will use as the API endpoint handler
module.exports = async (req, res) => {
  // CORS headers to allow requests from your add-in
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Check if this is a POST request
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }
  
  try {
    // Get email content from request body
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ success: false, error: 'Email content is required' });
    }
    
    // Get API key from environment variable
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ success: false, error: 'API key not configured' });
    }
    
    // Process with ChatGPT
    const prompt = `Please summarize the following email and extract any action items or important dates:\n\n${content}`;
    const chatGptResponse = await callChatGptApi(apiKey, prompt);
    
    // Return successful response
    return res.status(200).json({ success: true, output: chatGptResponse });
    
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Failed to process with ChatGPT' });
  }
};

// Function to call OpenAI API
async function callChatGptApi(apiKey, prompt) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a helpful assistant that processes emails to extract key information." },
        { role: "user", content: prompt }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const options = {
      hostname: 'api.openai.com',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          
          if (parsedData.choices && parsedData.choices[0].message) {
            resolve(parsedData.choices[0].message.content.trim());
          } else {
            console.error("OpenAI API Error:", parsedData);
            reject(new Error(parsedData.error?.message || "Failed to get response from ChatGPT"));
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${e.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}