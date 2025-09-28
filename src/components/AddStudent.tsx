import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Save, Upload, User, CheckCircle, XCircle } from 'lucide-react';
import { Student } from '../types/Student';
import Layout from './Layout';
import { useNavigate } from 'react-router-dom';



const API_URL = 'https://api.primeskillviim.in';

const AddStudent = () => {
  const [formData, setFormData] = useState<Omit<Student, 'studentId'>>({
    fullName: '',
    course: '',
    admissionYear: new Date().getFullYear(),
    passYear: new Date().getFullYear() + 4,
    age: 18,
    address: '',
    rollno: '',
    passportSizePhoto: '',
    certificate: ''
  });

  const [studentId, setStudentId] = useState(''); // Add studentId as separate state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const navigate = useNavigate();
  
  const handleBackToDashboard = () => {
    navigate(-1); // Go back to previous page
  };

  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [studentIdStatus, setStudentIdStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [studentIdMessage, setStudentIdMessage] = useState('');
  
  const checkTimeoutRef = useRef<NodeJS.Timeout>();

  // Check student ID availability
  const checkStudentId = async (id: string) => {
    if (!id.trim()) {
      setStudentIdStatus('idle');
      setStudentIdMessage('');
      return;
    }

    setStudentIdStatus('checking');
    setStudentIdMessage('Checking availability...');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/students/check/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.status === 'already present') {
          setStudentIdStatus('taken');
          setStudentIdMessage('This Student ID is already taken. Please choose a different one.');
        } else if (result.status === 'not present') {
          setStudentIdStatus('available');
          setStudentIdMessage('This Student ID is available.');
        }
      } else {
        setStudentIdStatus('idle');
        setStudentIdMessage('Error checking Student ID. Please try again.');
      }
    } catch (error) {
      console.error('Error checking student ID:', error);
      setStudentIdStatus('idle');
      setStudentIdMessage('Error checking Student ID. Please try again.');
    }
  };

  // Handle student ID input with debounce
  const handleStudentIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setStudentId(value);
    
    // Clear previous timeout
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }

    // Clear status if input is empty
    if (!value.trim()) {
      setStudentIdStatus('idle');
      setStudentIdMessage('');
      return;
    }

    // Set new timeout for checking
    checkTimeoutRef.current = setTimeout(() => {
      checkStudentId(value);
    }, 500); // Wait 500ms after user stops typing
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!studentId.trim()) newErrors.studentId = 'Student ID is required';
    if (!formData.course.trim()) newErrors.course = 'Course is required';
    if (!formData.rollno.trim()) newErrors.rollno = 'Roll number is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (formData.age < 16 || formData.age > 100) newErrors.age = 'Age must be between 16 and 100';
    if (formData.admissionYear < 2000 || formData.admissionYear > new Date().getFullYear()) {
      newErrors.admissionYear = 'Invalid admission year';
    }
    if (formData.passYear <= formData.admissionYear) {
      newErrors.passYear = 'Pass year must be after admission year';
    }

    // Check if student ID is taken
    if (studentIdStatus === 'taken') {
      newErrors.studentId = 'Student ID is already taken';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!photoFile) {
      alert('Please upload a passport size photo');
      return;
    }

    // Block submission if student ID is taken or still checking
    if (studentIdStatus === 'taken' || studentIdStatus === 'checking') {
      alert('Please wait for Student ID validation to complete');
      return;
    }

    setIsLoading(true);

    try {
      // Create FormData object for file upload
      const submitData = new FormData();
      submitData.append('fullName', formData.fullName);
      submitData.append('studentId', studentId); // Use user-input studentId
      submitData.append('course', formData.course);
      submitData.append('admissionYear', formData.admissionYear.toString());
      submitData.append('passYear', formData.passYear.toString());
      submitData.append('age', formData.age.toString());
      submitData.append('address', formData.address);
      submitData.append('rollNo', formData.rollno);
      submitData.append('photo', photoFile);
      
      if (certificateFile) {
        submitData.append('certificate', certificateFile);
      } else {
        // Add empty file if no certificate is provided
        submitData.append('certificate', new Blob(), 'empty.txt');
      }
      const token = localStorage.getItem('token'); // JWT from login

      const response = await fetch(`${API_URL}/students/add`, {
        method: 'POST',
        body: submitData,
        headers: {
        Authorization: `Bearer ${token}`, // attach JWT here
      },

      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result = await response.text();
      console.log('Server response:', result);
      
       navigate('/'); // Redirect to dashboard after save
      
    } catch (error) {
      console.error('Error saving student:', error);
      alert('Error saving student. Please try again. Check console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (type: 'photo' | 'certificate', file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (type === 'photo') {
        setFormData(prev => ({ ...prev, passportSizePhoto: result }));
        setPhotoFile(file);
      } else {
        setFormData(prev => ({ ...prev, certificate: result }));
        setCertificateFile(file);
      }
    };
    reader.readAsDataURL(file);
  };

  // Determine if submit should be disabled
  const isSubmitDisabled = isLoading || studentIdStatus === 'taken' || studentIdStatus === 'checking';

  return (
    <Layout title="Add New Student">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBackToDashboard}
              className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors duration-200"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Dashboard</span>
            </button>
            
            <h1 className="text-2xl font-bold text-gray-900">Add New Student</h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Student ID *
                </label>
                <input
                  type="text"
                  value={studentId}
                  onChange={handleStudentIdChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 ${
                    errors.studentId || studentIdStatus === 'taken' 
                      ? 'border-red-500' 
                      : studentIdStatus === 'available'
                      ? 'border-green-500'
                      : 'border-gray-300'
                  }`}
                  placeholder="Enter student ID"
                />
                
                {/* Status message */}
                {studentIdMessage && (
                  <div className={`flex items-center space-x-2 mt-1 text-sm ${
                    studentIdStatus === 'available' 
                      ? 'text-green-600' 
                      : studentIdStatus === 'taken' 
                      ? 'text-red-600'
                      : studentIdStatus === 'checking'
                      ? 'text-blue-600'
                      : 'text-gray-600'
                  }`}>
                    {studentIdStatus === 'available' && <CheckCircle className="h-4 w-4" />}
                    {studentIdStatus === 'taken' && <XCircle className="h-4 w-4" />}
                    {studentIdStatus === 'checking' && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    )}
                    <span>{studentIdMessage}</span>
                  </div>
                )}
                
                {errors.studentId && <p className="text-red-500 text-sm mt-1">{errors.studentId}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 ${
                    errors.fullName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter full name"
                />
                {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Age *
                </label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData(prev => ({ ...prev, age: parseInt(e.target.value) || 0 }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 ${
                    errors.age ? 'border-red-500' : 'border-gray-300'
                  }`}
                  min="16"
                  max="100"
                />
                {errors.age && <p className="text-red-500 text-sm mt-1">{errors.age}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Roll Number *
                </label>
                <input
                  type="text"
                  value={formData.rollno}
                  onChange={(e) => setFormData(prev => ({ ...prev, rollno: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 ${
                    errors.rollno ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter roll number"
                />
                {errors.rollno && <p className="text-red-500 text-sm mt-1">{errors.rollno}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address *
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 ${
                    errors.address ? 'border-red-500' : 'border-gray-300'
                  }`}
                  rows={3}
                  placeholder="Enter full address"
                />
                {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
              </div>
            </div>
          </div>

          {/* Academic Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Academic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course *
                </label>
                <input
                  type="text"
                  value={formData.course}
                  onChange={(e) => setFormData(prev => ({ ...prev, course: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 ${
                    errors.course ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter course name"
                />
                {errors.course && <p className="text-red-500 text-sm mt-1">{errors.course}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admission Year *
                </label>
                <input
                  type="number"
                  value={formData.admissionYear}
                  onChange={(e) => setFormData(prev => ({ ...prev, admissionYear: parseInt(e.target.value) || 0 }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 ${
                    errors.admissionYear ? 'border-red-500' : 'border-gray-300'
                  }`}
                  min="2000"
                  max={new Date().getFullYear()}
                />
                {errors.admissionYear && <p className="text-red-500 text-sm mt-1">{errors.admissionYear}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expected Pass Year *
                </label>
                <input
                  type="number"
                  value={formData.passYear}
                  onChange={(e) => setFormData(prev => ({ ...prev, passYear: parseInt(e.target.value) || 0 }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 ${
                    errors.passYear ? 'border-red-500' : 'border-gray-300'
                  }`}
                  min={formData.admissionYear + 1}
                />
                {errors.passYear && <p className="text-red-500 text-sm mt-1">{errors.passYear}</p>}
              </div>
            </div>
          </div>

          {/* Photo Upload */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Student Photo *</h2>
            
            <div className="flex items-center space-x-6">
              <div className="flex-shrink-0">
                <img
                  className="h-24 w-24 rounded-full object-cover border-4 border-gray-200"
                  src={formData.passportSizePhoto || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?w=150&h=150&fit=crop'}
                  alt="Student"
                />
              </div>
              
              <div>
                <label className="cursor-pointer inline-flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200">
                  <Upload className="h-4 w-4" />
                  <span>Upload Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload('photo', file);
                    }}
                  />
                </label>
                <p className="text-sm text-gray-500 mt-2">
                  Upload a passport-size photo (JPG, PNG) - Required
                </p>
                {!photoFile && <p className="text-red-500 text-sm mt-1">Photo is required</p>}
              </div>
            </div>
          </div>

          {/* Certificate Upload */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Certificate</h2>
            
            <div className="flex items-center space-x-6">
              <div className="flex-shrink-0">
                <div className="h-24 w-24 bg-gray-100 rounded-lg flex items-center justify-center">
                  <User className="h-8 w-8 text-gray-400" />
                </div>
              </div>
              
              <div>
                <label className="cursor-pointer inline-flex items-center space-x-2 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition-colors duration-200">
                  <Upload className="h-4 w-4" />
                  <span>Upload Certificate</span>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload('certificate', file);
                    }}
                  />
                </label>
                <p className="text-sm text-gray-500 mt-2">
                  Upload certificate (PDF, JPG, PNG)
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={handleBackToDashboard}
                className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors duration-200"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitDisabled}
                className="flex items-center space-x-2 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4" />
                <span>
                  {isLoading 
                    ? 'Saving...' 
                    : studentIdStatus === 'taken' 
                    ? 'Student ID Taken'
                    : studentIdStatus === 'checking'
                    ? 'Checking ID...'
                    : 'Save Student'
                  }
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default AddStudent;