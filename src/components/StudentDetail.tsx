import React, { useEffect, useState } from 'react';
import { ArrowLeft, Edit2, Save, X, Upload, Download, User, Award } from 'lucide-react';
import Layout from './Layout';
import { Student } from '../types/Student';
import { useNavigate, useParams } from 'react-router-dom';



const StudentDetailPage =() => {
  const { studentId, fullName, passYear } = useParams<{ 
    studentId: string; 
    fullName: string; 
    passYear: string;
  }>();

  const [studentData, setStudentData] = useState<Student | null>(null);
  const [editedStudent, setEditedStudent] = useState<Student | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'photo' | 'certificate'>('details');
  const [studentPhoto, setStudentPhoto] = useState<string | null>(null);
  const navigate = useNavigate();


  const API_URL = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem('token');
  const decodedFullName = fullName ? decodeURIComponent(fullName) : '';
  const parsedPassYear = passYear ? parseInt(passYear) : 0;


  // Fetch student details based on ID, FullName, PassYear
  useEffect(() => {
    const fetchStudent = async () => {
      if (!studentId || !decodedFullName || !parsedPassYear) {
        alert('Invalid student parameters');
        navigate('/');
        return;
      }

      try {
        const res = await fetch(
          `${API_URL}/students/${studentId}/${decodedFullName}/${parsedPassYear}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) throw new Error('Failed to fetch student');
        const data: Student = await res.json();
        setStudentData(data);
        setEditedStudent(data);
        
        // Fetch student photo
        fetchStudentPhoto(data.studentId);
      } catch (err: any) {
        alert(err.message);
        navigate('/');

      }
    };
    fetchStudent();
  }, [studentId, decodedFullName, parsedPassYear]);
  
   const handleBackToDashboard = () => {
    navigate(-1); // Go back to previous page
    // Or use navigate('/') to always go to dashboard
  };

  // Fetch student photo
  const fetchStudentPhoto = async (studentId: string) => {
    try {
      const res = await fetch(`${API_URL}/students/photo/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const blob = await res.blob();
        const photoUrl = URL.createObjectURL(blob);
        setStudentPhoto(photoUrl);
      } else {
        // Use default photo if no photo found
        setStudentPhoto('https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?w=300&h=300&fit=crop');
      }
    } catch (err) {
      console.error('Error fetching student photo:', err);
      setStudentPhoto('https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?w=300&h=300&fit=crop');
    }
  };

  // Clean up photo URL on component unmount
  useEffect(() => {
    return () => {
      if (studentPhoto && studentPhoto.startsWith('blob:')) {
        URL.revokeObjectURL(studentPhoto);
      }
    };
  }, [studentPhoto]);

  if (!studentData || !editedStudent)
    return (
      <Layout title="Student Detail">
        <p>Loading...</p>
      </Layout>
    );

  const handleUpdate = async () => {
    if (!editedStudent) return;
    try {
      const submitData = new FormData();
      submitData.append('studentId', editedStudent.studentId);
      submitData.append('fullName', editedStudent.fullName);
      submitData.append('course', editedStudent.course);
      submitData.append('admissionYear', editedStudent.admissionYear.toString());
      submitData.append('passYear', editedStudent.passYear.toString());
      submitData.append('age', editedStudent.age.toString());
      submitData.append('address', editedStudent.address);
      submitData.append('rollNo', editedStudent.rollno);

      const res = await fetch(`${API_URL}/students/update`, {
        method: 'PUT',
        body: submitData,
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Check if response is successful without parsing JSON
      if (res.ok) {
        alert('Student updated successfully');
        setStudentData(editedStudent);
        setIsEditing(false);
      } else {
        throw new Error('Failed to update student');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handlePhotoUpdate = async (file: File) => {
    if (!studentData) return;
    const formData = new FormData();
    formData.append('photo', file);
    
    try {
      const res = await fetch(`${API_URL}/students/updatePhoto/${studentData.studentId}`, {
        method: 'PUT',
        body: formData,
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        // Refresh the photo
        fetchStudentPhoto(studentData.studentId);
        alert('Photo updated successfully');
      } else {
        throw new Error('Failed to update photo');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCertificateUpdate = async (file: File) => {
    if (!studentData) return;
    const formData = new FormData();
    formData.append('certificate', file);
    
    try {
      const res = await fetch(`${API_URL}/students/updateCertificate/${studentData.studentId}`, {
        method: 'PUT',
        body: formData,
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        alert('Certificate updated successfully');
      } else {
        throw new Error('Failed to update certificate');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const downloadCertificate = async () => {
    if (!studentData) return;
    try {
      const res = await fetch(`${API_URL}/students/download-certificate/${studentData.studentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) throw new Error('Certificate download failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${studentData.fullName}_Certificate.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <Layout title={`Student Details - ${studentData.fullName}`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6 flex justify-between items-center">
          <button onClick={handleBackToDashboard} className="flex items-center space-x-2 text-gray-600 hover:text-red-600">
            <ArrowLeft className="h-5 w-5" />
            <span>Back</span>
          </button>

          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
            >
              <Edit2 className="h-4 w-4" />
              <span>Edit</span>
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setEditedStudent(studentData);
                  setIsEditing(false);
                }}
                className="flex items-center space-x-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
              >
                <X className="h-4 w-4" /> Cancel
              </button>
              <button
                onClick={handleUpdate}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
              >
                <Save className="h-4 w-4" /> Save
              </button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {['details', 'photo', 'certificate'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab === 'details' && <User className="h-4 w-4" />}
                  {tab === 'photo' && <User className="h-4 w-4" />}
                  {tab === 'certificate' && <Award className="h-4 w-4" />}
                  <span>{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            
            {activeTab === 'details' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Enroolment No.</label>
                  <input
                    type="text"
                    value={editedStudent.studentId}
                    disabled={!isEditing}
                    onChange={(e) =>
                      setEditedStudent((prev) => (prev ? { ...prev, studentId: e.target.value } : prev))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50 disabled:text-gray-500 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={editedStudent.fullName}
                    disabled={!isEditing}
                    onChange={(e) =>
                      setEditedStudent((prev) => (prev ? { ...prev, fullName: e.target.value } : prev))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50 disabled:text-gray-500 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Course</label>
                  <input
                    type="text"
                    value={editedStudent.course}
                    disabled={!isEditing}
                    onChange={(e) =>
                      setEditedStudent((prev) => (prev ? { ...prev, course: e.target.value } : prev))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50 disabled:text-gray-500 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                  <input
                    type="number"
                    value={editedStudent.age}
                    disabled={!isEditing}
                    onChange={(e) =>
                      setEditedStudent((prev) => (prev ? { ...prev, age: parseInt(e.target.value) } : prev))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50 disabled:text-gray-500 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Admission Year</label>
                  <input
                    type="number"
                    value={editedStudent.admissionYear}
                    disabled={!isEditing}
                    onChange={(e) =>
                      setEditedStudent((prev) => (prev ? { ...prev, admissionYear: parseInt(e.target.value) } : prev))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50 disabled:text-gray-500 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pass Year</label>
                  <input
                    type="number"
                    value={editedStudent.passYear}
                    disabled={!isEditing}
                    onChange={(e) =>
                      setEditedStudent((prev) => (prev ? { ...prev, passYear: parseInt(e.target.value) } : prev))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50 disabled:text-gray-500 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Roll Number</label>
                  <input
                    type="text"
                    value={editedStudent.rollno}
                    disabled={!isEditing}
                    onChange={(e) =>
                      setEditedStudent((prev) => (prev ? { ...prev, rollno: e.target.value } : prev))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50 disabled:text-gray-500 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <textarea
                    value={editedStudent.address}
                    disabled={!isEditing}
                    onChange={(e) =>
                      setEditedStudent((prev) => (prev ? { ...prev, address: e.target.value } : prev))
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50 disabled:text-gray-500 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {activeTab === 'photo' && (
              <div className="text-center">
                <img
                  className="h-48 w-48 rounded-full object-cover mx-auto border-4 border-gray-200 shadow-lg mb-4"
                  src={studentPhoto || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?w=300&h=300&fit=crop'}
                  alt="Student"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?w=300&h=300&fit=crop';
                  }}
                />
                <label className="cursor-pointer inline-flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg">
                  <Upload className="h-4 w-4" /> Upload New Photo
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handlePhotoUpdate(file);
                    }}
                  />
                </label>
                <p className="text-sm text-gray-500 mt-2">Admin can update photo without entering edit mode</p>
              </div>
            )}

            {activeTab === 'certificate' && (
              <div className="text-center">
                <div className="bg-gray-100 rounded-lg p-8 mb-4">
                  <Award className="h-24 w-24 text-yellow-500 mx-auto mb-2" />
                  <p className="text-gray-700">Certificate Available</p>
                </div>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={downloadCertificate}
                    className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                  >
                    <Download className="h-4 w-4" /> Download Certificate
                  </button>
                  <label className="cursor-pointer inline-flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg">
                    <Upload className="h-4 w-4" /> Upload New Certificate
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleCertificateUpdate(file);
                      }}
                    />
                  </label>
                </div>
                <p className="text-sm text-gray-500 mt-2">Admin can update certificate without entering edit mode</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default StudentDetailPage;