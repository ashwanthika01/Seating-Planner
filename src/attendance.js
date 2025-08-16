import jsPDF from "jspdf";
import axios from "axios";

export const generateAttendancePDF = async (campus, department, year, selectedHalls) => {
  try {
    // 1. Get student data from Flask backend
    const res = await axios.get("http://localhost:5000/attendance-data", {
      params: { campus, department, year }
    });

    const students = res.data; // Expecting array of { regno, name, hall }
    const doc = new jsPDF();

    // 2. Title
    doc.setFontSize(16);
    doc.text(`${campus} ATTENDANCE SHEET`, 105, 20, { align: "center" });
    doc.setFontSize(12);

    let yPos = 40;

    selectedHalls.forEach(hall => {
      // Hall header
      doc.setFont(undefined, "bold");
      doc.text(`Hall: ${hall}`, 20, yPos);
      yPos += 10;
      doc.setFont(undefined, "normal");

      // Filter students for this hall
      const hallStudents = students.filter(s => s.hall === hall);

      hallStudents.forEach((student, idx) => {
        doc.text(`${idx + 1}. ${student.regno} - ${student.name}`, 25, yPos);
        yPos += 8;
        if (yPos > 280) { // Add page break if near page bottom
          doc.addPage();
          yPos = 20; // Reset y position with margin
        }
      });

      yPos += 10; // Space between halls
    });

    doc.save(`attendance_${campus}_${department}_year${year}.pdf`);
  } catch (err) {
    console.error("Error generating attendance PDF:", err);
    alert("Failed to fetch attendance data");
  }
};
