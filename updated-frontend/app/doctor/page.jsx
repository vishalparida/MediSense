"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// 👇 Added Lock and Unlock icons 👇
import { Stethoscope, Video, FileText, LogOut, Heart, User, ChevronDown, Settings, Brain, CheckCircle, Lock, Unlock } from "lucide-react"
import NotificationSystem from "@/components/NotificationSystem"
import PatientQueue from "@/components/PatientQueue"
import { ThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import ProtectedRoute from "@/components/ProtectedRoute"

export default function DoctorDashboard() {
  const { logout } = useAuth();
  const router = useRouter()
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  
  const [patients, setPatients] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const [doctorInfo, setDoctorInfo] = useState({
    name: "Loading...",
    specialty: "...",
    id: "...",
    avatar: "/doctor-avatar.png",
  })

  useEffect(() => {
    const fetchDashboardData = async () => {
      const storedUser = localStorage.getItem("user");

      if (!storedUser) {
        setIsLoading(false);
        return;
      }

      try {
        const user = JSON.parse(storedUser);
        
        setDoctorInfo({
          name: user.fullName || "Doctor",
          specialty: user.specialization || "General Medicine",
          id: user._id ? `D-${user._id.substring(0, 4).toUpperCase()}` : "D001",
          avatar: "/doctor-avatar.png",
        });

        const response = await fetch(`http://localhost:5000/api/patients?doctorId=${user._id}`);
        const data = await response.json();

        if (data.success) {
          const formattedPatients = data.patients.map(p => ({
            ...p,
            id: p._id,
            images: p.images ? p.images.map(img => img.url || img) : [],
            doctorResponse: p.doctorResponse || null,
            videoConsultationNeeded: p.doctorResponse?.action === "request_video"
          }));

          setPatients(formattedPatients);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const savePatientUpdateToDB = async (patientId, updateData) => {
    try {
      const response = await fetch(`http://localhost:5000/api/patients/${patientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to update patient in database");
      }
      return data.patient;
    } catch (error) {
      console.error("Database update error:", error);
      alert("Failed to save changes. Please try again.");
      return null;
    }
  };

  const updatePatientPriority = async (patientId, newPriority) => {
    const updatedPatient = await savePatientUpdateToDB(patientId, { priority: newPriority });
    
    if (updatedPatient) {
      setPatients((prev) =>
        prev.map((patient) => (patient.id === patientId ? { ...patient, priority: newPriority } : patient)),
      )
      if (selectedPatient?.id === patientId) {
        setSelectedPatient((prev) => ({ ...prev, priority: newPriority }))
      }
    }
  }

  const updatePatientStatus = async (patientId, newStatus, response = null) => {
    const updateData = { status: newStatus };
    if (response) updateData.doctorResponse = response;
    
    const updatedPatient = await savePatientUpdateToDB(patientId, updateData);

    if (updatedPatient) {
      setPatients((prev) =>
        prev.map((patient) =>
          patient.id === patientId
            ? {
                ...patient,
                status: newStatus,
                doctorResponse: response,
                videoConsultationNeeded: response?.action === "request_video",
              }
            : patient,
        ),
      )
      if (selectedPatient?.id === patientId) {
        setSelectedPatient((prev) => ({
          ...prev,
          status: newStatus,
          doctorResponse: response,
          videoConsultationNeeded: response?.action === "request_video",
        }))
      }
    }
  }

  const scheduleVideoCall = (patientId, date, time) => {
    const uniqueRoomId = `MediSense-Consult-${patientId}-${Date.now().toString().slice(-4)}`;
    const workingVideoLink = `https://meet.jit.si/${uniqueRoomId}`;

    const currentPatient = patients.find(p => p.id === patientId);

    const response = {
      ...currentPatient?.doctorResponse,
      action: "request_video",
      videoScheduled: {
        date,
        time,
        joinUrl: workingVideoLink, 
      },
      timestamp: new Date().toISOString(),
    }
    
    updatePatientStatus(patientId, "video_scheduled", response)
  }

  const providePrescription = (patientId, prescription, notes, isFinalSubmit = false) => {
    const currentPatient = patients.find(p => p.id === patientId);
    
    const response = {
      ...currentPatient?.doctorResponse, 
      action: isFinalSubmit ? "prescription" : (currentPatient?.doctorResponse?.action || "draft"),
      prescription,
      notes,
      timestamp: new Date().toISOString(),
    }
    
    let finalStatus = currentPatient.status; 
    if (isFinalSubmit) {
      finalStatus = "completed";
    }
    
    updatePatientStatus(patientId, finalStatus, response)
  }

  // 👇 NEW: Function to handle reopening a completed case 👇
  const handleReopenCase = (patientId) => {
    const currentPatient = patients.find(p => p.id === patientId);
    // If they had a video link stored, revert to video_scheduled. Otherwise, awaiting_doctor.
    const revertStatus = currentPatient?.doctorResponse?.videoScheduled ? "video_scheduled" : "awaiting_doctor";
    updatePatientStatus(patientId, revertStatus, currentPatient?.doctorResponse);
  }

  const handleLogout = () => {
    logout();
    router.push("/");
  }

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">Loading Doctor Dashboard...</div>
  }

  return (
    <ProtectedRoute allowedRole="Doctor" redirectTo="/auth/doctor/login">
      <div className="min-h-screen bg-background">
        <header className="bg-card shadow-sm border-b border-border">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Link href="/" className="flex items-center space-x-2">
                  <Heart className="h-8 w-8 text-blue-600" />
                  <span className="font-bold text-xl text-blue-600">MediSense</span>
                </Link>
                <span className="text-muted-foreground">|</span>
                <span className="text-lg font-semibold text-foreground">Doctor Dashboard</span>
              </div>

              <div className="flex items-center space-x-4">
                <NotificationSystem patients={patients} />
                <ThemeToggle />

                <div className="relative">
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">{doctorInfo.name}</p>
                      <p className="text-xs text-muted-foreground">{doctorInfo.specialty} • {doctorInfo.id}</p>
                    </div>
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </button>

                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-card rounded-lg shadow-lg border border-border z-50">
                      <div className="py-1">
                        <button onClick={() => setShowProfileMenu(false)} className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-foreground hover:bg-accent">
                          <User className="h-4 w-4" />
                          <span>View Profile</span>
                        </button>
                        <button onClick={() => setShowProfileMenu(false)} className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-foreground hover:bg-accent">
                          <Settings className="h-4 w-4" />
                          <span>Settings</span>
                        </button>
                        <hr className="my-1 border-border" />
                        <button onClick={handleLogout} className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20">
                          <LogOut className="h-4 w-4" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="flex">
          <div className="w-1/3 bg-card border-r border-border h-screen">
            <PatientQueue patients={patients} selectedPatient={selectedPatient} onPatientSelect={setSelectedPatient} />
          </div>

          <div className="flex-1 p-6">
            {selectedPatient ? (
              <PatientDetailsPanel
                key={selectedPatient.id}
                patient={selectedPatient}
                onUpdatePriority={updatePatientPriority}
                onScheduleVideo={scheduleVideoCall}
                onProvidePrescription={providePrescription}
                onReopenCase={handleReopenCase} // Pass the reopen function down
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Stethoscope className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-foreground mb-2">Select a Patient</h3>
                  <p className="text-muted-foreground">Choose a patient from the list to view details and provide care</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {showProfileMenu && <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />}
      </div>
    </ProtectedRoute>
  )
}

function PatientDetailsPanel({ patient, onUpdatePriority, onScheduleVideo, onProvidePrescription, onReopenCase }) {
  const [activeTab, setActiveTab] = useState("details")
  
  const [prescription, setPrescription] = useState(patient.doctorResponse?.prescription || "")
  const [notes, setNotes] = useState(patient.doctorResponse?.notes || "")
  
  const [videoDate, setVideoDate] = useState("")
  const [videoTime, setVideoTime] = useState("")


  // 👇 NEW: Check if the case is completed to lock the UI
  const isLocked = patient.status === "completed"

  const handleSaveDraft = () => {
    if (prescription.trim() || notes.trim()) {
      onProvidePrescription(patient.id, prescription, notes, false)
    }
  }
  // 👇 THE FIX: A bulletproof HTML injector that guarantees bold formatting 👇
const formatReportText = (text) => {
  if (!text) return "No summary provided.";

  // 1. Safety check: If the backend accidentally double-starred (****), fix it to (**)
  let cleanText = text.replace(/\*\*\*\*/g, "**");

  // 2. Convert all **text** directly into an HTML bold tag
  const htmlText = cleanText.replace(
    /\*\*(.*?)\*\*/g, 
    '<span class="font-bold text-gray-900 dark:text-gray-100">$1</span>'
  );

  // 3. Inject the HTML cleanly, preserving line breaks
  return htmlText.split("\n").map((line, index) => (
    <div 
      key={index} 
      className="mb-2 min-h-[1rem] leading-relaxed" 
      dangerouslySetInnerHTML={{ __html: line }} 
    />
  ));
};
  const handleFinalSubmit = () => {
    onProvidePrescription(patient.id, prescription, notes, true)
  }

  const handleVideoSchedule = () => {
    if (videoDate && videoTime) {
      onScheduleVideo(patient.id, videoDate, videoTime)
      setVideoDate("")
      setVideoTime("")
    }
  }

  return (
    <div className="max-w-4xl">
      {/* 👇 NEW: Lock Banner 👇 */}
      {isLocked && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300 p-3 rounded-md mb-6 flex items-center shadow-sm">
          <Lock className="h-4 w-4 mr-2" />
          <span className="text-sm font-medium">This case is marked as completed and is currently locked. Reopen the case to make changes.</span>
        </div>
      )}

      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{patient.name}</h1>
            <p className="text-muted-foreground">
              {patient.id} • {patient.age} years old • {patient.gender} • {patient.village}, {patient.district}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Badge
              className={`${
                patient.status === "awaiting_doctor"
                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                  : patient.status === "video_scheduled"
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                    : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
              }`}
            >
              {patient.status === "awaiting_doctor" && "Awaiting Review"}
              {patient.status === "video_scheduled" && "Video Scheduled"}
              {patient.status === "completed" && "Completed"}
            </Badge>

            {/* Render Complete Button OR Reopen Button based on lock state */}
            {!isLocked ? (
              <Button onClick={handleFinalSubmit} className="bg-green-600 hover:bg-green-700 text-white ml-2">
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark Case Complete
              </Button>
            ) : (
              <Button onClick={() => onReopenCase(patient.id)} variant="outline" className="border-yellow-600 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 ml-2">
                <Unlock className="h-4 w-4 mr-2" />
                Reopen Case
              </Button>
            )}
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="details">Patient Details</TabsTrigger>
          <TabsTrigger value="response">Doctor Response</TabsTrigger>
          <TabsTrigger value="video">Video Consultation</TabsTrigger>
          <TabsTrigger value="prescription">Prescription</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Patient Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Contact</Label>
                  <p className="text-foreground">{patient.phone}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Location</Label>
                  <p className="text-foreground">
                    {patient.village}, {patient.district}, {patient.state}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">Current Symptoms</Label>
                <p className="text-foreground mt-1">{patient.symptoms}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">Medical History</Label>
                <p className="text-foreground mt-1">{patient.medicalHistory || "No significant medical history"}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">AI Medical Summary</Label>
                <p className="text-foreground mt-1 whitespace-pre-wrap">{formatReportText(patient.aiSummary)}</p>
              </div>

              {patient.images && patient.images.length > 0 && (
                <div className="pt-4 mt-4 border-t border-border">
                  <Label className="text-sm font-medium text-muted-foreground mb-3 block">Patient Medical Scans</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {patient.images.map((imgUrl, index) => (
                      <a key={index} href={imgUrl} target="_blank" rel="noopener noreferrer" className="block relative group">
                        <img
                          src={imgUrl || "/placeholder.svg"}
                          alt={`Scan ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-border"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg flex items-center justify-center">
                          <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-medium">View Full Size</span>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {patient.aiImageAnalysis && (
                <div className="mt-2 bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-100 dark:border-purple-800">
                  <Label className="text-sm font-semibold text-purple-900 dark:text-purple-300 mb-2 flex items-center">
                    <Brain className="h-4 w-4 mr-2" /> ML Model Preliminary Analysis
                  </Label>
                  <p className="text-sm text-purple-800 dark:text-purple-200 whitespace-pre-wrap leading-relaxed">
                    {patient.aiImageAnalysis}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="response" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Doctor Response</CardTitle>
              <CardDescription>Provide your clinical notes and assessment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="notes">Clinical Notes</Label>
                {/* 👇 Disabled Textarea if locked 👇 */}
                <Textarea
                  disabled={isLocked}
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter your clinical assessment, diagnosis, and recommendations..."
                  rows={6}
                />
              </div>
              
              {/* 👇 Disabled Save Button if locked 👇 */}
              {!isLocked && (
                <Button onClick={handleSaveDraft} disabled={!notes.trim()} variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
                  <FileText className="h-4 w-4 mr-2" />
                  Save Notes (Draft)
                </Button>
              )}

              {patient.doctorResponse?.notes && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-green-600 dark:text-green-400 flex items-center font-medium">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Notes safely saved to database
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="video" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Schedule Video Consultation</CardTitle>
              <CardDescription>Schedule a video call with the patient for detailed examination</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="videoDate">Date</Label>
                  <Input disabled={isLocked} id="videoDate" type="date" value={videoDate} onChange={(e) => setVideoDate(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="videoTime">Time</Label>
                  <Input disabled={isLocked} id="videoTime" type="time" value={videoTime} onChange={(e) => setVideoTime(e.target.value)} />
                </div>
              </div>
              
              {/* 👇 Disabled Button if locked 👇 */}
              {!isLocked && (
                <Button onClick={handleVideoSchedule} disabled={!videoDate || !videoTime}>
                  <Video className="h-4 w-4 mr-2" />
                  Schedule Video Consultation
                </Button>
              )}

              {patient.doctorResponse?.videoScheduled && (
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-4">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Scheduled Video Consultation</h4>
                  <p className="text-blue-800 dark:text-blue-200 text-sm">
                    Date: {patient.doctorResponse.videoScheduled.date} at {patient.doctorResponse.videoScheduled.time}
                  </p>
                  <Button className="mt-2" size="sm" asChild>
                    <a href={patient.doctorResponse.videoScheduled.joinUrl} target="_blank" rel="noopener noreferrer">
                      Join Meeting
                    </a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prescription" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Prescription & Treatment</CardTitle>
              <CardDescription>Provide prescription and treatment recommendations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="prescription">Prescription</Label>
                {/* 👇 Disabled Textarea if locked 👇 */}
                <Textarea
                  disabled={isLocked}
                  id="prescription"
                  value={prescription}
                  onChange={(e) => setPrescription(e.target.value)}
                  placeholder="Enter medications, dosage, and treatment instructions..."
                  rows={4}
                />
              </div>
              
              {/* 👇 Disabled Save Button if locked 👇 */}
              {!isLocked && (
                <Button onClick={handleSaveDraft} disabled={!prescription.trim()} variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
                  <FileText className="h-4 w-4 mr-2" />
                  Save Prescription (Draft)
                </Button>
              )}

              {patient.doctorResponse?.prescription && (
                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mt-4">
                  <h4 className="font-medium text-green-900 dark:text-green-100 mb-2 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Prescription Saved
                  </h4>
                  <p className="text-green-800 dark:text-green-200 text-sm whitespace-pre-line">
                    {patient.doctorResponse.prescription}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}