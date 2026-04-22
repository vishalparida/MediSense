const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require('@google/genai');

// Initialize the Gemini SDK
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

router.post('/generate-report', async (req, res) => {
  try {
    const { age, gender, symptoms, medicalHistory } = req.body;

    // Design the prompt to enforce a strict, professional medical format
    const prompt = `Act as a medical triage assistant. Analyze the following patient details:
    Age: ${age}
    Gender: ${gender}
    Symptoms: ${symptoms}
    Medical History: ${medicalHistory || 'None reported'}

    Provide a concise 2-3 line summary of the patient profile and symptoms. 
    Clearly State the perceived seriousness (Low, Medium, or High).
    State clearly if a video consultation is recommended based on the symptoms and history. 
    Keep it strictly professional, objective, and brief.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    res.status(200).json({ 
      success: true, 
      report: response.text 
    });

  } catch (error) {
    console.error("AI Generation Error:", error);
    res.status(500).json({ success: false, message: "Failed to generate AI report" });
  }
});

module.exports = router;