from flask import Flask, request, jsonify, send_file
import mysql.connector
from flask_cors import CORS
from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas


app = Flask(__name__)
CORS(app)


# ------------------ Database Connection ------------------
def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="root",
        database="cit"
    )


YEAR_MAP = {
    "1": "I year",
    "2": "II year",
    "3": "III year",
    "4": "IV year"
}


# ------------------ Fetch Students (Single Dept/Year) ------------------
@app.route("/students", methods=["GET"])
def get_students():
    campus = request.args.get("campus")
    department = request.args.get("department")
    year = request.args.get("year")

    if not department or not year:
        return jsonify({"error": "Missing parameters"}), 400

    year_str = YEAR_MAP.get(str(year))
    if not year_str:
        return jsonify({"error": "Invalid year"}), 400

    if campus == "CIT":
        year_map = {"1": "null", "2": "students_II", "3": "students_III", "4": "students_IV"}
        table_name = year_map.get(str(year))
    elif campus == "CITAR":
        table_name = "students_citar"
    else:
        return jsonify({"error": "Invalid campus"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            f"SELECT regno, name FROM {table_name} WHERE shortname LIKE %s AND year LIKE %s",
            (f"%{department}%", f"%{year_str}%"),
        )
        students = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(students)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ------------------ Multi-Hall Attendance Data (JSON) ------------------
@app.route("/attendance-data", methods=["POST"])
def attendance_data():
    """
    Expected JSON body:
    {
        "campus": "CIT",
        "hallAssignments": {
            "F8": {
                "years": [2,3],
                "yearDepartments": { "2": ["ECE"], "3": ["MECH"] }
            },
            "F9": {
                "years": [4],
                "yearDepartments": { "4": ["CSE","IT"] }
            }
        }
    }
    """
    data = request.json
    campus = data.get("campus")
    hall_assignments = data.get("hallAssignments", {})

    if not campus or not hall_assignments:
        return jsonify({"error": "Missing parameters"}), 400

    results = {}

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        for hall, details in hall_assignments.items():
            results[hall] = []
            years = details.get("years", [])
            year_departments = details.get("yearDepartments", {})

            for year in years:
                year_str = YEAR_MAP.get(str(year))
                if not year_str:
                    continue

                # Determine table based on campus/year
                if campus == "CIT":
                    year_map = {"1": "null", "2": "students_II", "3": "students_III", "4": "students_IV"}
                    table_name = year_map.get(str(year))
                elif campus == "CITAR":
                    table_name = "students_citar"
                else:
                    continue

                departments = year_departments.get(str(year), [])
                for dept in departments:
                    cursor.execute(
                        f"SELECT regno, name FROM {table_name} WHERE shortname LIKE %s AND year LIKE %s",
                        (f"%{dept}%", f"%{year_str}%"),
                    )
                    students = cursor.fetchall()
                    for s in students:
                        results[hall].append({
                            "year": year,
                            "dept": dept,
                            "regno": s["regno"],
                            "name": s["name"]
                        })

        cursor.close()
        conn.close()
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    return jsonify(results)


# ------------------ Attendance PDF ------------------
@app.route("/attendance-pdf", methods=["GET"])
def generate_attendance_pdf():
    campus = request.args.get("campus")
    department = request.args.get("department")
    year = request.args.get("year")

    if not department or not year or not campus:
        return jsonify({"error": "Missing parameters"}), 400

    year_str = YEAR_MAP.get(str(year))
    if not year_str:
        return jsonify({"error": "Invalid year"}), 400

    if campus == "CIT":
        year_map = {"1": "null", "2": "students_II", "3": "students_III", "4": "students_IV"}
        table_name = year_map.get(str(year))
    elif campus == "CITAR":
        table_name = "students_citar"
    else:
        return jsonify({"error": "Invalid campus"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            f"SELECT regno, name FROM {table_name} WHERE shortname LIKE %s AND year LIKE %s",
            (f"%{department}%", f"%{year_str}%"),
        )
        students = cursor.fetchall()
        cursor.close()
        conn.close()
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=letter)
    pdf.setFont("Helvetica-Bold", 16)
    pdf.drawString(150, 750, f"Attendance Sheet - {department} Year {year}")
    pdf.setFont("Helvetica", 12)

    y = 720
    for idx, student in enumerate(students, start=1):
        pdf.drawString(50, y, f"{idx}. {student['regno']} - {student['name']}")
        y -= 20
        if y < 50:
            pdf.showPage()
            pdf.setFont("Helvetica", 12)
            y = 750

    pdf.save()
    buffer.seek(0)
    return send_file(
        buffer,
        as_attachment=True,
        download_name=f"attendance_{campus}_{department}_year{year}.pdf",
        mimetype="application/pdf",
    )


# ------------------ Seating PDF ------------------
@app.route("/seating-pdf", methods=["GET"])
def generate_seating_pdf():
    campus = request.args.get("campus")
    department = request.args.get("department")
    year = request.args.get("year")

    if not department or not year or not campus:
        return jsonify({"error": "Missing parameters"}), 400

    year_str = YEAR_MAP.get(str(year))
    if not year_str:
        return jsonify({"error": "Invalid year"}), 400

    if campus == "CIT":
        year_map = {"1": "null", "2": "students_II", "3": "students_III", "4": "students_IV"}
        table_name = year_map.get(str(year))
    elif campus == "CITAR":
        table_name = "students_citar"
    else:
        return jsonify({"error": "Invalid campus"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            f"SELECT regno, name FROM {table_name} WHERE shortname LIKE %s AND year LIKE %s",
            (f"%{department}%", f"%{year_str}%"),
        )
        students = cursor.fetchall()
        cursor.close()
        conn.close()
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=letter)
    pdf.setFont("Helvetica-Bold", 16)
    pdf.drawString(150, 750, f"Seating Arrangement - {department} Year {year}")
    pdf.setFont("Helvetica", 12)

    y = 720
    col_x = [50, 300]
    col = 0
    for idx, student in enumerate(students, start=1):
        pdf.drawString(col_x[col], y, f"{idx}. {student['regno']} - {student['name']}")
        col += 1
        if col > 1:
            col = 0
            y -= 20
            if y < 50:
                pdf.showPage()
                pdf.setFont("Helvetica", 12)
                y = 750

    pdf.save()
    buffer.seek(0)
    return send_file(
        buffer,
        as_attachment=True,
        download_name=f"seating_arrangement_{campus}_{department}_year{year}.pdf",
        mimetype="application/pdf",
    )


if __name__ == "__main__":
    app.run(port=5000, debug=True)
