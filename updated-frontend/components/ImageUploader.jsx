"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, Image as ImageIcon, Sparkles, AlertCircle } from "lucide-react"

// 👇 REPLACE THESE WITH YOUR CLOUDINARY DETAILS 👇
const CLOUD_NAME = "duirosoxe"; 
const UPLOAD_PRESET = "medisense";

// 👇 FIX: Notice 'currentImages = []' is now safely declared in the props 👇
export default function ImageUploader({ patientId, currentImages = [], onImageProcessed }) {
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState("");

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setError("");

    try {
      // PHASE 1: Upload to Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET);

      const cloudinaryRes = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: formData,
      });
      const cloudinaryData = await cloudinaryRes.json();

      if (!cloudinaryRes.ok) throw new Error("Failed to upload image to Cloudinary");
      
      const secureUrl = cloudinaryData.secure_url;

      // PHASE 2: Send URL to Backend AI for Analysis
      setIsUploading(false);
      setIsAnalyzing(true);

      const aiRes = await fetch("http://localhost:5000/api/ai/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: secureUrl })
      });
      const aiData = await aiRes.json();
      
      if (!aiRes.ok) throw new Error("AI Analysis failed");

      const aiAnalysis = aiData.analysis;

      // 👇 FIX: Combine old images with the new Cloudinary URL 👇
      const updatedImagesList = [...currentImages, secureUrl];

      // PHASE 3: Save URL and Analysis to MongoDB Patient Record
      const updateRes = await fetch(`http://localhost:5000/api/patients/${patientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        // 👇 FIX: Send standard JSON arrays to MongoDB 👇
        body: JSON.stringify({ 
          images: updatedImagesList,
          aiImageAnalysis: aiAnalysis
        })
      });

      const updateData = await updateRes.json();
      if (updateRes.ok) {
        onImageProcessed(updateData.patient || updateData.data || updateData);
      } else {
        throw new Error("Failed to save to database");
      }

    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong during upload/analysis.");
    } finally {
      setIsUploading(false);
      setIsAnalyzing(false);
    }
  };

  return (
    <Card className="border-dashed border-2 border-blue-200 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800">
      <CardContent className="flex flex-col items-center justify-center p-6 text-center">
        
        {isUploading ? (
          <div className="flex flex-col items-center text-blue-600">
            <Upload className="h-10 w-10 animate-bounce mb-2" />
            <p className="font-medium">Uploading to secure cloud...</p>
          </div>
        ) : isAnalyzing ? (
          <div className="flex flex-col items-center text-purple-600">
            <Sparkles className="h-10 w-10 animate-pulse mb-2" />
            <p className="font-medium">Vision AI is analyzing the scan...</p>
          </div>
        ) : (
          <>
            <ImageIcon className="h-12 w-12 text-blue-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Upload Medical Scan
            </h3>
            <p className="text-sm text-gray-500 mb-4 max-w-xs">
              Upload X-Rays, MRIs, or clinical photos. Our Vision AI will automatically analyze the image for the doctor.
            </p>
            
            <div className="relative">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isUploading || isAnalyzing}
              />
              <Button className="bg-blue-600 hover:bg-blue-700 pointer-events-none">
                <Upload className="h-4 w-4 mr-2" />
                Select Image
              </Button>
            </div>

            {error && (
              <div className="mt-4 flex items-center text-red-600 text-sm">
                <AlertCircle className="h-4 w-4 mr-1" />
                {error}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}