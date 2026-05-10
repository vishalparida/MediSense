const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');

// Initialize Groq
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

router.post('/generate-report', async (req, res) => {
  try {
    const { age, gender, symptoms, medicalHistory } = req.body;

    const prompt = `Act as a medical triage assistant. Analyze the following patient details:
    Age: ${age}
    Gender: ${gender}
    Symptoms: ${symptoms}
    Medical History: ${medicalHistory || 'None reported'}

    Provide exactly the following information and nothing else:
    1. A concise 2-3 line summary of the patient profile, current symptoms, and medical history.
    2. Case Severity: [State strictly "Low", "Medium", or "High"].
    3. Action: [State strictly "Video Consultation Required" or "Textual Triage Sufficient"].

    CRITICAL RULES:
    - DO NOT suggest probable causes or diseases.
    - DO NOT recommend any medical tests, diagnostics, or treatments.
    - DO NOT use any Markdown formatting, asterisks, or bold text. Output plain text only.`;

    // Call Groq using the upgraded Llama 3.1 model
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      // 👇 UPDATED MODEL NAME HERE 👇
      model: "llama-3.1-8b-instant", 
      temperature: 0.2, 
    });

    const report = chatCompletion.choices[0]?.message?.content || "Failed to generate text.";

    res.status(200).json({ 
      success: true, 
      report: report 
    });

  } catch (error) {
    console.error("AI Generation Error:", error);
    res.status(500).json({ success: false, message: "Failed to generate AI report" });
  }
});

module.exports = router;