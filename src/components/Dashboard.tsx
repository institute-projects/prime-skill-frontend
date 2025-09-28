import React, { useState, useMemo, useEffect } from "react";
import { Search, Eye, Trash2, Users, Plus, UserCheck } from "lucide-react";
import { Student } from "../types/Student";
import ConfirmDialog from "./ConfirmDialog";
import Layout from "./Layout";
import { useNavigate } from "react-router-dom";



const API_URL = import.meta.env.VITE_API_URL;

const Dashboard = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    student: Student | null;
  }>({ isOpen: false, student: null });

  const token = localStorage.getItem("token");
    const navigate = useNavigate();


  // Fetch students from API
  const fetchStudents = async () => {
    try {
      const res = await fetch(`${API_URL}/students/getAll`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch students");

      const data = await res.json();
      setStudents(data);
    } catch (err) {
      console.error("Error fetching students:", err);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Handle delete student
  const handleDeleteConfirm = async () => {
    if (deleteDialog.student) {
      try {
        const res = await fetch(
          `${API_URL}/students/${deleteDialog.student.studentId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) throw new Error("Failed to delete student");

        // Refresh list after delete
        setStudents((prev) =>
          prev.filter((s) => s.studentId !== deleteDialog.student!.studentId)
        );
      } catch (err) {
        console.error("Error deleting student:", err);
      } finally {
        setDeleteDialog({ isOpen: false, student: null });
      }
    }
  };

  // Search filtering (no separate API, just filter list)
  const filteredStudents = useMemo(() => {
    if (!searchTerm) return students;

    return students.filter(
      (student) =>
        student.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.rollno?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.studentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.course?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [students, searchTerm]);

  const handleViewStudent = (student: Student) => {
    // Encode the fullName for URL safety
    const encodedFullName = encodeURIComponent(student.fullName);
    navigate(`/student/${student.studentId}/${encodedFullName}/${student.passYear}`);
  };

  const handleNavigateToAddStudent = () => {
    navigate('/add-student');
  };

  const handleNavigateToOnlineAdmissions = () => {
    navigate('/online-admissions');
  };


  return (
    <Layout>
      <div className="space-y-6">
        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={handleNavigateToAddStudent}
            className="bg-red-600 hover:bg-red-700 text-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 transform hover:scale-[1.02]"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <Plus className="h-5 w-5 text-white" />
              </div>
              <div className="text-left">
                <p className="text-lg font-semibold">Add Student</p>
                <p className="text-sm text-red-100">Manually add new student</p>
              </div>
            </div>
          </button>

          <button
            onClick={handleNavigateToOnlineAdmissions}
            className="bg-yellow-500 hover:bg-yellow-600 text-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 transform hover:scale-[1.02]"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <UserCheck className="h-5 w-5 text-white" />
              </div>
              <div className="text-left">
                <p className="text-lg font-semibold">Online Admissions</p>
                <p className="text-sm text-yellow-100">Review admission forms</p>
              </div>
            </div>
          </button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, course, roll no, or enrollment number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>

          <div className="text-sm text-gray-600 mb-4">
            Showing {filteredStudents.length} of {students.length} students
          </div>
        </div>

        {/* Students List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {filteredStudents.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No students found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                      Course
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                      Roll No
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                      Year
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredStudents.map((student, idx) => (
                    <tr
                      key={student.studentId}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-3">
                          <span className="text-gray-500 text-sm font-bold">
                            {idx + 1}.
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {student.fullName}
                            </p>
                            <p className="text-xs text-gray-500">
                              Enrollment No: {student.studentId}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 hidden sm:table-cell">
                        {student.course}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 hidden md:table-cell">
                        {student.rollno}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 hidden lg:table-cell">
                        {student.admissionYear} - {student.passYear}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewStudent(student)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() =>
                              setDeleteDialog({ isOpen: true, student })
                            }
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                            title="Delete Student"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, student: null })}
        onConfirm={handleDeleteConfirm}
        title="Delete Student"
        message={`Are you sure you want to delete ${deleteDialog.student?.fullName}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </Layout>
  );
};

export default Dashboard;
