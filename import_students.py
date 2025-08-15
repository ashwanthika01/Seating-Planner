import pandas as pd
import mysql.connector

# MySQL connection
conn = mysql.connector.connect(
    host="your_host",          # MySQL server
    user="your_username",               # Your MySQL username
    password="your_password",  # Your MySQL password
    database="your_db"      # Your database name
)
cursor = conn.cursor()

# Function to insert CSV into MySQL
def insert_csv(csv_file, table_name, year_label):
    df = pd.read_csv(csv_file)

    # Keep only needed columns & rename
    df = df.rename(columns={
        "Register No": "regno",
        "Student Name": "name",
        "Short name": "shortname"
    })[["regno", "name", "shortname"]]
    
    df["year"] = year_label

    # Create table if not exists
    cursor.execute(f"""
        CREATE TABLE IF NOT EXISTS {table_name} (
            regno VARCHAR(20),
            name VARCHAR(100),
            shortname VARCHAR(50),
            year VARCHAR(10)
        )
    """)

    # Insert each row
    for _, row in df.iterrows():
        cursor.execute(
            f"INSERT INTO {table_name} (regno, name, shortname, year) VALUES (%s, %s, %s, %s)",
            tuple(row)
        )
    conn.commit()
    print(f"{len(df)} rows inserted into {table_name}.")

# Insert all CSVs into separate tables
insert_csv("II year.csv", "students_II", "II year")
insert_csv("III year.csv", "students_III", "III year")
insert_csv("IV year.csv", "students_IV", "IV year")

cursor.close()
conn.close()