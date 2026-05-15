"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, Image as ImageIcon, AlertCircle } from "lucide-react"

// 👇 Keep your Cloudinary details here 👇
const CLOUD_NAME = "duirosoxe"; 
const UPLOAD_PRESET = "medisense";

export default function ImageUploader({ patientId, currentImages = [], onImageProcessed }) {
  const [isUploading, setIsUploading] = useState(false);
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
      // 👇 FIX: Extract only the raw string URLs from any old mock data 👇
      const cleanOldImages = (currentImages || []).map(img => typeof img === 'string' ? img : img?.url).filter(Boolean);
      const updatedImagesList = [...cleanOldImages, secureUrl];

      // PHASE 2: Save ONLY the URL array to MongoDB Patient Record
      const updateRes = await fetch(`http://localhost:5000/api/patients/${patientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: updatedImagesList })
      });

      const updateData = await updateRes.json();
      if (updateRes.ok) {
        onImageProcessed(updateData.patient || updateData.data || updateData);
      } else {
        throw new Error("Failed to save to database");
      }

    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong during upload.");
    } finally {
      setIsUploading(false);
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
        ) : (
          <>
            <ImageIcon className="h-12 w-12 text-blue-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Upload Medical Scan
            </h3>
            <p className="text-sm text-gray-500 mb-4 max-w-xs">
              Upload an image to add it to the patient's medical gallery.
            </p>
            
            <div className="relative">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isUploading}
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