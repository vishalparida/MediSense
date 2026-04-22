"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import PatientQueue from "@/components/PatientQueue"
import PatientDetail from "@/components/PatientDetail"
import DoctorResponsePanel from "@/components/DoctorResponsePanel"
import NewPatientForm from "@/components/NewPatientForm"
import PatientHistory from "@/components/PatientHistory"
import FacilitatorProfile from "@/components/FacilitatorProfile"
import ActiveCasesOverview from "@/components/ActiveCasesOverview"
import NotificationSystem from "@/components/NotificationSystem"
import { ThemeToggle } from "@/components/theme-toggle"
import { Heart, Users, FileText, History, User, ChevronDown, LogOut, Settings } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/context/AuthContext"

export default function FacilitatorDashboard() {
  const { logout } = useAuth();
  const router = useRouter()
  const [patients, setPatients] = useState([])
  const [doctors, setDoctors] = useState([])
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [activeTab, setActiveTab] = useState("dashboard")
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [facilitatorInfo, setFacilitatorInfo] = useState({})
  const [isLoading, setIsLoading] = useState(true)

  // 1. Auth & Facilitator Profile Load
  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token || !storedUser) {
      router.push("/auth/facilitator/login");
      return;
    }

    try {
      const user = JSON.parse(storedUser);
      setFacilitatorInfo({
        name: user.fullName || "Facilitator",
        location: user.villageArea ? `${user.villageArea}, ${user.district}` : "Rural Region",
        id: user._id ? `F-${user._id.substring(0, 4).toUpperCase()}` : "F001",
        rawId: user._id // Keep original ID for fetching
      });
    } catch (error) {
      console.error("Failed to parse user data from localStorage");
    }
  }, [router]);

  // 2. Fetch Real Patients and Doctors from MongoDB
  useEffect(() => {
    const fetchDatabaseData = async () => {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (!user._id) return;

      try {
        // Fetch BOTH patients and doctors simultaneously
        const [patientsResponse, doctorsResponse] = await Promise.all([
          fetch(`http://localhost:5000/api/patients?facilitatorId=${user._id}`),
          fetch(`http://localhost:5000/api/doctors`)
        ]);

        const patientsData = await patientsResponse.json();
        const doctorsData = await doctorsResponse.json();

        // Map and set the Doctors
        if (doctorsData.success) {
          const formattedDoctors = doctorsData.doctors.map(doc => ({
            id: doc._id,
            name: doc.fullName || "Doctor",
            specialty: doc.specialization || "General Medicine",
            experience: doc.yearsOfExperience ? `${doc.yearsOfExperience} years` : "",
            location: doc.currentHospitalClinic || doc.city || "",
            avatar: "/doctor-avatar.png"
          }));
          setDoctors(formattedDoctors);
          console.log("Fetched Doctors:", formattedDoctors);
        }

        // Map and set the Patients
        if (patientsData.success) {
          const formattedPatients = patientsData.patients.map(p => ({
            ...p,
            id: p._id, // Map MongoDB _id to id
            // Map populated doctor details
            assignedDoctor: p.assignedDoctor ? {
              id: p.assignedDoctor._id,
              name: p.assignedDoctor.fullName || "Doctor",
              specialty: p.assignedDoctor.specialization || "Specialist",
              avatar: "/doctor-avatar.png"
            } : null
          }));

          setPatients(formattedPatients);
          if (formattedPatients.length > 0) {
            setSelectedPatient(formattedPatients[0]);
          }
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDatabaseData();
  }, []);

  // 3. Mock Interval for Doctor Responses (Keep this for UI testing)
  useEffect(() => {
    const interval = setInterval(() => {
      setPatients((prev) => {
        const awaitingPatients = prev.filter((p) => p.status === "awaiting_doctor")
        if (awaitingPatients.length > 0 && Math.random() > 0.95) {
          const randomPatient = awaitingPatients[Math.floor(Math.random() * awaitingPatients.length)]
          const newStatus = Math.random() > 0.5 ? "video_scheduled" : "completed"

          return prev.map((p) =>
            p.id === randomPatient.id
              ? {
                  ...p,
                  status: newStatus,
                  doctorResponse: {
                    ...p.doctorResponse,
                    timestamp: new Date().toISOString(),
                    action: newStatus === "video_scheduled" ? "request_video" : "prescription_given",
                    ...(newStatus === "video_scheduled" && {
                      videoScheduled: {
                        date: new Date().toISOString().split("T")[0],
                        time: "14:00",
                        joinUrl: `https://meet.medisense.com/room/${p.id}-consultation`,
                      },
                    }),
                  },
                }
              : p,
          )
        }
        return prev
      })
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient)
  }

  const handleStatusUpdate = (patientId, newStatus) => {
    setPatients((prev) => prev.map((p) => (p.id === patientId ? { ...p, status: newStatus } : p)))
    if (selectedPatient?.id === patientId) {
      setSelectedPatient((prev) => ({ ...prev, status: newStatus }))
    }
  }

  const handlePatientAdd = (newPatient) => {
    setPatients((prev) => [newPatient, ...prev])
    setSelectedPatient(newPatient)
    setActiveTab("dashboard")
  }

  const handlePatientUpdate = (updatedPatient) => {
    setPatients((prev) => prev.map((p) => (p.id === updatedPatient.id ? updatedPatient : p)))
    setSelectedPatient(updatedPatient)
  }

  const handleLogout = () => {
    logout();
    router.push("/");
  }

  const activeCases = patients.filter((p) => p.status !== "completed")

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">Loading Dashboard...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href="/" className="flex items-center space-x-2">
                <Heart className="h-8 w-8 text-blue-600" />
                <span className="font-bold text-xl text-blue-600">MediSense</span>
              </Link>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <span className="text-lg font-semibold text-gray-700 dark:text-gray-200">Facilitator Dashboard</span>
            </div>

            <div className="flex items-center space-x-4">
              <NotificationSystem patients={patients} />
              <ThemeToggle />

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">
                      {facilitatorInfo.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Facilitator • {facilitatorInfo.id}</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 z-50">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setActiveTab("profile")
                          setShowProfileMenu(false)
                        }}
                        className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <User className="h-4 w-4" />
                        <span>View Profile</span>
                      </button>
                      <button
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Settings className="h-4 w-4" />
                        <span>Settings</span>
                      </button>
                      <hr className="my-1 dark:border-gray-600" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                      >
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

      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
        <div className="px-6">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === "dashboard"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Active Cases</span>
                {activeCases.length > 0 && (
                  <span className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-xs px-2 py-1 rounded-full">
                    {activeCases.length}
                  </span>
                )}
              </div>
            </button>
            <button
              onClick={() => setActiveTab("overview")}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === "overview"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Overview</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("onboard")}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === "onboard"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>New Patient</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === "history"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              <div className="flex items-center space-x-2">
                <History className="h-4 w-4" />
                <span>History</span>
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      {activeTab === "dashboard" && (
        <div className="flex h-[calc(100vh-140px)]">
          {/* Left Panel - Patient Queue */}
          <div className="w-1/4 bg-white dark:bg-gray-800 border-r dark:border-gray-700 overflow-y-auto">
            <PatientQueue patients={patients} selectedPatient={selectedPatient} onPatientSelect={handlePatientSelect} />
          </div>

          {/* Center Panel - Patient Detail */}
          <div className="flex-1 overflow-y-auto">
            {selectedPatient ? (
              <PatientDetail
                patient={selectedPatient}
                onStatusUpdate={handleStatusUpdate}
                doctors={doctors}
                onPatientUpdate={handlePatientUpdate}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <Users className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-2">
                    Select a patient to view details
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Choose a patient from the queue to see their information and medical history
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Doctor Response */}
          <div className="w-1/4 bg-white dark:bg-gray-800 border-l dark:border-gray-700 overflow-y-auto">
            {selectedPatient && <DoctorResponsePanel patient={selectedPatient} />}
          </div>
        </div>
      )}

      {activeTab === "overview" && <ActiveCasesOverview patients={patients} />}

      {activeTab === "onboard" && <NewPatientForm doctors={doctors} onPatientAdd={handlePatientAdd} />}

      {activeTab === "history" && <PatientHistory patients={patients} />}

      {activeTab === "profile" && <FacilitatorProfile onLogout={handleLogout} />}

      {/* Click outside to close profile menu */}
      {showProfileMenu && <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />}
    </div>
  )
}