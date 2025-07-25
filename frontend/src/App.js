import React, { useState, useEffect } from "react";
import axios from "axios";
import { FileText, Calendar, User, Clock, Plus, Search, Trash, Edit,Download } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function App() {
  const [date, setDate] = useState("");
  const [report, setReport] = useState("");
  const [notes, setNotes] = useState("");
  const [allReports, setAllReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editDate, setEditDate] = useState(null);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setDate(today);
    fetchReports();
  }, []);

  const fetchReports = async () => {
    const res = await axios.get(`${BACKEND_URL}/reports`);
    setAllReports(res.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!report || !date) return alert("Date and report are required");

    if (editMode) {
      await axios.put(`${BACKEND_URL}/update`, { date: editDate, report, notes });
    } else {
      await axios.post(`${BACKEND_URL}/add`, { date, report, notes });
    }

    resetForm();
    fetchReports();
  };

  const resetForm = () => {
    setDate(new Date().toISOString().split('T')[0]);
    setReport("");
    setNotes("");
    setEditMode(false);
    setEditDate(null);
  };

  const handleEdit = (r) => {
    setDate(r.date);
    setReport(r.report);
    setNotes(r.notes || "");
    setEditDate(r.date);
    setEditMode(true);
  };
const handleDelete = async (r) => {
  if (window.confirm(`Delete report for ${r.date}?`)) {
    try {
      await axios.delete(`${BACKEND_URL}/delete`, {
        data: { id: r._id },               // Make sure r._id exists
      });
      fetchReports();
    } catch (error) {
      alert("Failed to delete the report.");
    }
  }
};


  const filteredReports = allReports.filter(r =>
    r.report.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.date.includes(searchTerm)
  );

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <nav className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Daily Reports</h1>
                <p className="hidden md:block text-sm text-gray-500">Office Management System</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-gray-600">
                <Clock className="w-4 h-4" />
                <span className="hidden md:block text-sm font-medium">
                  {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <div className="flex items-center space-x-2 bg-gray-100 px-3 py-1.5 rounded-full">
                <User className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Employee</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Body */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white flex items-center">
                  <Plus className="w-5 h-5 mr-2" />
                  {editMode ? "Edit Report" : "New Report"}
                </h2>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full border-2 border-gray-200 p-3 rounded-xl"
                    required
                    disabled={editMode} // lock date when editing
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Daily Report</label>
                  <textarea
                    placeholder="Describe today's activities..."
                    value={report}
                    onChange={(e) => setReport(e.target.value)}
                    className="w-full border-2 border-gray-200 p-3 rounded-xl resize-none"
                    rows="4"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Additional Notes</label>
                  <textarea
                    placeholder="Any extra notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full border-2 border-gray-200 p-3 rounded-xl resize-none"
                    rows="2"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSubmit}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition"
                  >
                    {editMode ? "Update Report" : "Submit Report"}
                  </button>
                  {editMode && (
                    <button
                      onClick={resetForm}
                      className="w-full bg-gray-300 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-400 transition"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Report List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Report History</h2>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search reports..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                  />
                </div>
             <button
  onClick={() => window.open(`${BACKEND_URL}/download`, "_blank")}
  className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
  title="Download CSV"
>
  <Download className="w-5 h-5" />
</button>

              </div>

              <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
                {filteredReports.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No reports found</p>
                  </div>
                ) : (
                  filteredReports.map((r, i) => (
                    <div key={i} className="p-6 hover:bg-gray-50 transition">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Calendar className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{formatDate(r.date)}</h3>
                            <p className="text-xs text-gray-500">{r.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Edit
                            onClick={() => handleEdit(r)}
                            className="w-5 h-5 text-blue-500 cursor-pointer hover:text-blue-700"
                          />
                          <Trash
                            onClick={() => handleDelete(r)}
                            className="w-5 h-5 text-red-500 cursor-pointer hover:text-red-700"
                          />
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 mb-3">
                        <p className="text-gray-700">{r.report}</p>
                      </div>
                      {r.notes && (
                        <div className="bg-amber-50 border-l-4 border-amber-400 p-3 rounded">
                          <p className="text-sm text-amber-800">
                            <span className="font-medium">Notes:</span> {r.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
