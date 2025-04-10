// chatgpt.js - Using Node.js built-in https module (no external dependencies)
const https = require('https');

async function testChatGptApiKey(apiKey = 'CHATGPT_API_KEY', prompt = "Hello, ChatGPT!") {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: prompt }
      ],
      max_tokens: 100,
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
            const response = parsedData.choices[0].message.content.trim();
            console.log("ChatGPT Response:", response);
            resolve(response);
          } else {
            console.error("Error: Failed to get response from ChatGPT", parsedData);
            reject(new Error("Failed to get response from ChatGPT"));
          }
        } catch (e) {
          console.error("Failed to parse response", e);
          reject(e);
        }
      });
    });

    req.on('error', (error) => {
      console.error("Request failed:", error);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

// Export the function
module.exports = {
  testChatGptApiKey
};

// Example index.js or handler:
// const { testChatGptApiKey } = require('./chatgpt');
// 
// exports.handler = async (event) => {
//   try {
//     const response = await testChatGptApiKey('YOUR_API_KEY', 'Hello');
//     return { statusCode: 200, body: JSON.stringify({ response }) };
//   } catch (error) {
//     return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
//   }
// };