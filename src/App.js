import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function App() {
  const [role, setRole] = useState("");
  const [year, setYear] = useState("");
  const [dept, setDept] = useState("");
  const [hall, setHall] = useState("");
  const [fromRoll, setFromRoll] = useState("");
  const [toRoll, setToRoll] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [seatingList, setSeatingList] = useState([]);

  const citDepartments = ["CIVIL","EEE","ECE","MEC","MCT","BME","IT","ADIS","AIML","ACT","VLSI"];
  const citarDepartments = ["CSE","CSE-CS","CSBS"];

  const citHalls = ["F8","F9","F22","F23","S1","S2","S3","S4","S5","S6","S7","S8",
    "S10","S15","S16","S17","S18","S20","S21","S22","S23","S24","S26","S27",
    "MS1","MS2","MS3","MS4","MS5","MS6","MS7","MS8",
    "T2","T3","T4","T6","T7","T8","T9","T10","T11","T12","T13","T14"];
  const citarHalls = ["101","102","202","203","204","205",
    "302","303","304","305","306","307","308","309",
    "402","502","503","504","507","508","509",
    "601","602","603","604","605","606","607","608"];

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setYear(""); setDept(""); setHall(""); setFromRoll(""); setToRoll(""); setSubmitted(false);
  };

  const handleSubmit = () => {
    if (year && dept && hall && fromRoll && toRoll) {
      const newEntry = { role, year, dept, hall, fromRoll, toRoll };
      setSeatingList([...seatingList, newEntry]);
      setSubmitted(true);
    } else alert("Please fill all the fields!");
  };

  const handleAddMore = () => {
    setYear(""); setDept(""); setHall(""); setFromRoll(""); setToRoll(""); setSubmitted(false);
  };

  const handleBack = () => {
    if (fromRoll || toRoll) { setFromRoll(""); setToRoll(""); }
    else if (hall) setHall("");
    else if (dept) setDept("");
    else if (year) setYear("");
    else if (role) setRole("");
  };

  // Roll number generation based on year and department
  const expandRollNumbers = (deptCode, start, end, year) => {
    let yearPrefix;
    if (year === 1) yearPrefix = "25";
    else if (year === 2) yearPrefix = "24";
    else if (year === 3) yearPrefix = "23";

    const deptCodeMap = {
      CSE: "CS", IT: "IT", CIVIL: "CE", ECE: "EC",
      MEC: "ME", MCT: "MT", BME: "BM", ADIS: "AD",
      AIML: "AM", ACT: "AC", VLSI: "VL", CSBS: "CB",
      EEE: "EE", "CSE-CS": "CZ"
    };

    const prefix = yearPrefix + deptCodeMap[deptCode];
    const rolls = [];
    for (let i = start; i <= end; i++) {
      rolls.push(prefix + String(i).padStart(4, "0"));
    }
    return rolls;
  };

  const handleGeneratePDF = () => {
    const doc = new jsPDF();
    const colsPerRow = 6;   // Seats per row

    // Group all entries by hall
    const hallGroups = {};
    seatingList.forEach(item => {
      if (!hallGroups[item.hall]) hallGroups[item.hall] = [];
      const rolls = expandRollNumbers(item.dept, parseInt(item.fromRoll), parseInt(item.toRoll), item.year)
        .map(r => ({ roll: r, year: item.year }));
      hallGroups[item.hall].push(...rolls);
    });

    let firstPage = true;

    Object.keys(hallGroups).forEach(hallNum => {
      if (!firstPage) doc.addPage();
      firstPage = false;

      doc.setFontSize(14);
      doc.text("CHENNAI INSTITUTE OF TECHNOLOGY", 105, 15, { align: "center" });
      doc.setFontSize(12);
      doc.text("Seating Arrangement", 105, 22, { align: "center" });
      doc.text(`Hall No: ${hallNum}`, 105, 28, { align: "center" });
      doc.setFontSize(10);
      doc.text(`Date: 13-08-2025  Session: Morning  Time: 10:00 AM`, 105, 34, { align: "center" });

      const hallRolls = hallGroups[hallNum];

      // Group students by year
      const yearGroups = {};
      hallRolls.forEach(s => {
        if (!yearGroups[s.year]) yearGroups[s.year] = [];
        yearGroups[s.year].push(s.roll);
      });

      const years = Object.keys(yearGroups).sort((a,b)=>a-b);
      const seatingPairs = [];
      const maxLen = Math.max(...years.map(y => yearGroups[y].length));

      // Column-first seating
      for (let i = 0; i < maxLen; i++) {
        const pair = [];
        years.forEach(y => {
          if (yearGroups[y][i]) pair.push(yearGroups[y][i]);
        });
        if (pair.length === 2) seatingPairs.push(`${pair[0]}\n${pair[1]}`);
        else if (pair.length === 1) seatingPairs.push(`${pair[0]}`);
      }

      // Split into rows
      const rows = [];
      for (let i = 0; i < seatingPairs.length; i += colsPerRow) {
        rows.push(seatingPairs.slice(i, i + colsPerRow));
      }

      const columns = [];
      for (let i = 0; i < colsPerRow; i++) columns.push(`Seat ${i + 1}`);

      autoTable(doc, {
        head: [columns],
        body: rows,
        startY: 40,
        styles: { fontSize: 8, cellWidth: "auto", valign: "middle" },
        theme: "grid",
      });
    });

    doc.save("hall_seating_arrangement.pdf");
  };

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4">
        CHENNAI INSTITUTE OF TECHNOLOGY - SEATING ARRANGEMENT
      </h2>

      {(role || year || dept || hall || submitted) && (
        <button className="btn btn-secondary mb-3" onClick={handleBack}>
          &larr; Back
        </button>
      )}

      {!role && (
        <div className="text-center">
          <button className="btn btn-primary m-3 btn-lg" onClick={() => handleRoleSelect("CIT")}>
            CIT
          </button>
          <button className="btn btn-success m-3 btn-lg" onClick={() => handleRoleSelect("CITAR")}>
            CITAR
          </button>
        </div>
      )}

      {role && !year && (
        <div className="text-center">
          <h4>Select Year</h4>
          {[1,2,3].map(y => (
            <button key={y} className="btn btn-outline-primary m-2" onClick={() => setYear(y)}>
              Year {y}
            </button>
          ))}
        </div>
      )}

      {role && year && !dept && (
        <div className="text-center">
          <h4>Year {year} - Select Department</h4>
          {(role === "CIT" ? citDepartments : citarDepartments).map(d => (
            <button key={d} className="btn btn-outline-dark m-2" onClick={() => setDept(d)}>{d}</button>
          ))}
        </div>
      )}

      {role && year && dept && !hall && (
        <div className="text-center mt-3">
          <h4>{dept} - Select Hall Number</h4>
          <select className="form-select w-50 mx-auto" value={hall} onChange={e => setHall(e.target.value)}>
            <option value="">-- Select Hall --</option>
            {(role === "CIT" ? citHalls : citarHalls).map(h => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
      )}

      {role && year && dept && hall && !submitted && (
        <div className="text-center mt-4">
          <h4>{hall} - {dept} - Year {year}</h4>
          <div className="row justify-content-center">
            <div className="col-md-3">
              <input type="number" placeholder="From Roll No" className="form-control mb-2" value={fromRoll} onChange={e => setFromRoll(e.target.value)} />
            </div>
            <div className="col-md-3">
              <input type="number" placeholder="To Roll No" className="form-control mb-2" value={toRoll} onChange={e => setToRoll(e.target.value)} />
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleSubmit}>Submit</button>
        </div>
      )}

      {submitted && (
        <div className="text-center mt-3">
          <button className="btn btn-success m-2" onClick={handleAddMore}>Add More</button>
        </div>
      )}

      {seatingList.length > 0 && (
        <div className="mt-4">
          <h4 className="text-center mb-3">Seating Entries</h4>
          <table className="table table-bordered text-center">
            <thead>
              <tr>
                <th>Role</th>
                <th>Year</th>
                <th>Department</th>
                <th>Hall</th>
                <th>From Roll</th>
                <th>To Roll</th>
              </tr>
            </thead>
            <tbody>
              {seatingList.map((entry, index) => (
                <tr key={index}>
                  <td>{entry.role}</td>
                  <td>{entry.year}</td>
                  <td>{entry.dept}</td>
                  <td>{entry.hall}</td>
                  <td>{entry.fromRoll}</td>
                  <td>{entry.toRoll}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-center">
            <button className="btn btn-primary mt-3" onClick={handleGeneratePDF}>
              Generate PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
