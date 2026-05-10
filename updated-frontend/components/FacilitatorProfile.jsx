"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  Save,
  X
} from "lucide-react"

// A concise mapping of States to major Districts
const stateDistrictMap = {
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Tirupati"],
  "Assam": ["Guwahati", "Silchar", "Dibrugarh", "Jorhat"],
  "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia"],
  "Delhi": ["New Delhi", "North Delhi", "South Delhi", "East Delhi", "West Delhi"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar"],
  "Karnataka": ["Bengaluru", "Mysuru", "Mangaluru", "Hubli", "Belagavi"],
  "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Kozhikode", "Thrissur"],
  "Madhya Pradesh": ["Indore", "Bhopal", "Jabalpur", "Gwalior", "Ujjain"],
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Thane", "Aurangabad"],
  "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Bikaner", "Ajmer"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Varanasi", "Agra", "Prayagraj", "Gorakhpur", "Meerut"],
  "West Bengal": ["Kolkata", "Howrah", "Darjeeling", "Siliguri", "Asansol"]
};

export default function FacilitatorProfile({ onLogout }) {
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [facilitatorData, setFacilitatorData] = useState(null)
  
  const [editedData, setEditedData] = useState({})

  useEffect(() => {
    const fetchProfileData = async () => {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      
      if (!storedUser._id) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`http://localhost:5000/api/profile/${storedUser._id}`);
        const data = await response.json();

        if (data.success) {
          const profileInfo = {
            name: data.user.fullName || "Facilitator",
            id: `F-${data.user._id.substring(0, 4).toUpperCase()}`,
            rawId: data.user._id,
            email: data.user.email || "Not provided",
            phone: data.user.phoneNumber || "",
            village: data.user.villageArea || "",
            district: data.user.district || "",
            state: data.user.state || "",
            joinDate: data.user.createdAt || new Date(),
            experience: data.user.healthcareExperience || "",
            languages: data.user.languagesSpoken || "",
            education: data.user.educationBackground || "",
            avatar: "/placeholder.svg?height=100&width=100",
            stats: data.stats,
            certifications: ["Basic Healthcare Training", "MediSense Platform Certification"],
          };
          setFacilitatorData(profileInfo);
          setEditedData(profileInfo); 
        }
      } catch (error) {
        console.error("Failed to fetch profile data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  const handleInputChange = (field, value) => {
    setEditedData(prev => ({ ...prev, [field]: value }));
  };

  const handleCancelEdit = () => {
    setEditedData(facilitatorData); 
    setIsEditing(false);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`http://localhost:5000/api/profile/${facilitatorData.rawId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editedData),
      });
      
      const data = await response.json();

      if (response.ok) {
        setFacilitatorData(editedData);
        setIsEditing(false);
        
        const storedUser = JSON.parse(localStorage.getItem("user"));
        storedUser.fullName = editedData.name;
        localStorage.setItem("user", JSON.stringify(storedUser));
      } else {
        alert("Failed to update profile: " + data.message);
      }
    } catch (error) {
      console.error("Profile save error:", error);
      alert("Server error while saving profile.");
    } finally {
      setIsSaving(false);
    }
  };

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
          {!isEditing ? (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleCancelEdit} disabled={isSaving}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSaveProfile} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </>
          )}
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
                <div className="flex-1 space-y-4">
                  <div>
                    {isEditing ? (
                      <Input 
                        value={editedData.name} 
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        className="text-lg font-semibold max-w-sm"
                      />
                    ) : (
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{facilitatorData.name}</h3>
                    )}
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Facilitator ID: {facilitatorData.id}</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                      <Mail className="h-4 w-4 shrink-0" />
                      <span className="truncate">{facilitatorData.email}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                      <Phone className="h-4 w-4 shrink-0" />
                      {isEditing ? (
                        <Input 
                          value={editedData.phone} 
                          onChange={(e) => handleInputChange("phone", e.target.value)}
                          className="h-8 text-sm"
                        />
                      ) : (
                        <span>{facilitatorData.phone || "Not set"}</span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 col-span-full">
                      <MapPin className="h-4 w-4 shrink-0" />
                      {isEditing ? (
                        <div className="grid grid-cols-3 gap-2 flex-1">
                          <Input 
                            placeholder="Village"
                            value={editedData.village} 
                            onChange={(e) => handleInputChange("village", e.target.value)}
                            className="h-8 text-sm"
                          />
                          
                          <Select 
                            value={editedData.state || ""} 
                            onValueChange={(val) => {
                              handleInputChange("state", val);
                              handleInputChange("district", ""); // Reset district when state changes
                            }}
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue placeholder="State" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.keys(stateDistrictMap).map(state => (
                                <SelectItem key={state} value={state}>{state}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Select 
                            value={editedData.district || ""} 
                            onValueChange={(val) => handleInputChange("district", val)}
                            disabled={!editedData.state}
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue placeholder="District" />
                            </SelectTrigger>
                            <SelectContent>
                              {editedData.state && stateDistrictMap[editedData.state]?.map(district => (
                                <SelectItem key={district} value={district}>{district}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <span>
                          {[facilitatorData.village, facilitatorData.district, facilitatorData.state].filter(Boolean).join(", ") || "Location not set"}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="h-4 w-4 shrink-0" />
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
                <Label className="text-gray-900 dark:text-gray-200">Education</Label>
                {isEditing ? (
                  <Input 
                    value={editedData.education} 
                    onChange={(e) => handleInputChange("education", e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <p className="text-gray-600 dark:text-gray-400 mt-1">{facilitatorData.education || "Not specified"}</p>
                )}
              </div>
              
              <div>
                <Label className="text-gray-900 dark:text-gray-200">Experience</Label>
                {isEditing ? (
                  <Input 
                    value={editedData.experience} 
                    onChange={(e) => handleInputChange("experience", e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <p className="text-gray-600 dark:text-gray-400 mt-1">{facilitatorData.experience || "Not specified"}</p>
                )}
              </div>
              
              <div>
                <Label className="text-gray-900 dark:text-gray-200">Languages</Label>
                {isEditing ? (
                  <Input 
                    value={editedData.languages} 
                    onChange={(e) => handleInputChange("languages", e.target.value)}
                    className="mt-1"
                    placeholder="e.g. English, Hindi"
                  />
                ) : (
                  <p className="text-gray-600 dark:text-gray-400 mt-1">{facilitatorData.languages || "Not specified"}</p>
                )}
              </div>
              
              <div>
                <Label className="text-gray-900 dark:text-gray-200 block mb-2">Certifications</Label>
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