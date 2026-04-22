"use client"

import { Clock, AlertCircle, CheckCircle, Video } from "lucide-react"

export default function PatientCard({ patient, isSelected, onClick }) {
  const getStatusIcon = (status) => {
    switch (status) {
      case "awaiting_doctor":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "video_scheduled":
        return <Video className="h-4 w-4 text-blue-500" />
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case "awaiting_doctor":
        return "Awaiting Doctor"
      case "video_scheduled":
        return "Video Scheduled"
      case "completed":
        return "Completed"
      default:
        return "Unknown"
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
      case "Medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
      case "Low":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  const isVideoConsultationNeeded =
    patient.doctorResponse?.action === "request_video" ||
    patient.status === "video_scheduled" ||
    patient.doctorResponse?.videoScheduled

  return (
    <div
      onClick={onClick}
      className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
        isSelected
          ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-400 shadow-md"
          : "border-gray-200 bg-white hover:border-gray-300"
      }`}
      role="button"
      tabIndex={0}
      aria-label={`Select patient ${patient.name}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onClick()
        }
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-medium text-foreground text-sm">{patient.name}</h3>
          <p className="text-xs text-muted-foreground">
            {patient.id} • {patient.age}Y • {patient.gender}
          </p>
        </div>
        <div className="flex items-center space-x-1">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(patient.priority)}`}>
            {patient.priority}
          </span>
          {isVideoConsultationNeeded && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 flex items-center space-x-1">
              <Video className="h-3 w-3" />
              <span>Video Required</span>
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1">
          {getStatusIcon(patient.status)}
          <span className="text-xs text-muted-foreground">{getStatusText(patient.status)}</span>
        </div>
        <div className="text-xs text-muted-foreground">{new Date(patient.createdAt).toLocaleDateString()}</div>
      </div>

      {patient.assignedDoctor && (
        <div className="mt-2 pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground">
          Dr. {(patient.assignedDoctor?.name || "").split(" ").slice(1).join(" ") || "Assigned"} • {patient.assignedDoctor?.specialty || "Specialist"}
          </p>
        </div>
      )}
    </div>
  )
}
