from fastapi import FastAPI, HTTPException, Query, UploadFile, File, Form, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr
from pdf2image import convert_from_bytes
from datetime import datetime
from typing import Optional, List, Dict, Any
from PIL import Image
import mysql.connector
import bcrypt
import traceback
import pytesseract
import io
import re
import calendar


# Tesseract path
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
POPPLER_PATH = r"C:\poppler\poppler-24.08.0\Library\bin"

app = FastAPI()

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MySQL configuration
db_config = {
    "host": "localhost",
    "user": "root",
    "password": "",
    "database": "payslip",
}

# Models
class PayrollProfile(BaseModel):
    baseSalaryPerHour: float
    sssDeduction: float
    pagibigDeduction: float
    philhealthDeduction: float
    taxDeduction: float
    employment_type: str = "regular"
    leaveCredits: Optional[float] = 0.0 

class UserProfile(BaseModel):
    full_name: str
    username: str
    email: EmailStr
    password: str = ""
    payrollProfile: PayrollProfile

class LoginData(BaseModel):
    username: str
    password: str

class DTRDayEntry(BaseModel):
    day: int
    am_arrival: str
    am_departure: str
    pm_arrival: str
    pm_departure: str
    undertime_hours: int
    undertime_minutes: int

class DeductionItem(BaseModel):
    label: str
    amount: float

class PayslipResponse(BaseModel):
    fullName: str
    period: str
    totalHours: float
    ratePerHour: float
    grossIncome: float
    deductions: List[DeductionItem]

# Database initialization (run this once)
def initialize_database():
    try:
        connection = mysql.connector.connect(**db_config)
        cursor = connection.cursor()

        # Create tables if they don't exist
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS dtrs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            employee_name VARCHAR(255) NOT NULL,
            month VARCHAR(100) NOT NULL,
            working_hours VARCHAR(255),
            verified_by VARCHAR(255),
            position VARCHAR(255),
            total_time VARCHAR(255),
            status VARCHAR(50) DEFAULT 'pending',
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            processed_at TIMESTAMP NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS dtr_days (
            id INT AUTO_INCREMENT PRIMARY KEY,
            dtr_id INT NOT NULL,
            day INT NOT NULL,
            am_arrival VARCHAR(20),
            am_departure VARCHAR(20),
            pm_arrival VARCHAR(20),
            pm_departure VARCHAR(20),
            undertime_hours INT DEFAULT 0,
            undertime_minutes INT DEFAULT 0,
            FOREIGN KEY (dtr_id) REFERENCES dtrs(id) ON DELETE CASCADE
        )
                       
        """)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS payslips (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            dtr_id INT,
            month VARCHAR(100) NOT NULL,
            year INT NOT NULL,  # Ensure this column exists
            working_days INT,
            days_present INT,
            days_absent INT,
            leave_used INT,
            gross_income DECIMAL(10,2),
            total_deductions DECIMAL(10,2),
            net_income DECIMAL(10,2),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (dtr_id) REFERENCES dtrs(id) ON DELETE SET NULL
        )
        """)
        connection.commit()
        print("Database tables initialized successfully")
    except Exception as e:
        print(f"Error initializing database: {str(e)}")
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()


# Call this function when the application starts
initialize_database()

# Register endpoint
@app.post("/register")
def register_user(user: UserProfile):
    try:
        connection = mysql.connector.connect(**db_config)
        cursor = connection.cursor()

        cursor.execute("SELECT id FROM users WHERE email = %s OR username = %s", (user.email, user.username))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Email or username already exists")

        hashed_password = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt())

        cursor.execute("""
            INSERT INTO users (full_name, email, username, password_hash)
            VALUES (%s, %s, %s, %s)
        """, (user.full_name, user.email, user.username, hashed_password.decode('utf-8')))

        cursor.execute("SELECT id FROM users WHERE username = %s", (user.username,))
        user_id = cursor.fetchone()[0]

        cursor.execute("""
            INSERT INTO employee_profiles (
                user_id, employee_name, employment_type, base_salary_hour,
                sss_deduction, pagibig_deduction, philhealth_deduction, tax_deduction
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            user_id, user.full_name, "regular", 0.0, 0.0, 0.0, 0.0, 0.0
        ))

        connection.commit()
        return {"message": "User registered successfully"}
    except Exception as err:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(err)}")
    finally:
        if 'connection' in locals() and connection.is_connected():
            cursor.close()
            connection.close()

# Login endpoint
@app.post("/login")
def login(user: LoginData):
    try:
        connection = mysql.connector.connect(**db_config)
        cursor = connection.cursor(dictionary=True)

        cursor.execute("""
            SELECT users.id, users.full_name, users.email, users.username, users.password_hash,
                   employee_profiles.employee_name, employee_profiles.employment_type,
                   employee_profiles.base_salary_hour
            FROM users
            LEFT JOIN employee_profiles ON users.id = employee_profiles.user_id
            WHERE users.username = %s
        """, (user.username,))
        
        result = cursor.fetchone()
        if result and bcrypt.checkpw(user.password.encode('utf-8'), result["password_hash"].encode('utf-8')):
            return {
                "message": "Login successful",
                "user": {
                    "id": result["id"],
                    "full_name": result["full_name"],
                    "username": result["username"],
                    "email": result["email"],
                    "employee_name": result.get("employee_name"),
                    "employment_type": result.get("employment_type"),
                    "base_salary_hour": result.get("base_salary_hour")
                }
            }
        else:
            raise HTTPException(status_code=401, detail="Invalid username or password")
    except Exception as err:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Login failed: {str(err)}")
    finally:
        if 'connection' in locals() and connection.is_connected():
            cursor.close()
            connection.close()

#fetch profile      
@app.get("/api/user/profile")
def get_user_profile(username: str = Query(...)):
    try:
        connection = mysql.connector.connect(**db_config)
        cursor = connection.cursor(dictionary=True)

        # Get user data
        cursor.execute("SELECT id, full_name, username, email FROM users WHERE username = %s", (username,))
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Get payroll data with leaveCredits
        cursor.execute("""
            SELECT 
                employment_type, base_salary_hour AS baseSalaryPerHour,
                sss_deduction AS sssDeduction, pagibig_deduction AS pagibigDeduction,
                philhealth_deduction AS philhealthDeduction, tax_deduction AS taxDeduction,
                leave_credits AS leaveCredits
            FROM employee_profiles 
            WHERE user_id = %s
        """, (user["id"],))
        
        payroll = cursor.fetchone()

        return {
            "full_name": user["full_name"],
            "username": user["username"],
            "email": user["email"],
            "password": "",  # Never return password
            "payrollProfile": payroll or {
                "employment_type": "regular",
                "baseSalaryPerHour": 0.0,
                "sssDeduction": 0.0,
                "pagibigDeduction": 0.0,
                "philhealthDeduction": 0.0,
                "taxDeduction": 0.0,
                "leaveCredits": 0.0
            }
        }

    except Exception as err:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Fetch profile failed: {str(err)}")

    finally:
        if 'connection' in locals() and connection.is_connected():
            cursor.close()
            connection.close()


# PUT to update or insert payroll profile including leaveCredits
@app.put("/api/user/profile")
def update_user_profile(data: dict = Body(...)):
    try:
        connection = mysql.connector.connect(**db_config)
        cursor = connection.cursor()

        # Update users table
        cursor.execute("""
            UPDATE users SET full_name = %s, email = %s
            WHERE username = %s
        """, (data["full_name"], data["email"], data["username"]))

        # Extract nested payrollProfile
        payroll = data.get("payrollProfile", {})

        # Check if payroll profile exists
        cursor.execute("""
            SELECT id FROM employee_profiles WHERE user_id = (SELECT id FROM users WHERE username = %s)
        """, (data["username"],))
        existing_profile = cursor.fetchone()

        if existing_profile:
            # Update existing payroll profile with leaveCredits
            cursor.execute("""
                UPDATE employee_profiles 
                SET employment_type = %s, base_salary_hour = %s,
                    sss_deduction = %s, pagibig_deduction = %s,
                    philhealth_deduction = %s, tax_deduction = %s,
                    leave_credits = %s
                WHERE id = %s
            """, (
                payroll.get("employment_type", "regular"),
                payroll.get("baseSalaryPerHour", 0.0),
                payroll.get("sssDeduction", 0.0),
                payroll.get("pagibigDeduction", 0.0),
                payroll.get("philhealthDeduction", 0.0),
                payroll.get("taxDeduction", 0.0),
                payroll.get("leaveCredits", 0.0),
                existing_profile[0]
            ))
        else:
            # Insert new payroll profile with leaveCredits
            cursor.execute("""
                INSERT INTO employee_profiles (
                    user_id, employment_type, base_salary_hour, 
                    sss_deduction, pagibig_deduction, philhealth_deduction, 
                    tax_deduction, leave_credits
                )
                VALUES (
                    (SELECT id FROM users WHERE username = %s),
                    %s, %s, %s, %s, %s, %s, %s
                )
            """, (
                data["username"],
                payroll.get("employment_type", "regular"),
                payroll.get("baseSalaryPerHour", 0.0),
                payroll.get("sssDeduction", 0.0),
                payroll.get("pagibigDeduction", 0.0),
                payroll.get("philhealthDeduction", 0.0),
                payroll.get("taxDeduction", 0.0),
                payroll.get("leaveCredits", 0.0)
            ))

        # Update password if provided
        if data.get("password"):
            hashed = bcrypt.hashpw(data["password"].encode('utf-8'), bcrypt.gensalt())
            cursor.execute("UPDATE users SET password_hash = %s WHERE username = %s", 
                           (hashed, data["username"]))

        connection.commit()
        return {"message": "Profile updated successfully"}

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to update profile")

    finally:
        if 'connection' in locals() and connection.is_connected():
            cursor.close()
            connection.close()
            
# OCR Endpoint (Updated)
@app.post("/ocr")
async def ocr(
    file: UploadFile = File(...),
    username: str = Form(...),
    replace_existing: bool = Form(False),
):
    try:
        print(f"Processing DTR for user: {username}")
        connection = mysql.connector.connect(**db_config)
        cursor = connection.cursor(dictionary=True)

        # Get user info
        cursor.execute("SELECT id, full_name FROM users WHERE username = %s", (username,))
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=401, detail="Invalid user")
        
        user_id = user["id"]
        full_name = user["full_name"].strip().upper()

        # Process file
        contents = await file.read()
        images = convert_from_bytes(contents, poppler_path=POPPLER_PATH) if file.filename.lower().endswith(".pdf") \
            else [Image.open(io.BytesIO(contents))]

        full_text = "\n\n".join([pytesseract.image_to_string(img) for img in images])
        dtr_sections = re.split(r'\n(?=DAILY TIME RECORD)', full_text, flags=re.IGNORECASE)

        def normalize(s):
            return s.strip().replace("\n", " ") if s else "Not found"

        def is_valid_name(candidate):
            return (
                candidate
                and not re.search(r'(DAILY TIME RECORD|FORM|CSC|OFFICIAL HOURS|REGULA|MONTH)', candidate.upper())
                and not re.match(r'^[A-Za-z]+\s+\d{1,2}[-–]\d{1,2},\s*\d{4}$', candidate)
                and len(candidate.split()) >= 2
                and not any(char.isdigit() for char in candidate)
            )

        extracted_data = []
        # Updated pattern to better handle day numbers (including '11' being misread as 'u')
        daily_pattern = re.compile(
            r'^([uU]|\d{1,2})\s+'  # Handles 'u' or 'U' which might be misread '11'
            r'(\d{1,2}:\d{2}\s*[APapmM]*)\s+'
            r'(\d{1,2}:\d{2}\s*[APapmM]*)\s+'
            r'(\d{1,2}:\d{2}\s*[APapmM]*)\s+'
            r'(\d{1,2}:\d{2}\s*[APapmM]*)\s*'
            r'(?:(\d+)\s*hrs?\s*(\d+)\s*mins?)?',
            re.MULTILINE | re.IGNORECASE
        )

        for dtr_text in dtr_sections:
            lines = [line.strip() for line in dtr_text.splitlines() if line.strip()]

            # Extract name
            name = "Not found"
            for i, line in enumerate(lines):
                if "NAME" in line.upper():
                    parts = re.split(r'NAME', line, flags=re.IGNORECASE)
                    if len(parts) > 1 and is_valid_name(parts[0].strip()):
                        name = parts[0].strip()
                        break
                    elif i > 0 and is_valid_name(lines[i - 1]):
                        name = lines[i - 1]
                        break
                    elif i + 1 < len(lines) and is_valid_name(lines[i + 1]):
                        name = lines[i + 1]
                        break

            if full_name not in name.upper():
                raise HTTPException(status_code=403, detail=f"DTR belongs to {name}, not the logged-in user.")

            # Extract month
            month_year_match = re.search(r'([A-Za-z]+),\s*(\d{4})', dtr_text)
            if not month_year_match:
                raise HTTPException(status_code=400, detail="Could not extract month and year from DTR")

            parsed_month = month_year_match.group(1).strip().capitalize()
            parsed_year = int(month_year_match.group(2).strip())

            # Check existing DTR and delete if replacing
            cursor.execute("""
                SELECT id FROM dtrs WHERE user_id = %s AND LOWER(month) = LOWER(%s) AND year = %s
            """, (user_id, parsed_month.lower(), parsed_year))
            existing_dtr = cursor.fetchone()

            if existing_dtr and not replace_existing:
                raise HTTPException(
                    status_code=409,
                    detail=f"You already uploaded a DTR for {parsed_month}. Set 'replace_existing' to true to replace it."
                )
            elif existing_dtr and replace_existing:
                # Delete existing daily records first
                cursor.execute("DELETE FROM dtr_days WHERE dtr_id = %s", (existing_dtr["id"],))
                # Then delete the DTR header
                cursor.execute("DELETE FROM dtrs WHERE id = %s", (existing_dtr["id"],))
                connection.commit()
                print(f"Deleted existing DTR {existing_dtr['id']} and its daily records for replacement")

            # Extract working hours
            working_hours = "Not found"
            working_match = re.search(
                r'Regular\s+days\s+'
                r'(\d{1,2}:\d{2})\s*([aApP][mM])?\s*[–\-]\s*'
                r'(\d{1,2}:\d{2})\s*([aApP][mM])?\s+and\s+'
                r'(\d{1,2}:\d{2})\s*([aApP][mM])?\s*[–\-]\s*'
                r'(\d{1,2}:\d{2})\s*([aApP][mM])?',
                dtr_text,
                re.IGNORECASE
            )
            if working_match:
                morning_start = f"{working_match.group(1)} {working_match.group(2) or ''}".strip()
                morning_end = f"{working_match.group(3)} {working_match.group(4) or ''}".strip()
                afternoon_start = f"{working_match.group(5)} {working_match.group(6) or ''}".strip()
                afternoon_end = f"{working_match.group(7)} {working_match.group(8) or ''}".strip()
                working_hours = f"{morning_start} - {morning_end} and {afternoon_start} - {afternoon_end}"

            # Extract other fields
            verified_match = re.search(r'\b(JUAN Z\. DELA CRUZ)\b', dtr_text, re.IGNORECASE)
            position_match = re.search(r'\b(Principal|Manager|Supervisor)\b', dtr_text, re.IGNORECASE)
            total_time_match = re.search(r'\bTOTAL\s+(\d+\s+hours\s+and\s+\d+\s+minutes)\b', dtr_text, re.IGNORECASE)

            parsed = {
                "name": normalize(name),
                "month": parsed_month,
                "year": parsed_year,
                "workingHours": normalize(working_hours),
                "verifiedBy": normalize(verified_match.group(1)) if verified_match else "Not found",
                "position": normalize(position_match.group(1)) if position_match else "Not found",
                "totalTime": normalize(total_time_match.group(1)) if total_time_match else "Not found",
                "dailyRecords": []
            }

            # Insert DTR header
            cursor.execute("""
                INSERT INTO dtrs (user_id, employee_name, month, year, working_hours, verified_by, position, total_time)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                user_id, parsed["name"], parsed["month"], parsed["year"], parsed["workingHours"],
                parsed["verifiedBy"], parsed["position"], parsed["totalTime"]
            ))
            
            # Get inserted DTR ID
            cursor.execute("SELECT LAST_INSERT_ID() AS dtr_id")
            dtr_id = cursor.fetchone()["dtr_id"]
            print(f"Inserted DTR ID: {dtr_id}")

            # Process daily entries with improved validation
            daily_entries = []
            insert_values = []
            for match in daily_pattern.finditer(dtr_text):
                try:
                    day_str = match.group(1).upper()  # Convert to uppercase for 'U' check
                    
                    # Handle 'u' being misread as '11'
                    if day_str == 'U':
                        day = 11
                    else:
                        if not day_str.isdigit():
                            print(f"Skipping invalid day: {day_str}")
                            continue
                        day = int(day_str)
                    
                    if day < 1 or day > 31:
                        continue

                    # Normalize time format
                    def format_time(t):
                        t = re.sub(r'\s+', '', t).upper()
                        if not re.search(r'[AP]M$', t):
                            hour_part = t.split(':')[0]
                            if hour_part.isdigit():
                                hour = int(hour_part)
                                period = '' if hour < 12 else ''
                                return f"{t}{period}"
                        return t

                    am_arrival = format_time(match.group(2))
                    am_departure = format_time(match.group(3))
                    pm_arrival = format_time(match.group(4))
                    pm_departure = format_time(match.group(5))
                    
                    undertime_hours = int(match.group(6)) if match.group(6) else 0
                    undertime_minutes = int(match.group(7)) if match.group(7) else 0

                    daily_entries.append({
                        "day": day,
                        "am_arrival": am_arrival,
                        "am_departure": am_departure,
                        "pm_arrival": pm_arrival,
                        "pm_departure": pm_departure,
                        "undertime_hours": undertime_hours,
                        "undertime_minutes": undertime_minutes
                    })

                    insert_values.append((
                        dtr_id,
                        day,
                        am_arrival,
                        am_departure,
                        pm_arrival,
                        pm_departure,
                        undertime_hours,
                        undertime_minutes
                    ))

                except Exception as e:
                    print(f"Error processing day entry: {str(e)}")
                    continue

            # Batch insert daily entries
            if insert_values:
                cursor.executemany("""
                    INSERT INTO dtr_days 
                    (dtr_id, day, am_arrival, am_departure, pm_arrival, pm_departure, undertime_hours, undertime_minutes)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """, insert_values)
                print(f"Inserted {len(insert_values)} daily records for DTR {dtr_id}")

            connection.commit()
            parsed["dailyRecords"] = daily_entries
            extracted_data.append(parsed)

        return JSONResponse({
            "text": full_text,
            "parsedDTRs": extracted_data,
            "message": "DTR processed successfully",
            "database": {
                "dtrs_inserted": len(extracted_data),
                "days_inserted": sum(len(d["dailyRecords"]) for d in extracted_data)
            }
        })

    except mysql.connector.Error as err:
        print(f"Database error: {err}")
        if 'connection' in locals() and connection.is_connected():
            connection.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {err.msg}")
    except HTTPException:
        raise
    except Exception as err:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"OCR processing failed: {str(err)}")
    finally:
        if 'connection' in locals() and connection.is_connected():
            cursor.close()
            connection.close()

#computation of salary
@app.post("/compute_salary")
def compute_salary(data: dict = Body(...)):
    username = data.get("username")
    month = data.get("month")

    if not username or not month:
        raise HTTPException(status_code=400, detail="Username and month are required")

    try:
        print("📦 Received request to compute salary for:", username, "| Month:", month)

        connection = mysql.connector.connect(**db_config)
        cursor = connection.cursor(dictionary=True)

        # Get user ID
        cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        user_id = user["id"]
        print("✅ User ID found:", user_id)

        # Get DTR
        cursor.execute("""
            SELECT * FROM dtrs 
            WHERE user_id = %s AND (month = %s OR month LIKE CONCAT(%s, '%%'))
        """, (user_id, month, month.split(',')[0].strip()))
        dtr_results = cursor.fetchall()
        if not dtr_results:
            raise HTTPException(status_code=404, detail=f"No DTR found for {month}")
        dtr = dtr_results[0]
        print("✅ DTR found:", dtr["id"])

        # Get daily entries
        cursor.execute("SELECT * FROM dtr_days WHERE dtr_id = %s", (dtr["id"],))
        day_entries = cursor.fetchall()
        print(f"📅 Found {len(day_entries)} day entries")

        # Helper to compute daily hours
        def compute_daily_hours(entry):
            try:
                def to_minutes(t):
                    return datetime.strptime(t, "%H:%M").hour * 60 + datetime.strptime(t, "%H:%M").minute

                am = to_minutes(entry["am_departure"]) - to_minutes(entry["am_arrival"])
                pm = to_minutes(entry["pm_departure"]) - to_minutes(entry["pm_arrival"])
                undertime = (entry.get("undertime_hours", 0) * 60) + entry.get("undertime_minutes", 0)
                total_minutes = am + pm - undertime
                return max(total_minutes / 60, 0)
            except Exception as e:
                print(f"⚠️ Failed to compute daily hours for day {entry.get('day')}: {e}")
                return 0

        total_hours = sum(compute_daily_hours(e) for e in day_entries)
        print("⏱️ Total hours computed:", total_hours)

        # Calculate working_days, days_present, days_absent, leave_used
        working_days = len(day_entries)  # assuming dtr_days covers only official working days
        days_present = sum(1 for e in day_entries if e.get("am_arrival") and e.get("pm_arrival"))
        leave_used = sum(1 for e in day_entries if e.get("is_leave") == 1)
        days_absent = working_days - days_present - leave_used
        if days_absent < 0:
            days_absent = 0  # safety check

        print(f"Working days: {working_days}, Days Present: {days_present}, Leave Used: {leave_used}, Days Absent: {days_absent}")

        # Get payroll profile
        cursor.execute("""
            SELECT base_salary_hour, sss_deduction, pagibig_deduction,
                   philhealth_deduction, tax_deduction
            FROM employee_profiles WHERE user_id = %s
        """, (user_id,))
        profile = cursor.fetchone()
        if not profile:
            raise HTTPException(status_code=404, detail="Payroll profile not found")

        print("💰 Payroll profile found:", profile)

        rate = float(profile["base_salary_hour"])
        gross = total_hours * rate
        deductions_list = [
            float(profile["sss_deduction"]),
            float(profile["pagibig_deduction"]),
            float(profile["philhealth_deduction"]),
            float(profile["tax_deduction"])
        ]
        total_deductions = sum(deductions_list)
        net = gross - total_deductions

        print("📄 Final Payslip Computed: Gross:", gross, "| Net:", net)

        # Insert payslip record
        insert_query = """
            INSERT INTO payslips (
                user_id, dtr_id, month, year, working_days, days_present, days_absent, leave_used,
                gross_income, total_deductions, net_income, created_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
        """
        cursor.execute(insert_query, (
            user_id,
            dtr["id"],
            dtr["month"],
            dtr["year"],
            working_days,
            days_present,
            days_absent,
            leave_used,
            round(gross, 2),
            round(total_deductions, 2),
            round(net, 2)
        ))
        connection.commit()
        print("✅ Payslip saved to DB")

        # Update DTR status
        cursor.execute("UPDATE dtrs SET status = 'processed', processed_at = NOW() WHERE id = %s", (dtr["id"],))
        connection.commit()
        print("✅ DTR marked as processed")

        return {
            "fullName": dtr["employee_name"],
            "period": dtr["month"],
            "ratePerHour": rate,
            "totalHours": round(total_hours, 2),
            "grossIncome": round(gross, 2),
            "totalDeductions": round(total_deductions, 2),
            "netPay": round(net, 2),
            "workingDays": working_days,
            "daysPresent": days_present,
            "daysAbsent": days_absent,
            "leaveUsed": leave_used,
            "status": "processed"
        }

    except Exception as e:
        print("❌ Error during salary computation:", str(e))
        raise HTTPException(status_code=500, detail=f"Computation failed: {str(e)}")
    finally:
        if 'connection' in locals() and connection.is_connected():
            cursor.close()
            connection.close()


#fetching payslips
def format_month_for_db(month_str: str) -> tuple:
    """
    Convert input month format to database-compatible format
    Input formats accepted: "YYYY-MM" or "Month, Year"
    Returns: (month_name: str, year: int)
    """
    try:
        # Handle "YYYY-MM" format
        if '-' in month_str and len(month_str.split('-')) == 2:
            dt = datetime.strptime(month_str, "%Y-%m")
            return (dt.strftime("%B"), dt.year)
        
        # Handle "Month, Year" format
        elif ',' in month_str:
            parts = month_str.split(',')
            if len(parts) == 2:
                month_name = parts[0].strip()
                year = int(parts[1].strip())
                return (month_name, year)
        
        # Fallback for other formats
        return (month_str.strip(), 0)
    
    except ValueError as e:
        print(f"⚠️ Error parsing month string '{month_str}': {str(e)}")
        return (month_str.strip(), 0)

def parse_db_month_to_iso(month: str, year: int) -> str:
    """
    Convert database month and year back to ISO format "YYYY-MM"
    """
    try:
        dt = datetime.strptime(f"{month} {year}", "%B %Y")
        return dt.strftime("%Y-%m")
    except ValueError:
        return f"{year}-01"  # Fallback to January if parsing fails

@app.get("/payslip")
async def get_payslip(username: str, month: str, year: int):
    print(f"🔍 Fetching payslip for {username}, month: {month}, year: {year}")
    
    try:
        connection = mysql.connector.connect(**db_config)
        cursor = connection.cursor(dictionary=True)

        # Get user ID
        cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
        user = cursor.fetchone()
        
        if not user:
            print("❌ User not found")
            raise HTTPException(status_code=404, detail="User not found")

        user_id = user['id']
        print(f"✅ User ID: {user_id}")

        # Convert input month to database format
        month_name, year_value = format_month_for_db(month)
        print(f"🔄 Converted {month} to DB format: month='{month_name}', year={year_value}")

        # Use the provided year parameter if we got 0 from formatting
        if year_value == 0:
            year_value = year

        # Fetch the most recent payslip (month + year match)
            query = """
                SELECT p.*, u.full_name
                FROM payslips p
                JOIN users u ON p.user_id = u.id
                WHERE p.user_id = %s AND TRIM(p.month) = %s AND p.year = %s
                ORDER BY p.created_at DESC
                LIMIT 1
            """
        print(f"📝 Executing query with params: user_id={user_id}, month='{month_name}', year={year_value}")
        cursor.execute(query, (user_id, month_name, year_value))
        
        payslip = cursor.fetchone()
        print(f"📄 Payslip data: {payslip}")

        if not payslip:
            print("⚠️ No payslip found, checking available months")
            cursor.execute("""
                SELECT DISTINCT TRIM(month) as month, year
                FROM payslips 
                WHERE user_id = %s
                ORDER BY year, STR_TO_DATE(CONCAT('01 ', month, ' ', year), '%d %M %Y')
            """, (user_id,))
            available_months = [{"month": row['month'], "year": row['year']} for row in cursor.fetchall()]
            print(f"📅 Available months: {available_months}")
            
            raise HTTPException(
                status_code=404,
                detail={
                    "error": f"No payslip found for {month_name} {year_value}",
                    "available_months": available_months
                }
            )

        # Get detailed deductions
        cursor.execute("""
            SELECT 
                sss_deduction as sss,
                pagibig_deduction as pagibig,
                philhealth_deduction as philhealth,
                tax_deduction as tax
            FROM employee_profiles
            WHERE user_id = %s
        """, (user_id,))
        
        deductions = cursor.fetchone() or {}
        print(f"💰 Deductions: {deductions}")

        # Calculate hours and rate
        days_present = payslip['days_present'] or 0
        gross_income = float(payslip['gross_income']) if payslip['gross_income'] else 0
        
        if days_present > 0:
            total_hours = round(gross_income / (days_present * 8), 2)
            rate_per_hour = round(gross_income / (days_present * 8), 2)
        else:
            total_hours = 0
            rate_per_hour = 0

        # Prepare response with properly formatted period
        iso_month = parse_db_month_to_iso(payslip['month'], payslip['year'])
        response = {
            "fullName": payslip['full_name'],
            "period": iso_month,
            "totalHours": total_hours,
            "ratePerHour": rate_per_hour,
            "grossIncome": gross_income,
            "deductions": [
                {"label": "SSS", "amount": float(deductions.get('sss', 0))},
                {"label": "Pag-IBIG", "amount": float(deductions.get('pagibig', 0))},
                {"label": "PhilHealth", "amount": float(deductions.get('philhealth', 0))},
                {"label": "Tax", "amount": float(deductions.get('tax', 0))}
            ],
            "netPay": float(payslip['net_income']) if payslip['net_income'] else 0,
            "status": "processed",
            "workingDays": payslip['working_days'],
            "daysPresent": payslip['days_present'],
            "daysAbsent": payslip['days_absent'],
            "leaveUsed": payslip['leave_used']
        }

        print(f"📤 Response prepared: {response}")
        return response

    except mysql.connector.Error as err:
        print(f"❌ Database error: {err}")
        raise HTTPException(status_code=500, detail=f"Database error: {err}")
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error fetching payslip: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals():
            connection.close()
    
@app.get("/available-months")
async def get_available_months(username: str):
    try:
        connection = mysql.connector.connect(**db_config)
        cursor = connection.cursor(dictionary=True)

        # Get user ID
        cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Get distinct month+year pairs
        cursor.execute("""
            SELECT DISTINCT TRIM(month) as month, year
            FROM payslips 
            WHERE user_id = %s
            ORDER BY year DESC, 
                     STR_TO_DATE(CONCAT('01 ', month), '%d %M') DESC
        """, (user['id'],))
        
        results = cursor.fetchall()
        return [{"month": row["month"], "year": row["year"]} for row in results]

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if 'connection' in locals() and connection.is_connected():
            cursor.close()
            connection.close()