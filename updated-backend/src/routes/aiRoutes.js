const express = require("express");
const router = express.Router();
const Groq = require('groq-sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Groq
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
// console.log()
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// POST /api/ai/analyze-image
router.post('/analyze-image', async (req, res) => {
  try {
    // 👇 FIX 1: Destructure 'imageUrls' (plural) from the body
    const { imageUrls } = req.body;

    // 👇 FIX 2: Check that it exists AND is an array with at least one item
    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return res.status(400).json({ success: false, message: "No image URLs provided." });
    }

    // 👇 FIX 3: Loop through the array and download ALL images at once
    const imageParts = await Promise.all(
      imageUrls.map(async (url) => {
        const imageResponse = await fetch(url);
        const arrayBuffer = await imageResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';
        
        return {
          inlineData: {
            data: buffer.toString('base64'),
            mimeType: mimeType
          }
        };
      })
    );

    // 4. Define the strict prompt for the Vision AI
    const prompt = `You are a highly skilled medical AI assistant analyzing a patient's medical scans. 
    You have been provided with ${imageParts.length} image(s). 
    Analyze the provided images and give a concise, professional preliminary assessment of the overall findings.
    Point out any visible abnormalities, potential areas of concern, and state what type of scans these appear to be.
    IMPORTANT rules:
    - Keep it under 5 sentences.
    - End with: "Disclaimer: This is an AI preliminary analysis and must be verified by a human doctor."
    - Output plain text only. No markdown, bolding, or bullet points.`;

    // 5. Call Gemini 1.5 Flash with the prompt AND the entire array of images
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent([prompt, ...imageParts]);
    const analysisText = result.response.text();

    res.status(200).json({ 
      success: true, 
      analysis: analysisText 
    });

  } catch (error) {
    console.error("Vision AI Error:", error);
    res.status(500).json({ success: false, message: "Failed to analyze images." });
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
// POST /api/ai/analyze-image
// POST /api/ai/analyze-image
router.post('/analyze-image', async (req, res) => {
  try {
    // 👇 FIX 1: Look for the plural 'imageUrls' array that the frontend is now sending
    const { imageUrls } = req.body;

    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return res.status(400).json({ success: false, message: "No images provided for analysis." });
    }

    // 👇 FIX 2: Loop through the array, download all images, and prepare them for Gemini
    const imageParts = await Promise.all(
      imageUrls.map(async (url) => {
        const imageResponse = await fetch(url);
        const arrayBuffer = await imageResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';
        
        return {
          inlineData: {
            data: buffer.toString('base64'),
            mimeType: mimeType
          }
        };
      })
    );

    // Prompt for Gemini
    const prompt = `You are a highly skilled medical AI assistant analyzing a patient's medical scans. 
    You have been provided with ${imageParts.length} image(s). 
    Analyze the provided images and give a concise, professional preliminary assessment of the overall findings.
    Point out any visible abnormalities, potential areas of concern, and state what type of scans these appear to be.
    IMPORTANT rules:
    - Keep it under 5 sentences.
    - End with: "Disclaimer: This is an AI preliminary analysis and must be verified by a human doctor."
    - Output plain text only. No markdown, bolding, or bullet points.`;

    // 👇 FIX 3: Pass the prompt AND the array of images to Gemini 1.5 Flash
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent([prompt, ...imageParts]);
    const analysisText = result.response.text();

    res.status(200).json({ 
      success: true, 
      analysis: analysisText 
    });

  } catch (error) {
    console.error("Vision AI Error:", error);
    res.status(500).json({ success: false, message: "Failed to analyze images." });
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
      return res.status(400).json({
        success: false,
        message: "Age, gender, and symptoms are required fields.",
      });
    }

    // Validate age is a positive number
    const ageNum = parseInt(age);
    if (isNaN(ageNum) || ageNum <= 0) {
      return res.status(400).json({
        success: false,
        message: "Age must be a valid positive number.",
      });
    }

    // Build the strict prompt
    const prompt = `Act as a medical triage assistant. Analyze the following patient details:
    Age: ${age}
    Gender: ${gender}
    Symptoms: ${symptoms}
    Medical History: ${medicalHistory || "None reported"}

    Provide exactly the following information in point-wise format, with clear line breaks between each numbered point:
    1. Case Severity: [State strictly "Low", "Medium", or "High"].
    2. A concise summary of the patient profile, current symptoms, and medical history along with possible initial diagnosis about what you think the problem might be.
    3. Suggest probable causes or diseases based on the symptoms and history along with any medical tests, diagnostics, or treatments required.
    4. Include a brief analysis of any provided medical images and their implications.
    5. Action: [State strictly "Video Consultation Required" or "Textual Triage Sufficient"].
    
    CRITICAL RULES:
    - Do NOT use any Markdown formatting or asterisks natively in your output.`;

    // 👇 FIX 1: Format the payload for Groq Vision 👇
    // Groq Vision requires an array mixing text and image URLs
    const messageContent = [
      { type: "text", text: prompt }
    ];

    // If images exist, push each Cloudinary URL into the Vision array
    if (images && Array.isArray(images) && images.length > 0) {
      images.forEach((imgUrl) => {
        messageContent.push({
          type: "image_url",
          image_url: { 
            url: imgUrl 
          }
        });
      });
    }

    // 👇 FIX 2: Call Groq using the Llama 3.2 Vision model 👇
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: messageContent, // Pass the mixed text/image array
        },
      ],
      model: "llama-3.2-11b-vision-preview", // upgraded to the Vision model!
      temperature: 0.2,
    });

    let report = chatCompletion.choices[0]?.message?.content || "Failed to generate text.";

    // Format the response: bold Case Severity and Action, ensure newlines
    // (This works perfectly with your React frontend's parser!)
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
    res.status(500).json({ success: false, message: "Failed to generate AI report" });
  }
});

module.exports = router;
