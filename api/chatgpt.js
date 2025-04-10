// Use the native fetch API in the browser (no need for node-fetch)
async function testChatGptApiKey() {
  const apiKey = 'YOUR_OPENAI_API_KEY'; // Replace with your OpenAI API key
  const prompt = "Hello, ChatGPT!"; // The prompt you want to send to ChatGPT

  try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
              model: "gpt-4",  // Use the GPT-4 model
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
      } else {
          console.log("Error: Failed to get response from ChatGPT");
      }
  } catch (error) {
      console.error("Request failed:", error);
  }
}

// Run the test
testChatGptApiKey();
