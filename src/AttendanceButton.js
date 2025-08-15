import React from "react";

export default function AttendanceButton(props) {
  const { selectedHalls, campus, department, year } = props;

  const generateAutoAttendancePDF = async () => {
    if (!selectedHalls || selectedHalls.length === 0) {
      alert("Please select at least one hall first.");
      return;
    }

    if (!department || !year || !campus) {
      alert("Please ensure campus, department, and year are selected.");
      return;
    }

    console.log(
      "Generating attendance PDFs for halls:",
      selectedHalls,
      campus,
      department,
      year
    );

    try {
      for (const hall of selectedHalls) {
        const url = `http://localhost:5000/attendance-pdf?campus=${campus}&department=${encodeURIComponent(
          department
        )}&year=${year}&hall=${encodeURIComponent(hall)}`;
        console.log("Fetching URL:", url);

        const res = await fetch(url);

        if (!res.ok) throw new Error(`Failed to generate attendance for ${hall}`);

        const blob = await res.blob();
        const blobUrl = window.URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = `${hall}_attendance.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();

        window.URL.revokeObjectURL(blobUrl);
      }
    } catch (error) {
      console.error("Error generating attendance PDF:", error);
      alert(`Error generating attendance PDF: ${error.message}`);
    }
  };

  return (
    <button
      style={{
        padding: "8px 15px",
        margin: "5px",
        border: "none",
        borderRadius: "5px",
        backgroundColor: "#28a745",
        color: "#fff",
        cursor: "pointer",
      }}
      onClick={generateAutoAttendancePDF}
    >
      Generate Attendance PDF
    </button>
  );
}
