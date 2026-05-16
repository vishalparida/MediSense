"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, Image as ImageIcon, AlertCircle } from "lucide-react"
import {  Trash2, Loader2 } from "lucide-react";

// 👇 Keep your Cloudinary details here 👇
const CLOUD_NAME = "duirosoxe"; 
const UPLOAD_PRESET = "medisense";

export default function ImageUploader({ patientId, currentImages = [], onImageProcessed }) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [deletingIndex, setDeletingIndex] = useState(null);

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

  const handleDeleteImage = async (indexToDelete) => {
    // Confirm before deleting
    if (!window.confirm("Are you sure you want to delete this image? This will permanently remove it from the database.")) {
      return;
    }

    setDeletingIndex(indexToDelete);

    try {
      // 1. Filter out the image the user clicked on
      const updatedImagesList = (currentImages || [])
        .filter((_, index) => index !== indexToDelete) // Remove the specific index
        .map(img => typeof img === 'string' ? img : img?.url) // Ensure pure strings
        .filter(Boolean); // Remove nulls/undefined

      // 2. Send the new, shortened array to MongoDB
      const response = await fetch(`http://localhost:5000/api/patients/${patientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: updatedImagesList })
      });

      if (!response.ok) throw new Error("Failed to delete image from database");

      const data = await response.json();

      // 3. Update the parent PatientDetail component instantly!
      if (onImageProcessed) {
        onImageProcessed(data);
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete image. Please try again.");
    } finally {
      setDeletingIndex(null);
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
              {/* 👇 NEW: Display existing images with Delete functionality 👇 */}
      {currentImages && currentImages.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Currently Saved Scans ({currentImages.length})
          </h4>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {currentImages.map((img, index) => {
              // Safely extract the string URL just in case
              const imgUrl = typeof img === 'string' ? img : img?.url;
              
              if (!imgUrl) return null;

              return (
                <div key={index} className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 aspect-square bg-gray-100 dark:bg-gray-800">
                  <img 
                    src={imgUrl} 
                    alt={`Saved scan ${index + 1}`} 
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  
                  {/* Hover Overlay with Trash Button */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                    <button
                      onClick={() => handleDeleteImage(index)}
                      disabled={deletingIndex === index}
                      className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transform transition-transform hover:scale-110 disabled:opacity-50 disabled:hover:scale-100"
                      title="Delete Image"
                    >
                      {deletingIndex === index ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Trash2 className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
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