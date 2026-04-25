"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  User,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Award,
  Users,
  CheckCircle,
  Clock,
  LogOut,
  Settings,
  Edit,
} from "lucide-react"

export default function FacilitatorProfile({ onLogout }) {
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [facilitatorData, setFacilitatorData] = useState(null)

  useEffect(() => {
    const fetchProfileData = async () => {
      // Get the logged-in user's ID from local storage
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      
      if (!storedUser._id) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`http://localhost:5000/api/profile/${storedUser._id}`);
        const data = await response.json();

        if (data.success) {
          // Map backend schema fields to frontend expectations
          setFacilitatorData({
            name: data.user.fullName || "Facilitator",
            id: `F-${data.user._id.substring(0, 4).toUpperCase()}`,
            email: data.user.email || "Not provided",
            phone: data.user.phoneNumber || "Not provided",
            village: data.user.villageArea || "Unknown",
            district: data.user.district || "Unknown",
            state: data.user.state || "Unknown",
            joinDate: data.user.createdAt || new Date(),
            experience: data.user.healthcareExperience || "Not specified",
            languages: data.user.languagesSpoken || "Not specified",
            education: data.user.educationBackground || "Not specified",
            avatar: "/placeholder.svg?height=100&width=100", // Fallback avatar
            stats: data.stats,
            certifications: ["Basic Healthcare Training", "MediSense Platform Certification"], // Static for now
          });
        }
      } catch (error) {
        console.error("Failed to fetch profile data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6 flex justify-center items-center h-64 text-gray-500">
        Loading profile data...
      </div>
    );
  }

  if (!facilitatorData) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center text-red-500">
        Failed to load profile. Please try refreshing the page.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Facilitator Profile</h2>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
            <Edit className="h-4 w-4 mr-2" />
            {isEditing ? "Cancel" : "Edit Profile"}
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button variant="destructive" onClick={onLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Profile Info */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start space-x-6">
                <img
                  src={facilitatorData.avatar}
                  alt={facilitatorData.name}
                  className="w-24 h-24 rounded-full border-4 border-blue-100"
                />
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{facilitatorData.name}</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-2">Facilitator ID: {facilitatorData.id}</p>

                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                      <Mail className="h-4 w-4" />
                      <span>{facilitatorData.email}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                      <Phone className="h-4 w-4" />
                      <span>{facilitatorData.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {facilitatorData.village}, {facilitatorData.district}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="h-4 w-4" />
                      <span>Joined {new Date(facilitatorData.joinDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Professional Details */}
          <Card>
            <CardHeader>
              <CardTitle>Professional Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-200 mb-1">Education</h4>
                <p className="text-gray-600 dark:text-gray-400">{facilitatorData.education}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-200 mb-1">Experience</h4>
                <p className="text-gray-600 dark:text-gray-400">{facilitatorData.experience}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-200 mb-1">Languages</h4>
                <p className="text-gray-600 dark:text-gray-400">{facilitatorData.languages}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-200 mb-2">Certifications</h4>
                <div className="flex flex-wrap gap-2">
                  {facilitatorData.certifications.map((cert, index) => (
                    <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800">
                      <Award className="h-3 w-3 mr-1" />
                      {cert}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats & Performance */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Patients</span>
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">{facilitatorData.stats.totalPatients}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Completed Cases</span>
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">{facilitatorData.stats.completedCases}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-yellow-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Active Cases</span>
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">{facilitatorData.stats.activeCases}</span>
              </div>

              <div className="pt-4 border-t">
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Avg Response Time</p>
                  <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">{facilitatorData.stats.avgResponseTime}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <User className="h-4 w-4 mr-2" />
                Update Profile Picture
              </Button>
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <Settings className="h-4 w-4 mr-2" />
                Notification Settings
              </Button>
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <Award className="h-4 w-4 mr-2" />
                View Certificates
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}