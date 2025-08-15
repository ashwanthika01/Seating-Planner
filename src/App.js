import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function App() {
  const citDepartments = ["CIVIL", "EEE", "ECE", "MEC", "MCT", "BME", "IT", "AIDS", "AIML", "ACT", "VLSI"];
  const citarDepartments = ["CSE", "CSE-CS", "CSBS"];

  const citHalls = [
    "F8", "F9", "F22", "F23", "S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8",
    "S10", "S15", "S16", "S17", "S18", "S20", "S21", "S22", "S23", "S24", "S26", "S27",
    "MS1", "MS2", "MS3", "MS4", "MS5", "MS6", "MS7", "MS8", "T2", "T3", "T4", "T6",
    "T7", "T8", "T9", "T10", "T11", "T12", "T13", "T14"
  ];
  const citarHalls = [
    "101", "102", "202", "203", "204", "205", "302", "303", "304", "305", "306", "307", "308", "309",
    "402", "502", "503", "504", "507", "508", "509", "601", "602", "603", "604", "605", "606", "607", "608"
  ];

  const allYears = [1, 2, 3];
  const [step, setStep] = useState(1);
  const [role, setRole] = useState("CIT");
  const [selectedHalls, setSelectedHalls] = useState([]);
  const [hallAssignments, setHallAssignments] = useState({});

  const halls = role === "CIT" ? citHalls : citarHalls;
  const departments = role === "CIT" ? citDepartments : citarDepartments;

  const selectAllHalls = () => {
    setSelectedHalls([...halls]);
  };

  const toggleHall = (hall) => {
    setSelectedHalls(prev =>
      prev.includes(hall) ? prev.filter(h => h !== hall) : [...prev, hall]
    );
  };

  const toggleDeptForHall = (hall, dept) => {
    setHallAssignments(prev => {
      const prevDept = prev[hall]?.departments || [];
      const newDept = prevDept.includes(dept) ? prevDept.filter(d => d !== dept) : [...prevDept, dept];
      return { ...prev, [hall]: { ...prev[hall], departments: newDept } };
    });
  };

  const toggleYearForHall = (hall, year) => {
    setHallAssignments(prev => {
      const prevYears = prev[hall]?.years || [];
      const newYears = prevYears.includes(year) ? prevYears.filter(y => y !== year) : [...prevYears, year];
      return { ...prev, [hall]: { ...prev[hall], years: newYears } };
    });
  };

  const handleRollRangeChange = (hall, year, type, value) => {
    setHallAssignments(prev => {
      const prevRanges = prev[hall]?.rollRanges || {};
      const newRange = { ...prevRanges[year], [type]: value };
      const newRanges = { ...prevRanges, [year]: newRange };
      return { ...prev, [hall]: { ...prev[hall], rollRanges: newRanges } };
    });
  };

  const btnStyle = (active = false) => ({
    backgroundColor: active ? "#28a745" : "#FFD700",
    border: "2px solid #DAA520",
    color: "black",
    padding: "8px 16px",
    fontWeight: "bold",
    margin: "6px",
    borderRadius: "8px",
    transition: "background-color 0.2s",
    cursor: "pointer"
  });

  const navBtn = {
    backgroundColor: "#FFD700",
    border: "2px solid #DAA520",
    color: "black",
    padding: "8px 16px",
    fontWeight: "bold",
    margin: "6px",
    borderRadius: "8px",
    cursor: "pointer"
  };

  const canNext = step === 1 && selectedHalls.length > 0;
  const handleNext = () => { if (!canNext) return; if (step < 2) setStep(step + 1) };
  const handleBack = () => { if (step > 1) setStep(step - 1) };

  const getYearPrefix = (year, dept) => {
    const baseYear = year === 3 ? "23" : year === 2 ? "24" : "25";
    const deptCode = {
      CSE: "CS", IT: "IT", CIVIL: "CE", ECE: "EC", MEC: "ME", MCT: "MT",
      BME: "BM", ADIS: "AD", AIML: "AM", ACT: "AC", VLSI: "VL", CSBS: "CB",
      EEE: "EE", "CSE-CS": "CZ"
    }[dept] || "XX";
    return `${baseYear}${deptCode}`;
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const cols = 5, rows = 6;

    selectedHalls.forEach((hall, hallIndex) => {
      if (hallIndex > 0) doc.addPage();
      doc.setFontSize(14);
      doc.text("CHENNAI INSTITUTE OF TECHNOLOGY – SEATING ARRANGEMENT", 105, 15, { align: "center" });

      doc.setFontSize(12);
      doc.setFillColor(0, 51, 102);
      doc.rect(80, 20, 50, 8, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont(undefined, "bold");
      doc.text(`Hall No: ${hall}`, 105, 26, { align: "center" });
      doc.setFont(undefined, "normal");
      doc.setTextColor(0, 0, 0);

      // Build student list for hall
      const students = [];
      const hallData = hallAssignments[hall] || {};
      if (hallData.departments && hallData.years && hallData.rollRanges) {
        hallData.years.forEach(year => {
          hallData.departments.forEach(dept => {
            const range = hallData.rollRanges?.[year];
            if (!range || !range.start || !range.end) return;
            const start = parseInt(range.start, 10);
            const end = parseInt(range.end, 10);
            const prefix = getYearPrefix(year, dept);
            for (let i = start; i <= end; i++) {
              students.push({ roll: `${prefix}${String(i).padStart(4, "0")}`, year, dept });
            }
          });
        });
      }

      // Pairing rule: same year + same dept can't be together
      const available = [...students];
      const seatList = [];
      while (available.length > 0) {
        const first = available.shift();
        let secondIndex = -1;
        for (let i = 0; i < available.length; i++) {
          if (!(available[i].year === first.year && available[i].dept === first.dept)) {
            secondIndex = i;
            break;
          }
        }
        if (secondIndex !== -1) {
          const second = available.splice(secondIndex, 1)[0];
          seatList.push(`${first.roll}\n${second.roll}`);
        } else {
          seatList.push(`${first.roll}`);
        }
      }

      // Arrange in zig-zag grid
      const grid = Array.from({ length: rows }, () => Array(cols).fill(""));
      let index = 0;
      let benchNum = 1;
      for (let c = 0; c < cols; c++) {
        if (c % 2 === 0) {
          for (let r = 0; r < rows; r++) {
            if (index < seatList.length) {
              grid[r][c] = [seatList[index], `(${benchNum})`].filter(Boolean).join("\n");
              index++;
              benchNum++;
            }
          }
        } else {
          for (let r = rows - 1; r >= 0; r--) {
            if (index < seatList.length) {
              grid[r][c] = [seatList[index], `(${benchNum})`].filter(Boolean).join("\n");
              index++;
              benchNum++;
            }
          }
        }
      }

      const columns = Array.from({ length: cols }, (_, i) => `Seat ${i + 1}`);
      autoTable(doc, {
        head: [columns],
        body: grid,
        startY: 32,
        styles: { fontSize: 8, cellWidth: "wrap", valign: "middle" },
        theme: "grid",
        didParseCell: (data) => {
          if (/\(\d+\)/.test(data.cell.text[0])) {
            data.cell.styles.fontStyle = "bold";
          }
        }
      });
    });

    doc.save("hall_seating_arrangement.pdf");
  };

  return (
    <div className="container-fluid min-vh-100 py-5" style={{ backgroundColor: "#001f3f", color: "white" }}>
      <h2 className="text-center mb-4">CHENNAI INSTITUTE OF TECHNOLOGY – SEATING ARRANGEMENT</h2>
      <div className="text-center mb-3">
        <span className="me-2">Campus:</span>
        {["CIT", "CITAR"].map(r => (
          <button
            key={r}
            style={btnStyle(role === r)}
            onClick={() => { setRole(r); setSelectedHalls([]); setHallAssignments({}) }}
          >
            {r}
          </button>
        ))}
      </div>
      <div className="text-center mb-4">
        <span style={{ padding: "6px 10px", borderRadius: "20px", background: "#143b6b", border: "1px solid #FFD700" }}>
          Step {step} of 2
        </span>
      </div>
      {step === 1 && (
        <div className="text-center">
          <h4>Select Halls</h4>
          <div className="mb-3">
            <button style={btnStyle()} onClick={selectAllHalls}>
              Select All Halls
            </button>
          </div>
          <div className="d-flex justify-content-center flex-wrap mt-3">
            {halls.map(h => (
              <button
                key={h}
                style={btnStyle(selectedHalls.includes(h))}
                onClick={() => toggleHall(h)}
              >
                {h}
              </button>
            ))}
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="text-center">
          <h4>Assign Students per Hall</h4>
          {selectedHalls.map(hall => {
            const assignment = hallAssignments[hall] || { departments: [], years: [], rollRanges: {} };
            return (
              <div key={hall} className="mb-3 border p-3 rounded">
                <h5>Hall {hall}</h5>
                <div className="d-flex justify-content-center flex-wrap">
                  <div className="m-2">
                    <label>Departments (multi-select)</label>
                    <div className="mb-1">
                      {departments.map(d => (
                        <label key={d} className="me-2">
                          <input type="checkbox" checked={assignment.departments?.includes(d) || false} onChange={() => toggleDeptForHall(hall, d)} /> {d}
                        </label>
                      ))}
                    </div>
                    <label>Years (multi-select, priority-wise)</label>
                    <div className="mb-2">
                      {allYears.map(y => (
                        <label key={y} className="me-2">
                          <input type="checkbox" checked={assignment.years?.includes(y) || false} onChange={() => toggleYearForHall(hall, y)} /> Year {y}
                        </label>
                      ))}
                    </div>
                    <label>Roll Number Range per Year</label>
                    <div>
                      {assignment.years?.map(y => (
                        <div key={y} className="mb-2">
                          <strong>Year {y}:</strong>
                          <input type="number" placeholder="Start" value={assignment.rollRanges?.[y]?.start || ""} onChange={e => handleRollRangeChange(hall, y, "start", e.target.value)} style={{ width: "70px", margin: "0 5px" }} /> -
                          <input type="number" placeholder="End" value={assignment.rollRanges?.[y]?.end || ""} onChange={e => handleRollRangeChange(hall, y, "end", e.target.value)} style={{ width: "70px", margin: "0 5px" }} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div className="text-center mt-4">
        {step > 1 && <button style={navBtn} onClick={handleBack}>Back</button>}
        {step < 2 && <button style={navBtn} onClick={handleNext} disabled={!canNext}>Next</button>}
        {step === 2 && <button style={navBtn} onClick={generatePDF}>Generate PDF</button>}
      </div>
    </div>
  );
}

export default App;