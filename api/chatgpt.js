// chatgpt.js - Export the function for use in a Node.js environment
const fetch = require('node-fetch'); // Make sure to install this: npm install node-fetch

async function testChatGptApiKey(apiKey = 'YOUR_OPENAI_API_KEY', prompt = "Hello, ChatGPT!") {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: prompt }
        ],
        max_tokens: 100,
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    if (data.choices && data.choices[0].message) {
      console.log("ChatGPT Response:", data.choices[0].message.content.trim());
      return data.choices[0].message.content.trim();
    } else {
      console.error("Error: Failed to get response from ChatGPT", data);
      throw new Error("Failed to get response from ChatGPT");
    }
  } catch (error) {
    console.error("Request failed:", error);
    throw error;
  }
}

// Export the function for use in other files
module.exports = {
  testChatGptApiKey
};

// Example usage in another file:
// const { testChatGptApiKey } = require('./chatgpt');
// testChatGptApiKey('YOUR_API_KEY', 'Hello, ChatGPT!');