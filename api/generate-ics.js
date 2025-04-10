// File path: /api/generate-ics.js
import fetch from 'node-fetch';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { emailContent } = req.body;
    
    if (!emailContent) {
      return res.status(400).json({ success: false, error: 'Email content is required' });
    }
    
    // Get the ChatGPT API key from environment variables
    const apiKey = process.env.CHATGPT_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ success: false, error: 'API key not configured' });
    }
    
    // Call ChatGPT API to generate ICS content
    const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an assistant that extracts event details from email content and generates an ICS file.

1. Extract the following event details:
   - Event title
   - Location (if available)
   - Start date and time
   - End date and time
   - Description (summary of the event)

2. Generate a valid iCalendar (ICS) file format for the event.

3. Return a JSON response with two parts:
   - "icsContent": The full ICS file content as a string
   - "eventDetails": An object with the extracted event details: {title, location, start, end, description}

Make sure all dates are in proper ISO format (YYYY-MM-DDTHH:MM:SS). If a specific time is not mentioned, make a reasonable guess based on context.`
          },
          {
            role: 'user',
            content: emailContent
          }
        ],
        temperature: 0.3
      })
    });
    
    if (!gptResponse.ok) {
      const errorData = await gptResponse.json();
      throw new Error(errorData.error?.message || 'API request failed');
    }
    
    const gptData = await gptResponse.json();
    const content = gptData.choices[0].message.content;
    
    // Parse the response
    try {
      const parsedResponse = JSON.parse(content);
      
      // Validate the response contains required fields
      if (!parsedResponse.icsContent || !parsedResponse.eventDetails) {
        throw new Error('Invalid response format from AI');
      }
      
      // Return the successful response
      return res.status(200).json({
        success: true,
        icsContent: parsedResponse.icsContent,
        eventDetails: parsedResponse.eventDetails
      });
    } catch (parseError) {
      console.error('Error parsing ChatGPT response:', parseError);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to parse response from AI' 
      });
    }
  } catch (error) {
    console.error('Error generating ICS:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    });
  }
}