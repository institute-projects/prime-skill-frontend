import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Search, Eye, Check, X, Clock, Users } from 'lucide-react';
import Layout from './Layout';
import { useNavigate } from 'react-router-dom';

interface Enroll {
  enroolId: number;
  enroolDate: string;
  phone: string;
  course: string;
  name: string;
  email: string;
}



const API_URL = import.meta.env.VITE_API_URL;

const OnlineAdmissions = () => {
  const [admissions, setAdmissions] = useState<Enroll[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  const handleBackToDashboard = () => {
    navigate(-1);
  };


  // ✅ Fetch data from backend
  useEffect(() => {
    const fetchAdmissions = async () => {
      try {
        const token = localStorage.getItem('token'); // if secured with JWT
        const res = await fetch(`${API_URL}/enrool/getAll`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!res.ok) throw new Error('Failed to fetch admissions');
        const data = await res.json();
        setAdmissions(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdmissions();
  }, []);

  // ✅ Filter admissions
  const filteredAdmissions = useMemo(() => {
    if (!searchTerm) return admissions;

    return admissions.filter((student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.phone.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [admissions, searchTerm]);

  if (loading) {
    return (
      <Layout title="Online Admissions">
        <div className="flex items-center justify-center min-h-[300px] text-gray-600">
          Loading admissions...
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Online Admissions">
      <div className="max-w-7xl mx-auto">
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

            <div className="flex items-center space-x-3">
              <Clock className="h-6 w-6 text-yellow-500" />
              <h1 className="text-2xl font-bold text-gray-900">Online Admissions</h1>
            </div>
          </div>
        </div>

      

        {/* Search */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, course, email or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>

          <div className="text-sm text-gray-600">
            Showing {filteredAdmissions.length} of {admissions.length} applications
          </div>
        </div>

        {/* Applications List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {filteredAdmissions.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No admission applications found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicant</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredAdmissions.map((student) => (
                    <tr key={student.enroolId} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-4 py-4 text-sm font-medium text-gray-900">{student.name}</td>
                      <td className="px-4 py-4 text-sm text-gray-900">{student.course}</td>
                      <td className="px-4 py-4 text-sm text-gray-900">{student.phone}</td>
                      <td className="px-4 py-4 text-sm text-gray-900">{student.email}</td>
                      <td className="px-4 py-4 text-sm text-gray-900">{student.enroolDate}</td>
                      
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default OnlineAdmissions;
