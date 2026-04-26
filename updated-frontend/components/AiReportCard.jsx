"use client"

import { Brain, Sparkles } from "lucide-react"
import { useState } from "react"

// Passed patientId and an optional onUpdate callback from the parent component
export default function AiReportCard({ patientId, initialSummary, onUpdate }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentSummary, setCurrentSummary] = useState(initialSummary || "")

  const handleGenerateReport = async () => {
    if (!patientId) {
      alert("Error: Missing patient ID.");
      return;
    }

    setIsGenerating(true);

    try {
      // 1. Fetch the freshest patient details directly from the Database
      const fetchResponse = await fetch(`http://localhost:5000/api/patients/${patientId}`);
      const fetchData = await fetchResponse.json();

      if (!fetchResponse.ok) throw new Error("Failed to fetch latest patient data");
      const freshPatient = fetchData.patient;

      // 2. Send the fresh data to your Gemini AI route
      const aiResponse = await fetch("http://localhost:5000/api/ai/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          age: freshPatient.age,
          gender: freshPatient.gender,
          symptoms: freshPatient.symptoms,
          medicalHistory: freshPatient.medicalHistory,
        }),
      });
      
      const aiData = await aiResponse.json();
      if (!aiResponse.ok) throw new Error(aiData.message || "AI Generation failed");
      
      const newSummary = aiData.report;

      // 3. Save the new AI summary back to the patient's database record
      const updateResponse = await fetch(`http://localhost:5000/api/patients/${patientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aiSummary: newSummary }),
      });

      if (updateResponse.ok) {
        // 4. Update the UI
        setCurrentSummary(newSummary);
        setIsExpanded(true);
        if (onUpdate) onUpdate(newSummary); // Notify parent component if needed
      } else {
        throw new Error("Failed to save new summary to database");
      }

    } catch (error) {
      console.error("Regeneration error:", error);
      alert("Error regenerating report. Check the console for details.");
    } finally {
      setIsGenerating(false);
    }
  }

  const truncatedSummary = currentSummary.length > 150 ? currentSummary.substring(0, 150) + "..." : currentSummary

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
          <Brain className="h-5 w-5 text-purple-600" />
          <span>AI Medical Summary</span>
        </h2>
        <button
          onClick={handleGenerateReport}
          disabled={isGenerating}
          className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          aria-label="Generate new AI report"
        >
          <Sparkles className={`h-4 w-4 ${isGenerating ? "animate-spin" : ""}`} />
          <span>{isGenerating ? "Generating..." : "Regenerate"}</span>
        </button>
      </div>

      <div className="bg-white rounded-lg p-4 border border-purple-100">
        <p className="text-gray-700 leading-relaxed">{isExpanded ? currentSummary : truncatedSummary}</p>

        {currentSummary.length > 150 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-3 text-purple-600 hover:text-purple-700 text-sm font-medium"
            aria-label={isExpanded ? "Show less" : "Show more"}
          >
            {isExpanded ? "Show Less" : "Read More"}
          </button>
        )}
      </div>

      {isGenerating && (
        <div className="mt-4 flex items-center space-x-2 text-sm text-purple-600">
          <div className="animate-pulse flex space-x-1">
            <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
            <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
          </div>
          <span>AI is analyzing fresh patient data...</span>
        </div>
      )}
    </div>
  )
}