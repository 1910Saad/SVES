const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Global Gemini logic has been moved to the request scope to ensure the latest API Key is always used.
// Context builder for AI
const buildVenueContext = (venueData, analyticsData, alerts) => {
  const activeAlerts = alerts?.filter(a => a.isActive).map(a => `${a.severity}: ${a.title} in ${a.zone}`).join(', ') || 'None';

  return `
    You are the Smart Venue Command Advisor for MetLife Stadium. 
    Current Stadium Stats:
    - Total Attendees: ${venueData?.totalAttendees || 0}
    - Crowd Density: ${venueData?.crowdDensity || 0}%
    - Simulation Time: ${venueData?.simulationTime || 0} minutes
    - Active Alerts: ${activeAlerts}
    
    Predictive Analytics:
    - Peak Attendee Estimate: ${analyticsData?.predictions?.peakAttendance || 'Unknown'}
    - Exit Time Estimate: ${analyticsData?.predictions?.exitEstimate || 'Unknown'}
    
    Answer the following user query strategically as a venue operations professional. 
    Be concise, helpful, and prioritize safety.
  `;
};

// @route   POST api/ai/advise
// @desc    Get advice from Gemini AI based on venue data
router.post('/advise', async (req, res) => {
  try {
    const { prompt, venueContext } = req.body;
    console.log('[AI Advisor] Prompt:', prompt);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MOCK_KEY') {
      return res.json({
        response: "I'm currently in demo mode. Please set a valid GEMINI_API_KEY.",
        isMock: true
      });
    }

    // Direct initialization
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const { venueData, analyticsData, alerts } = venueContext;
    const systemPrompt = buildVenueContext(venueData, analyticsData, alerts);

    console.log('[AI Advisor] Generating content...');
    const chatResult = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: systemPrompt + "\n\nUser Question: " + prompt }] }],
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.7,
      },
    });

    const responseText = chatResult.response.text();
    console.log('[AI Advisor] Content generated successfully.');

    return res.status(200).json({ response: responseText, isMock: false });
  } catch (error) {
    console.error('[AI Advisor] Generation Error:', error.message);
    
    return res.status(500).json({ 
      error: 'AI Advisor Service Unavailable', 
      message: 'The AI model could not process your request at this time.',
      traceId: req.headers['x-request-id'] || 'unknown'
    });
  }
});

module.exports = router;
