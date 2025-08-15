import pandas as pd
import mysql.connector

# Show full NM ID in console without truncation
pd.set_option('display.max_colwidth', None)

# MySQL connection
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="root",
    database="cit"
)
cursor = conn.cursor()

# Function to insert CSV into MySQL
def insert_csv(csv_file, table_name, year_label, format_type="normal"):
    print(f"\nProcessing: {csv_file} → {table_name}")

    df = pd.read_csv(csv_file)
    df.columns = df.columns.str.strip()  # Remove extra spaces in headers

    # Handle normal format
    if format_type == "normal":
        required_cols = ["Register No", "Student Name", "Short name"]
        if not all(col in df.columns for col in required_cols):
            raise ValueError(f"Missing expected columns in {csv_file} for normal format")
        df = df.rename(columns={
            "Register No": "regno",
            "Student Name": "name",
            "Short name": "shortname"
        })[["regno", "name", "shortname"]]

        regno_type = "VARCHAR(20)"  # Normal regno length

    # Handle citar format
    elif format_type == "citar":
        required_cols = ["NM ID", "Full Name", "Branch"]
        if not all(col in df.columns for col in required_cols):
            raise ValueError(f"Missing expected columns in {csv_file} for citar format")
        df = df.rename(columns={
            "NM ID": "regno",
            "Full Name": "name",
            "Branch": "shortname"
        })[["regno", "name", "shortname"]]

        regno_type = "VARCHAR(1000)"  # Long NM IDs allowed

    else:
        raise ValueError(f"Unknown format type: {format_type}")

    # Add year column
    df["year"] = year_label

    # Create table if not exists
    cursor.execute(f"""
        CREATE TABLE IF NOT EXISTS `{table_name}` (
            regno {regno_type},
            name VARCHAR(100),
            shortname VARCHAR(50),
            year VARCHAR(20)
        )
    """)

    # Insert rows
    inserted_count = 0
    for _, row in df.iterrows():
        cursor.execute(
            f"INSERT INTO `{table_name}` (regno, name, shortname, year) VALUES (%s, %s, %s, %s)",
            tuple(row)
        )
        inserted_count += 1

    conn.commit()
    print(f"✅ {inserted_count} rows inserted into {table_name}")

# Insert all CSVs
insert_csv("Student Name List-2.csv", "students_II", "II year", format_type="normal")
insert_csv("Student Name List-3.csv", "students_III", "III year", format_type="normal")
insert_csv("Student Name List.csv", "students_IV", "IV year", format_type="normal")
insert_csv("Students_citar.csv", "students_citar", "III year (CITAR)", format_type="citar")

cursor.close()
conn.close()
