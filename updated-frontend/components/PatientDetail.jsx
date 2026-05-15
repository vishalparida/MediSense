"use client";

import { useState, useCallback } from "react";
import {
  User,
  Phone,
  MapPin,
  FileText,
  ImageIcon,
  Edit,
  Save,
  X,
  Send,
  Brain,
  Upload,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ImageUploader from "@/components/ImageUploader";

const formatReportText = (text) => {
  if (!text) return null;
  return text.split("\n").map((line, lineIndex) => {
    if (!line.trim()) {
      return <div key={lineIndex} className="h-2" />;
    }
    const parts = line.split(/\*\*(.*?)\*\*/g);
    return (
      <div key={lineIndex} className="mb-2">
        {parts.map((part, partIndex) => {
          if (partIndex % 2 === 1) {
            return (
              <span key={partIndex} className="font-bold">
                {part}
              </span>
            );
          }
          return <span key={partIndex}>{part}</span>;
        })}
      </div>
    );
  });
};

export default function PatientDetail({
  patient,
  onStatusUpdate,
  doctors,
  onPatientUpdate,
}) {
  // 👇 THE MAGIC FIX: Lock the ID securely so it can never be undefined 👇
  const securePatientId = patient?.id || patient?._id;

  const [isEditing, setIsEditing] = useState(false);
  const [isRegeneratingReport, setIsRegeneratingReport] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showDoctorSelection, setShowDoctorSelection] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isReassigning, setIsReassigning] = useState(false);

  const [editedData, setEditedData] = useState({
    name: patient.name,
    age: patient.age,
    phone: patient.phone,
    village: patient.village,
    district: patient.district,
    state: patient.state,
    symptoms: patient.symptoms,
    medicalHistory: patient.medicalHistory,
    images: [...(patient.images || [])],
  });

  const indianStates = [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
  ];

  const handleInputChange = useCallback((field, value) => {
    setEditedData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  }, []);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const imageUrls = files.map((file) => ({
      url: URL.createObjectURL(file),
      label: "Uploaded Image",
    }));
    setEditedData((prev) => ({
      ...prev,
      images: [...prev.images, ...imageUrls],
    }));
    setHasChanges(true);
  };

  const removeImage = (index) => {
    setEditedData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
    setHasChanges(true);
  };

  // --- Save Changes to DB ---
  const handleSaveChanges = async () => {
    if (!securePatientId) return alert("Error: Missing Patient ID");

    try {
      const response = await fetch(
        `http://localhost:5000/api/patients/${securePatientId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editedData),
        },
      );
      const data = await response.json();

      if (response.ok) {
        // Force merge the old patient data with the new so the ID is never lost
        const returnedPatient = data.patient || data.data || data;
        const updatedPatient = {
          ...patient,
          ...returnedPatient,
          id: securePatientId,
          assignedDoctor: patient.assignedDoctor,
        };
        onPatientUpdate(updatedPatient);
        setIsEditing(false);
        setHasChanges(false);
      } else {
        alert("Failed to update patient: " + data.message);
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("Server error. Ensure backend is running.");
    }
  };

  const handleCancelEdit = () => {
    setEditedData({
      name: patient.name,
      age: patient.age,
      phone: patient.phone,
      village: patient.village,
      district: patient.district,
      state: patient.state,
      symptoms: patient.symptoms,
      medicalHistory: patient.medicalHistory,
      images: [...(patient.images || [])],
    });
    setIsEditing(false);
    setHasChanges(false);
  };

  // --- Call Real AI and Save to DB ---
  const handleRegenerateReport = async () => {
    if (!securePatientId) return alert("Error: Missing Patient ID");
    setIsRegeneratingReport(true);

    try {
      const aiResponse = await fetch(
        "http://localhost:5000/api/ai/generate-report",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            age: editedData.age,
            gender: patient.gender,
            symptoms: editedData.symptoms,
            medicalHistory: editedData.medicalHistory,
          }),
        },
      );

      const aiData = await aiResponse.json();

      if (aiResponse.ok) {
        const updateResponse = await fetch(
          `http://localhost:5000/api/patients/${securePatientId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ aiSummary: aiData.report }),
          },
        );

        const updateData = await updateResponse.json();

        if (updateResponse.ok) {
          const returnedPatient =
            updateData.patient || updateData.data || updateData;
          const updatedPatient = {
            ...patient,
            ...returnedPatient,
            id: securePatientId,
            assignedDoctor: patient.assignedDoctor,
          };
          onPatientUpdate(updatedPatient);
          setHasChanges(true);
        }
      } else {
        alert("AI Generation failed: " + aiData.message);
      }
    } catch (error) {
      console.error("AI Error:", error);
    } finally {
      setIsRegeneratingReport(false);
    }
  };

  // --- Send fully updated case to Doctor in DB ---
  const handleSendToDoctor = async () => {
    if (!selectedDoctor || !securePatientId) return;
    setIsSending(true);

    try {
      const payload = {
        ...editedData,
        assignedDoctor: selectedDoctor,
        status: "awaiting_doctor",
      };

      const response = await fetch(
        `http://localhost:5000/api/patients/${securePatientId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const data = await response.json();

      if (response.ok) {
        const doctorDetails = doctors.find((d) => d.id === selectedDoctor);
        const returnedPatient = data.patient || data.data || data;
        const updatedPatient = {
          ...patient,
          ...returnedPatient,
          id: securePatientId,
          assignedDoctor: doctorDetails ? { ...doctorDetails } : null,
        };

        onPatientUpdate(updatedPatient);
        setShowSendModal(true);
        setShowDoctorSelection(false);
        setHasChanges(false);

        setTimeout(() => setShowSendModal(false), 2000);
      } else {
        alert("Failed to send to doctor: " + data.message);
      }
    } catch (error) {
      console.error("Send error:", error);
      alert("Server error.");
    } finally {
      setIsSending(false);
    }
  };

// --- Dedicated Doctor Reassignment ---
const handleReassignDoctor = async (newDoctorId) => {
  if (!securePatientId) return;

  try {
    const payload = {
      assignedDoctor: newDoctorId,
      status: "awaiting_doctor",
      // 👇 THE FIX: Wipe the previous doctor's work so the new doctor gets a clean slate 👇
      doctorResponse: null 
    };

    const response = await fetch(`http://localhost:5000/api/patients/${securePatientId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.ok) {
      const newDoctorDetails = doctors.find((d) => d.id === newDoctorId);
      const returnedPatient = data.patient || data.data || data;
      
      const updatedPatient = {
        ...patient,
        ...returnedPatient,
        id: securePatientId,
        assignedDoctor: newDoctorDetails ? { ...newDoctorDetails } : null,
        // 👇 Ensure React instantly clears the UI without needing a refresh 👇
        doctorResponse: null 
      };

      onPatientUpdate(updatedPatient);
      setIsReassigning(false);
      alert(`Case successfully reassigned to ${newDoctorDetails?.name}. Previous medical notes have been cleared.`);
    } else {
      alert("Failed to reassign doctor: " + data.message);
    }
  } catch (error) {
    console.error("Reassign error:", error);
    alert("Server error.");
  }
};

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6">
        {/* Patient Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-4 flex-1">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-2">
                    <Input
                      value={editedData.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      className="text-xl font-bold"
                    />
                    <p className="text-gray-600 dark:text-gray-400">
                      Patient ID: {securePatientId}
                    </p>
                  </div>
                ) : (
                  <>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {patient.name}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                      Patient ID: {securePatientId}
                    </p>
                  </>
                )}

                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {isEditing ? (
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        value={editedData.age}
                        onChange={(e) =>
                          handleInputChange("age", e.target.value)
                        }
                        className="w-16 h-8"
                      />
                      <span>years • {patient.gender}</span>
                    </div>
                  ) : (
                    <span>
                      {patient.age} years • {patient.gender}
                    </span>
                  )}

                  <span className="flex items-center space-x-1">
                    <Phone className="h-4 w-4" />
                    {isEditing ? (
                      <Input
                        value={editedData.phone}
                        onChange={(e) =>
                          handleInputChange("phone", e.target.value)
                        }
                        className="w-32 h-8"
                      />
                    ) : (
                      <span>{patient.phone}</span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons - Fixed Layout */}
            <div className="flex items-center space-x-2 ml-4">
              {!isEditing ? (
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  className="whitespace-nowrap"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Details
                </Button>
              ) : (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    onClick={handleCancelEdit}
                    size="sm"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                  <Button onClick={handleSaveChanges} size="sm">
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
            <MapPin className="h-4 w-4" />
            {isEditing ? (
              <div className="flex space-x-2">
                <Input
                  value={editedData.village}
                  onChange={(e) => handleInputChange("village", e.target.value)}
                  placeholder="Village"
                  className="w-24 h-8"
                />
                <Input
                  value={editedData.district}
                  onChange={(e) =>
                    handleInputChange("district", e.target.value)
                  }
                  placeholder="District"
                  className="w-24 h-8"
                />
                <Select
                  value={editedData.state || ""}
                  onValueChange={(value) => handleInputChange("state", value)}
                >
                  <SelectTrigger className="w-32 h-8">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {indianStates.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <span>
                {patient.village}, {patient.district}, {patient.state}
              </span>
            )}
          </div>
        </div>

        {/* Symptoms & Medical History */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span>Current Symptoms</span>
            </h2>
            {isEditing ? (
              <Textarea
                value={editedData.symptoms}
                onChange={(e) => handleInputChange("symptoms", e.target.value)}
                rows={4}
                className="w-full"
              />
            ) : (
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {patient.symptoms}
              </p>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center space-x-2">
              <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
              <span>Medical History</span>
            </h2>
            {isEditing ? (
              <Textarea
                value={editedData.medicalHistory}
                onChange={(e) =>
                  handleInputChange("medicalHistory", e.target.value)
                }
                rows={4}
                className="w-full"
              />
            ) : (
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {patient.medicalHistory}
              </p>
            )}
          </div>
        </div>

        {/* Medical Images & AI Scan */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
              <ImageIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <span>Medical Images & AI Analysis</span>
            </h2>
          </div>

          {/* 👇 FIX: Cloudinary + Vision AI Uploader (NOW ONLY SHOWS IN EDIT MODE) 👇 */}
          {isEditing && (
            <div className="mb-6">
              <ImageUploader
                patientId={securePatientId}
                currentImages={patient.images || []}
                onImageProcessed={(returnedData) => {
                  const freshPatient =
                    returnedData?.patient || returnedData?.data || returnedData;
                  onPatientUpdate({
                    ...patient,
                    ...freshPatient,
                    id: securePatientId,
                    assignedDoctor: patient.assignedDoctor,
                  });
                }}
              />
            </div>
          )}

          {/* Image Gallery */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {/* Show images if they exist */}
            {(isEditing ? editedData.images : patient.images)?.map(
              (imageObj, index) => {
                const url =
                  typeof imageObj === "string" ? imageObj : imageObj?.url;
                return (
                  <div key={index} className="relative group">
                    <img
                      src={url || "/placeholder.svg"}
                      alt={`Medical image ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border dark:border-gray-600 cursor-pointer hover:opacity-75 transition-opacity"
                    />
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                    {!isEditing && (
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-all flex items-center justify-center pointer-events-none">
                        <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-medium">
                          View Full Size
                        </span>
                      </div>
                    )}
                  </div>
                );
              },
            )}
          </div>

          {/* 👇 FIX: Show a friendly message if there are no images yet 👇 */}
          {!(isEditing ? editedData.images : patient.images)?.length &&
            !isEditing && (
              <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
                <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No medical scans have been uploaded yet.
                </p>
              </div>
            )}

          {/* AI Image Analysis Results */}
          {patient.aiImageAnalysis && (
            <div className="mt-6 bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-100 dark:border-purple-800">
              <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-300 mb-2 flex items-center">
                <Brain className="h-4 w-4 mr-2" /> Vision AI Preliminary
                Analysis
              </h3>
              <p className="text-sm text-purple-800 dark:text-purple-200 whitespace-pre-wrap">
                {patient.aiImageAnalysis}
              </p>
            </div>
          )}
        </div>

        {/* AI Report with Regenerate */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-700 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
              <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <span>AI Medical Summary</span>
            </h2>
            <Button
              onClick={handleRegenerateReport}
              disabled={isRegeneratingReport}
              variant="outline"
              className="bg-purple-600 text-white hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600"
            >
              <Brain
                className={`h-4 w-4 mr-2 ${isRegeneratingReport ? "animate-spin" : ""}`}
              />
              {isRegeneratingReport ? "Regenerating..." : "Regenerate Report"}
            </Button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-purple-100 dark:border-purple-700">
            <div className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {formatReportText(patient.aiSummary)}
            </div>
          </div>

          {isRegeneratingReport && (
            <div className="mt-4 flex items-center space-x-2 text-sm text-purple-600 dark:text-purple-400">
              <div className="animate-pulse flex space-x-1">
                <div className="w-2 h-2 bg-purple-600 dark:bg-purple-400 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-purple-600 dark:bg-purple-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-purple-600 dark:bg-purple-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
              <span>AI is analyzing updated patient data...</span>
            </div>
          )}
        </div>

        {/* Assigned Doctor */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Assigned Doctor</h2>
            
            {/* The new Reassign Button */}
            {patient.assignedDoctor && !isReassigning && (
              <Button variant="outline" size="sm" onClick={() => setIsReassigning(true)}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reassign Case
              </Button>
            )}
          </div>

          {!isReassigning ? (
            patient.assignedDoctor ? (
              <div className="flex items-center space-x-4">
                <img
                  src={patient.assignedDoctor.avatar || "/placeholder.svg"}
                  alt={patient.assignedDoctor.name}
                  className="w-12 h-12 rounded-full border dark:border-gray-600"
                />
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">{patient.assignedDoctor.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{patient.assignedDoctor.specialty}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No doctor currently assigned to this case.</p>
            )
          ) : (
            /* The Reassignment Selection Grid */
            <div className="space-y-4 mt-2 border-t dark:border-gray-700 pt-4">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Select a new doctor to transfer this case to:</p>
              <div className="grid md:grid-cols-2 gap-3">
                {doctors?.map((doctor) => (
                  <div
                    key={doctor.id}
                    onClick={() => handleReassignDoctor(doctor.id)}
                    className="p-3 border rounded-lg cursor-pointer transition-all border-gray-200 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={doctor.avatar || "/placeholder.svg"}
                        alt={doctor.name}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">{doctor.name}</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{doctor.specialty}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="ghost" onClick={() => setIsReassigning(false)} className="mt-2 text-gray-500">
                Cancel Reassignment
              </Button>
            </div>
          )}
        </div>

        {/* Send to Doctor Button - Only show if changes made or report regenerated */}
        {hasChanges && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
            <div className="text-center mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                You have made changes to the patient details or regenerated the
                AI report. Send the updated information to a doctor for review.
              </p>
            </div>

            {!showDoctorSelection ? (
              <Button
                onClick={() => setShowDoctorSelection(true)}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Send className="h-5 w-5 mr-2" />
                Send Updated Case to Doctor
              </Button>
            ) : (
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  Select Doctor
                </h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {doctors?.map((doctor) => (
                    <div
                      key={doctor.id}
                      onClick={() => setSelectedDoctor(doctor.id)}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        selectedDoctor === doctor.id
                          ? "border-blue-500 bg-blue-100 dark:bg-blue-900/30 dark:border-blue-400"
                          : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <img
                          src={doctor.avatar || "/placeholder.svg"}
                          alt={doctor.name}
                          className="w-10 h-10 rounded-full"
                        />
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">
                            {doctor.name}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {doctor.specialty}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            {doctor.experience} • {doctor.location}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowDoctorSelection(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSendToDoctor}
                    disabled={!selectedDoctor || isSending}
                    className="flex-1"
                  >
                    {isSending ? (
                      <>
                        <Send className="h-4 w-4 mr-2 animate-pulse" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send to Selected Doctor
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Send Confirmation Modal */}
      {showSendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm mx-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Updated Case Sent Successfully!
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                The updated patient case has been sent to the assigned doctor.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
