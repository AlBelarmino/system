from fastapi import FastAPI, HTTPException, Query, UploadFile, File, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr
import mysql.connector
import bcrypt
import traceback
from PIL import Image
import pytesseract
import io
import re
from pdf2image import convert_from_bytes

# Tesseract path
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

app = FastAPI()

# Allow frontend access (React)
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

class UserProfile(BaseModel):
    full_name: str
    username: str
    email: EmailStr
    password: str = ""
    payrollProfile: PayrollProfile

class User(BaseModel):
    full_name: str
    email: EmailStr
    username: str
    password: str

class LoginData(BaseModel):
    username: str
    password: str

# Register
@app.post("/register")
def register_user(user: User):
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
                user_id, employment_type, base_salary_hour,
                sss_deduction, pagibig_deduction, philhealth_deduction, tax_deduction
            ) VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (user_id, "regular", 0.0, 0.0, 0.0, 0.0, 0.0))

        connection.commit()
        return {"message": "User registered successfully"}

    except Exception as err:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(err)}")

    finally:
        if 'connection' in locals() and connection.is_connected():
            cursor.close()
            connection.close()

# Login
@app.post("/login")
def login(user: LoginData):
    try:
        connection = mysql.connector.connect(**db_config)
        cursor = connection.cursor(dictionary=True)

        cursor.execute("""
            SELECT 
                users.id, users.full_name, users.email, users.username, users.password_hash,
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

# Fetch profile
@app.get("/api/user/profile")
def get_user_profile(username: str = Query(...)):
    try:
        connection = mysql.connector.connect(**db_config)
        cursor = connection.cursor(dictionary=True)

        cursor.execute("SELECT id, full_name, username, email FROM users WHERE username = %s", (username,))
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        cursor.execute("SELECT * FROM employee_profiles WHERE user_id = %s", (user["id"],))
        payroll = cursor.fetchone()

        default_payroll = {
            "baseSalaryPerHour": 0.0,
            "sssDeduction": 0.0,
            "pagibigDeduction": 0.0,
            "philhealthDeduction": 0.0,
            "taxDeduction": 0.0,
            "employment_type": "regular"
        }

        return {
            "full_name": user["full_name"],
            "username": user["username"],
            "email": user["email"],
            "password": "",
            "payrollProfile": payroll if payroll else default_payroll
        }

    except Exception as err:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Fetch profile failed: {str(err)}")

    finally:
        if 'connection' in locals() and connection.is_connected():
            cursor.close()
            connection.close()

# Update profile
@app.put("/api/user/profile")
def update_user_profile(data: dict = Body(...)):
    try:
        connection = mysql.connector.connect(**db_config)
        cursor = connection.cursor()

        cursor.execute("""
            UPDATE users SET full_name = %s, email = %s
            WHERE username = %s
        """, (data["full_name"], data["email"], data["username"]))

        cursor.execute("""
            UPDATE employee_profiles 
            SET employment_type = %s, base_salary_hour = %s,
                sss_deduction = %s, pagibig_deduction = %s,
                philhealth_deduction = %s, tax_deduction = %s
            WHERE user_id = (SELECT id FROM users WHERE username = %s)
        """, (
            data["payrollProfile"]["employment_type"],
            data["payrollProfile"]["baseSalaryPerHour"],
            data["payrollProfile"]["sssDeduction"],
            data["payrollProfile"]["pagibigDeduction"],
            data["payrollProfile"]["philhealthDeduction"],
            data["payrollProfile"]["taxDeduction"],
            data["username"]
        ))

        if data.get("password"):
            hashed = bcrypt.hashpw(data["password"].encode('utf-8'), bcrypt.gensalt())
            cursor.execute("UPDATE users SET password_hash = %s WHERE username = %s", (hashed, data["username"]))

        connection.commit()
        return {"message": "Profile updated successfully"}

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to update profile")

    finally:
        if 'connection' in locals() and connection.is_connected():
            cursor.close()
            connection.close()

# OCR endpoint
@app.post("/ocr")
async def ocr(file: UploadFile = File(...)):
    try:
        # Check file type
        if file.content_type not in ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf']:
            raise HTTPException(status_code=400, detail="Invalid file type. Only images (PNG, JPG, JPEG) and PDFs are allowed.")

        contents = await file.read()
        
        # Handle PDFs (you'll need to install pdf2image: pip install pdf2image)
        if file.content_type == 'application/pdf':
            POPPLER_PATH = r"C:\poppler\poppler-24.08.0\Library\bin"
            images = convert_from_bytes(contents, poppler_path=POPPLER_PATH)
            text = ""
            for image in images:
                text += pytesseract.image_to_string(image) + "\n"
        else:
            image = Image.open(io.BytesIO(contents))
            text = pytesseract.image_to_string(image)

        # Your existing parsing logic...
        def normalize(s):
            return s.strip().replace("\n", " ") if s else "Not found"

        name = re.search(r'NAME\s*[:\-]?\s*([A-Z.\s]+)', text, re.I)
        month = re.search(r'MONTH\s*[:\-]?\s*([A-Za-z]+\s*\d{1,2}-\d{1,2},?\s*\d{4})', text, re.I)
        hours = re.search(r'Official hours.*?(\d{1,2}:\d{2}.*)', text, re.I)
        approver = re.search(r'Verified\s+by\s*[:\-]?\s*([A-Z\s.]+)\s*\n([A-Za-z\s]+)', text, re.I)

        data = {
            "text": text,
            "parsedData": {
                "name": normalize(name.group(1)) if name else "Not found",
                "month": normalize(month.group(1)) if month else "Not found",
                "workingHours": normalize(hours.group(1)) if hours else "Not found",
                "verifiedBy": normalize(approver.group(1)) if approver else "Not found",
                "position": normalize(approver.group(2)) if approver else "Not found",
            }
        }

        return data

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"OCR processing failed: {str(e)}")
