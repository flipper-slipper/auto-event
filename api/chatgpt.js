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
    const prompt = `Please summarize the following email and extract any action items or important dates. Using the infomration you extracted, write ics code to create a calendar event for each of the events. Here is the email:\n\n${content}`;
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
    // Properly structure the request payload as JSON
    const requestPayload = {
      model: "gpt-4o-mini-2024-07-18",
      messages: [
        { role: "system", content: "You are a helpful assistant that processes emails to extract key information." },
        { role: "user", content: prompt }
      ],
      max_tokens: 500,
      temperature: 0.7
    };
    
    // Convert to string and calculate correct length
    const jsonData = JSON.stringify(requestPayload);
    
    const options = {
      hostname: 'api.openai.com',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(jsonData)
      }
    };

    // Debug logging for troubleshooting
    console.log('Request options:', {
      url: `https://${options.hostname}${options.path}`,
      method: options.method,
      headers: {
        'Content-Type': options.headers['Content-Type'],
        'Content-Length': options.headers['Content-Length'],
        // Not logging Authorization header for security
      }
    });
    console.log('Request payload:', jsonData);

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          console.log('Raw response:', responseData);
          const parsedData = JSON.parse(responseData);
          
          if (parsedData.choices && parsedData.choices[0].message) {
            resolve(parsedData.choices[0].message.content.trim());
          } else {
            console.error("OpenAI API Error:", parsedData);
            reject(new Error(parsedData.error?.message || "Failed to get response from ChatGPT"));
          }
        } catch (e) {
          console.error('Parse error:', e);
          reject(new Error(`Failed to parse response: ${e.message}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error('Request error:', error);
      reject(error);
    });

    // Write data properly
    req.write(jsonData);
    req.end();
  });
}