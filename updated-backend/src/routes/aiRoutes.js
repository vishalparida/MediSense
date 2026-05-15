const express = require("express");
const router = express.Router();
const Groq = require('groq-sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Groq
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
// console.log()
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/analyze-image', async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ success: false, message: "No image URL provided." });
    }

    // 1. Fetch the image from Cloudinary and convert it to Base64 for Gemini
    const imageResponse = await fetch(imageUrl);
    const arrayBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString('base64');
    const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: mimeType
      }
    };

    // 2. Define the strict prompt for the Vision AI
    const prompt = `You are a highly skilled medical AI assistant analyzing a patient's medical image or scan.
    Analyze the provided image and give a concise, professional preliminary assessment.
    Point out any visible abnormalities, potential areas of concern, and state what type of scan or image this appears to be.
    IMPORTANT rules:
    - Keep it under 4 sentences.
    - End with: "Disclaimer: This is an AI preliminary analysis and must be verified by a human doctor."
    - Output plain text only. No markdown, bolding, or bullet points.`;

    // 3. Call Gemini 1.5 Flash
    // New code
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });    const result = await model.generateContent([prompt, imagePart]);
    const analysisText = result.response.text();

    res.status(200).json({
      success: true,
      analysis: analysisText
    });

  } catch (error) {
    console.error("Vision AI Error:", error);
    res.status(500).json({ success: false, message: "Failed to analyze image." });
  }
});
// GET /api/ai/list-models - Temporary debug route
router.get('/list-models', async (req, res) => {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const data = await response.json();
    
    // Filter to only show models that support generating content
    const supportedModels = data.models
      .filter(m => m.supportedGenerationMethods.includes("generateContent"))
      .map(m => m.name);
      
    res.json({ success: true, availableModels: supportedModels });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/analyze-image", async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res
        .status(400)
        .json({ success: false, message: "No image URL provided." });
    }

    // 1. Fetch the image from Cloudinary and convert it to Base64 for Gemini
    const imageResponse = await fetch(imageUrl);
    const arrayBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString("base64");
    const mimeType = imageResponse.headers.get("content-type") || "image/jpeg";

    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: mimeType,
      },
    };

    // 2. Define the strict prompt for the Vision AI
    const prompt = `You are a highly skilled medical AI assistant analyzing a patient's medical image or scan.
    Analyze the provided image and give a concise, professional preliminary assessment.
    Point out any visible abnormalities, potential areas of concern, and state what type of scan or image this appears to be.
    IMPORTANT rules:
    - Keep it under 4 sentences.
    - End with: "Disclaimer: This is an AI preliminary analysis and must be verified by a human doctor."
    - Output plain text only. No markdown, bolding, or bullet points.`;

    // 3. Call Gemini 1.5 Flash
    // New code
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent([prompt, imagePart]);
    const analysisText = result.response.text();

    res.status(200).json({
      success: true,
      analysis: analysisText,
    });
  } catch (error) {
    console.error("Vision AI Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to analyze image." });
  }
});
// GET /api/ai/list-models - Temporary debug route
router.get("/list-models", async (req, res) => {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`,
    );
    const data = await response.json();

    // Filter to only show models that support generating content
    const supportedModels = data.models
      .filter((m) => m.supportedGenerationMethods.includes("generateContent"))
      .map((m) => m.name);

    res.json({ success: true, availableModels: supportedModels });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/generate-report", async (req, res) => {
  try {
    const { age, gender, symptoms, medicalHistory, images } = req.body;

    // Validate required fields
    if (!age || !gender || !symptoms) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Age, gender, and symptoms are required fields.",
        });
    }

    // Validate age is a positive number
    const ageNum = parseInt(age);
    if (isNaN(ageNum) || ageNum <= 0) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Age must be a valid positive number.",
        });
    }

    // Build image context
    let imageContext = "";
    if (images && images.length > 0) {
      imageContext = `\nMedical Images Provided: ${images.length} medical image(s) uploaded for analysis.`;
    }

    const prompt = `Act as a medical triage assistant. Analyze the following patient details:
    Age: ${age}
    Gender: ${gender}
    Symptoms: ${symptoms}
    Medical History: ${medicalHistory || "None reported"}${imageContext}

    Provide exactly the following information in point wise format, with clear line breaks between each numbered point:
    1. A concise summary of the patient profile, current symptoms, and medical history along with possible initial diagnosis about what you think the problem might be.
    2. Suggest probable causes or diseases based on the symptoms and history along with any medical tests, diagnostics, or treatments required.
    3. Case Severity: [State strictly "Low", "Medium", or "High"].
    4. Action: [State strictly "Video Consultation Required" or "Textual Triage Sufficient"].
    CRITICAL RULES:
    - Do NOT use any Markdown formatting or asterisks`;

    // Call Groq using the upgraded Llama 3.1 model
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.2,
    });

    let report =
      chatCompletion.choices[0]?.message?.content || "Failed to generate text.";

    // Format the response: bold Case Severity and Action, ensure newlines
    report = report.replace(/Case Severity:/g, "**Case Severity:**");
    report = report.replace(/Action:/g, "**Action:**");

    // Ensure proper line breaks between numbered points
    report = report.replace(/\n(\d+\.)\s/g, "\n\n$1 ");

    res.status(200).json({
      success: true,
      report: report,
    });
  } catch (error) {
    console.error("AI Generation Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to generate AI report" });
  }
});

module.exports = router;
