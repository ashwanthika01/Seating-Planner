import React, { useState } from 'react';

function CITDashboard() {
  const [year, setYear] = useState('');
  const [dept, setDept] = useState('');
  const [studentCount, setStudentCount] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Year: ${year}, Dept: ${dept}, Student Count: ${studentCount}`);
  };

  return (
    <div className="container mt-5">
      <h2>CIT Dashboard</h2>
      <form onSubmit={handleSubmit} className="p-3 border rounded">
        <div className="mb-3">
          <label className="form-label">Select Year</label>
          <select className="form-select" value={year} onChange={(e) => setYear(e.target.value)}>
            <option value="">Select</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
          </select>
        </div>

        <div className="mb-3">
          <label className="form-label">Select Department</label>
          <select className="form-select" value={dept} onChange={(e) => setDept(e.target.value)}>
            <option value="">Select</option>
            <option value="CSE">CSE</option>
            <option value="IT">IT</option>
            <option value="ECE">ECE</option>
          </select>
        </div>

        <div className="mb-3">
          <label className="form-label">Student Count</label>
          <input
            type="number"
            className="form-control"
            value={studentCount}
            onChange={(e) => setStudentCount(e.target.value)}
          />
        </div>

        <button type="submit" className="btn btn-primary">Submit</button>
      </form>
    </div>
  );
}

export default CITDashboard;
