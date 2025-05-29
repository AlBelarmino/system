class PayrollProfile(BaseModel):
    baseSalaryPerHour: float
    sssDeduction: float
    pagibigDeduction: float
    philhealthDeduction: float
    taxDeduction: float
    employment_type: str = "regular"
    leaveCredits: Optional[float] = 0.0 
    bonuses: list
    bonusOther: dict
    loans: list
    loanOther: dict

class Loan(BaseModel):
    name: str
    amount: float
    duration: int
    start_month: str


class UserProfile(BaseModel):
    full_name: str
    username: str
    email: EmailStr
    password: str = ""


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

class SalaryRequest(BaseModel):
    username: str
    month_str: str  


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

class MonthEntry(BaseModel):
    month: str
    year: int

class MonthSelection(BaseModel):
    username: str
    selected_months: List[MonthEntry]

class RecordOut(BaseModel):
    month: str
    year: int
    dtr_pdf_url: str
    payslip_pdf_url: Optional[str]
    payroll_report_pdf_url: Optional[str]

    class Config:
        orm_mode = True

class InsightRequest(BaseModel):
    payslip_data: dict
    analysis_type: Optional[str] = "standard"
    language: Optional[str] = "en"

class InsightResponse(BaseModel):
    insights: str
    model: str
    tokens_used: int
#computation of salary
def clamp_time(actual_str, expected_str, direction="in"):
    actual = datetime.strptime(actual_str, "%H:%M").time()
    expected = datetime.strptime(expected_str, "%H:%M").time()
    return max(actual, expected) if direction == "in" else min(actual, expected)

def minutes_between(t1, t2):
    return (datetime.combine(datetime.today(), t2) - datetime.combine(datetime.today(), t1)).seconds / 60

def compute_daily_hours(entry):
    try:
        am_minutes, pm_minutes = 0, 0

        if entry["am_arrival"] and entry["am_departure"]:
            am_arrival = clamp_time(entry["am_arrival"], "08:00", "in")
            am_departure = clamp_time(entry["am_departure"], "12:00", "out")
            am_minutes = max(minutes_between(am_arrival, am_departure), 0)

        if entry["pm_arrival"] and entry["pm_departure"]:
            pm_arrival = clamp_time(entry["pm_arrival"], "13:00", "in")
            pm_departure = clamp_time(entry["pm_departure"], "17:00", "out")
            pm_minutes = max(minutes_between(pm_arrival, pm_departure), 0)

        undertime = (entry.get("undertime_hours", 0) * 60) + entry.get("undertime_minutes", 0)
        return max((am_minutes + pm_minutes - undertime) / 60, 0)
    except:
        return 0
    
@app.post("/compute_salary")
async def compute_salary(payload: SalaryRequest):
    try:
        print(f"⏩ Received payload: {payload.dict()}")
        
        username = payload.username
        month_str = payload.month_str.strip().capitalize()

        # Database connection
        connection = mysql.connector.connect(**db_config)
        cursor = connection.cursor(dictionary=True)
        
        # 1. Get user ID
        cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        user_id = user["id"]
        
        # 2. Get DTR
        cursor.execute("""
            SELECT * FROM dtrs 
            WHERE user_id = %s 
            AND month = %s
            LIMIT 1
        """, (user_id, month_str))
        dtr = cursor.fetchone()
        if not dtr:
            raise HTTPException(status_code=404, detail=f"No DTR found for {month_str}")

        dtr_month = dtr["month"]
        dtr_year = dtr["year"]

        # 3. Calculate working days
        try:
            month_index = list(calendar.month_name).index(dtr_month)
            _, num_days = calendar.monthrange(dtr_year, month_index)
            working_days = sum(
                1 for day in range(1, num_days + 1)
                if datetime(dtr_year, month_index, day).weekday() < 5
            )
        except:
            working_days = 22  # Fallback value

        # 4. Get daily entries and compute hours + late minutes
        cursor.execute("SELECT * FROM dtr_days WHERE dtr_id = %s", (dtr["id"],))
        day_entries = cursor.fetchall()
        
        total_hours = 0.0
        total_late_minutes = 0
        days_present = 0
        
        for entry in day_entries:
            try:
                # Initialize variables for this day
                daily_hours = 0.0
                daily_late_minutes = 0
                
                # AM Arrival Late Calculation
                if entry["am_arrival"]:
                    try:
                        am_arrival = datetime.strptime(entry["am_arrival"], "%H:%M")
                        expected_am = datetime.strptime("08:00", "%H:%M")
                        if am_arrival > expected_am:
                            late_minutes = (am_arrival - expected_am).seconds // 60
                            daily_late_minutes += late_minutes
                    except Exception as e:
                        print(f"Error processing AM arrival: {str(e)}")
                
                # PM Arrival Late Calculation
                if entry["pm_arrival"]:
                    try:
                        pm_arrival = datetime.strptime(entry["pm_arrival"], "%H:%M")
                        expected_pm = datetime.strptime("13:00", "%H:%M")
                        if pm_arrival > expected_pm:
                            late_minutes = (pm_arrival - expected_pm).seconds // 60
                            daily_late_minutes += late_minutes
                    except Exception as e:
                        print(f"Error processing PM arrival: {str(e)}")
                
                # Calculate working hours
                try:
                    times = []
                    for period in ['am_arrival', 'am_departure', 'pm_arrival', 'pm_departure']:
                        if entry.get(period):
                            times.append(datetime.strptime(entry[period], "%H:%M"))
                    
                    if len(times) == 4:
                        am_hours = (times[1] - times[0]).seconds / 3600
                        pm_hours = (times[3] - times[2]).seconds / 3600
                        daily_hours = am_hours + pm_hours
                        days_present += 1
                except Exception as e:
                    print(f"Error calculating hours: {str(e)}")
                
                # Add to totals
                total_hours += daily_hours
                total_late_minutes += daily_late_minutes
                
            except Exception as e:
                print(f"Error processing day entry: {str(e)}")
                continue

        # 5. Get payroll profile
        cursor.execute("""
            SELECT base_salary_hour, employment_type, leave_credits,
                   gsis_deduction, philhealth_deduction, tax_deduction,
                   base_monthly_salary
            FROM employee_profiles WHERE user_id = %s
        """, (user_id,))
        profile = cursor.fetchone()
        if not profile:
            raise HTTPException(status_code=404, detail="Payroll profile not found")

        # Convert all values to float with error handling
        try:
            rate = float(profile["base_salary_hour"])
            monthly_salary = float(profile["base_monthly_salary"])
            employment_type = profile["employment_type"]
            leave_credits = float(profile["leave_credits"] or 0)
            philhealth = float(profile["philhealth_deduction"] or 0)
            tax = float(profile["tax_deduction"] or 0)
            gsis = float(profile["gsis_deduction"] or 0)
        except (TypeError, ValueError) as e:
            raise HTTPException(status_code=500, detail=f"Invalid payroll values: {str(e)}")

        # Calculate late deduction (only for regular employees)
        late_deduction = 0.0
        if employment_type == "regular":
            # Convert late minutes to hours
            late_hours = total_late_minutes / 60
            # Calculate deduction based on hourly rate
            late_deduction = round(late_hours * rate, 2)
            print(f"⏱ Late deduction calculated: {late_deduction} (from {total_late_minutes} minutes)")

        # 6. Calculate gross income based on employment type
        if employment_type == "irregular":
            gross = total_hours * rate
            days_absent = 0
            leave_used = 0
        else:
            gross = monthly_salary
            days_absent = max(working_days - days_present, 0)
            leave_used = min(leave_credits, days_absent)
            unpaid_absent_days = max(days_absent - leave_used, 0)
            absent_deduction = round((monthly_salary / working_days) * unpaid_absent_days, 2)
            gross = monthly_salary - absent_deduction - late_deduction  # Deduct late penalty
            new_leave_credits = leave_credits - leave_used
            
            # Update leave credits in profile
            cursor.execute(
                "UPDATE employee_profiles SET leave_credits = %s WHERE user_id = %s",
                (new_leave_credits, user_id)
            )
            print(f"📝 Updated leave credits: {new_leave_credits}")

        # 7. Process Loans
        loan_deduction = 0.0
        loans_to_save = []
        try:
            cursor.execute("""
                SELECT id, loan_name, amount, duration_months, 
                    start_month, start_year, balance
                FROM employee_loans 
                WHERE user_id = %s AND balance > 0
            """, (user_id,))
            loans = cursor.fetchall()
            
            current_period = f"{dtr_month} {dtr_year}"
            
            for loan in loans:
                try:
                    # Handle month format
                    if loan['start_month'].isdigit():
                        month_num = int(loan['start_month'])
                        start_month = calendar.month_name[month_num]
                    else:
                        start_month = loan['start_month'].capitalize()
                    
                    loan_date = datetime.strptime(f"{start_month} {loan['start_year']}", "%B %Y")
                    current_date = datetime.strptime(current_period, "%B %Y")
                    
                    if current_date >= loan_date:
                        monthly_payment = round(float(loan['amount']) / loan['duration_months'], 2)
                        if monthly_payment > float(loan['balance']):
                            monthly_payment = float(loan['balance'])
                        
                        loan_deduction += monthly_payment
                        new_balance = round(float(loan['balance']) - monthly_payment, 2)
                        
                        loans_to_save.append({
                            'loan_name': loan['loan_name'],
                            'amount': monthly_payment
                        })
                        
                        cursor.execute(
                            "UPDATE employee_loans SET balance = %s WHERE id = %s",
                            (new_balance, loan['id'])
                        )
                        print(f"📝 Updated loan balance: {loan['loan_name']} = {new_balance}")
                except Exception as e:
                    print(f"Error processing loan {loan.get('id')}: {str(e)}")
                    continue
        except Exception as e:
            print(f"Loan processing failed: {str(e)}")

        # 8. Process Bonuses
        bonuses = 0.0
        bonuses_to_save = []
        try:
            cursor.execute("""
                SELECT amount, frequency, bonus_name 
                FROM employee_bonuses 
                WHERE user_id = %s
            """, (user_id,))
            
            bonuses_data = cursor.fetchall()
            for b in bonuses_data:
                try:
                    # Monthly bonuses always apply
                    if b["frequency"] == "monthly":
                        bonuses += float(b["amount"])
                        bonuses_to_save.append({
                            'bonus_name': b["bonus_name"],
                            'amount': float(b["amount"])
                        })
                    # Yearly bonuses only in December
                    elif b["frequency"] == "yearly" and dtr_month.lower() == "december":
                        bonuses += float(b["amount"])
                        bonuses_to_save.append({
                            'bonus_name': b["bonus_name"],
                            'amount': float(b["amount"])
                        })
                except Exception as e:
                    print(f"Error processing bonus: {str(e)}")
                    continue
        except Exception as e:
            print(f"Bonus processing failed: {str(e)}")

        # 9. Final calculations
        total_deductions = round(gsis + philhealth + tax + loan_deduction + late_deduction, 2)
        net = round(gross + bonuses - total_deductions, 2)

        # 10. Save payslip with late information
        cursor.execute("""
            INSERT INTO payslips (
                user_id, dtr_id, month, year,
                working_days, days_present, days_absent, leave_used,
                total_hours, late_minutes, late_deduction, gross_income, bonuses,
                philhealth_deduction, tax_deduction, loan_deduction,
                total_deductions, net_income, created_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
        """, (
            user_id, dtr["id"], dtr_month, dtr_year,
            working_days, days_present, days_absent, leave_used,
            round(total_hours, 2), total_late_minutes, late_deduction, round(gross, 2), round(bonuses, 2),
            philhealth, tax, round(loan_deduction, 2),
            total_deductions, net
        ))
        
        payslip_id = cursor.lastrowid
        print(f"💾 Saved payslip ID: {payslip_id}")

        # 11. Save loan deductions
        for loan in loans_to_save:
            cursor.execute("""
                INSERT INTO payslip_loan_deductions 
                (payslip_id, loan_name, amount)
                VALUES (%s, %s, %s)
            """, (payslip_id, loan['loan_name'], loan['amount']))

        # 12. Save bonuses
        for bonus in bonuses_to_save:
            cursor.execute("""
                INSERT INTO payslip_bonuses 
                (payslip_id, bonus_name, amount)
                VALUES (%s, %s, %s)
            """, (payslip_id, bonus['bonus_name'], bonus['amount']))

        # 13. Update DTR status
        cursor.execute("""
            UPDATE dtrs SET status = 'processed', processed_at = NOW()
            WHERE id = %s
        """, (dtr["id"],))

        connection.commit()

        return {
            "status": "success",
            "data": {
                "employee": dtr["employee_name"],
                "period": f"{dtr_month} {dtr_year}",
                "grossIncome": round(gross, 2),
                "lateMinutes": total_late_minutes,
                "lateDeduction": late_deduction,
                "deductions": {
                    "philhealth": philhealth,
                    "tax": tax,
                    "loans": round(loan_deduction, 2),
                    "late": round(late_deduction, 2),
                    "total": total_deductions
                },
                "netPay": net
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        if 'connection' in locals() and connection.is_connected():
            connection.rollback()
        print(f"❌ Error: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
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
    print(f"🔍 Fetching payslip for {username}, input month: {month}, input year: {year}")

    try:
        connection = mysql.connector.connect(**db_config)
        cursor = connection.cursor(dictionary=True)

        # 🔎 Get user ID & full name
        cursor.execute("SELECT id, full_name FROM users WHERE username = %s", (username,))
        user = cursor.fetchone()

        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_id = user["id"]
        full_name = user["full_name"]
        print(f"✅ Found user ID: {user_id}, Name: {full_name}")

        # 📅 Normalize month format
        parsed_month, parsed_year = format_month_for_db(month)
        normalized_month = parsed_month.strip().lower().capitalize() if parsed_month else month.strip().lower().capitalize()
        normalized_year = parsed_year if parsed_year != 0 else year
        print(f"📅 Normalized month: {normalized_month}, year: {normalized_year}")

        # 📄 Fetch payslip from DB
        cursor.execute("""
            SELECT *
            FROM payslips
            WHERE user_id = %s AND LOWER(TRIM(month)) = %s AND year = %s
            ORDER BY created_at DESC
            LIMIT 1
        """, (user_id, normalized_month.lower(), normalized_year))

        payslip = cursor.fetchone()
        if not payslip:
            raise HTTPException(status_code=404, detail=f"No payslip found for {normalized_month} {normalized_year}")
        
        payslip_id = payslip["id"]
        print(f"📄 Found payslip ID: {payslip_id}")

        # 👔 Get employee profile
        cursor.execute("""
            SELECT employment_type, base_salary_hour, base_monthly_salary, salary_grade
            FROM employee_profiles
            WHERE user_id = %s
        """, (user_id,))
        profile = cursor.fetchone()

        employment_type = profile.get("employment_type", "irregular") if profile else "irregular"
        rate_per_hour = float(profile.get("base_salary_hour", 0)) if employment_type == "irregular" else None
        rate_per_month = float(profile.get("base_monthly_salary", 0)) if employment_type == "regular" else None

        # 🎁 Get bonuses
        cursor.execute("""
            SELECT bonus_name, amount
            FROM payslip_bonuses
            WHERE payslip_id = %s
        """, (payslip_id,))
        bonuses = [{"label": b["bonus_name"], "amount": float(b["amount"])} for b in cursor.fetchall()]

        # 💸 Get loan deductions
        cursor.execute("""
            SELECT 
                pl.loan_name, 
                pl.amount,
                (SELECT balance FROM employee_loans 
                WHERE user_id = %s AND loan_name = pl.loan_name
                ORDER BY created_at DESC LIMIT 1) as balance
            FROM payslip_loan_deductions pl
            WHERE pl.payslip_id = %s
        """, (user_id, payslip_id))
        
        loan_deductions = []
        for l in cursor.fetchall():
            loan_deductions.append({
                "label": l["loan_name"],
                "amount": float(l["amount"]),
                "balance": float(l["balance"]) if l["balance"] is not None else 0.0
            })

        # 🧾 Government deductions
        deductions = [
            {
                "label": "GSIS",
                "amount": float(payslip.get("total_deductions", 0)) 
                        - float(payslip.get("loan_deduction", 0)) 
                        - float(payslip.get("tax_deduction", 0)) 
                        - float(payslip.get("philhealth_deduction", 0)),
                "balance": 0.0
            },
            {
                "label": "PhilHealth",
                "amount": float(payslip.get("philhealth_deduction", 0)),
                "balance": 0.0
            },
            {
                "label": "Tax",
                "amount": float(payslip.get("tax_deduction", 0)),
                "balance": 0.0
            },
        ] + loan_deductions

        response = {
            "fullName": full_name,
            "period": parse_db_month_to_iso(normalized_month, normalized_year),
            "employmentType": employment_type,
            "salaryGrade": profile.get("salary_grade") if profile else None,
            "ratePerHour": rate_per_hour,
            "ratePerMonth": rate_per_month,
            "totalHours": float(payslip.get("total_hours", 0)),
            "grossIncome": float(payslip.get("gross_income", 0)),
            "bonuses": bonuses,
            "deductions": deductions,
            "netPay": float(payslip.get("net_income", 0)),
            "status": "processed",
            "workingDays": payslip.get("working_days", 0),
            "daysPresent": payslip.get("days_present", 0),
            "daysAbsent": payslip.get("days_absent", 0),
            "leaveUsed": payslip.get("leave_used", 0),
        }

        print(f"📤 Final response: {response}")
        return response

    except mysql.connector.Error as err:
        print(f"❌ MySQL error: {err}")
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

@app.post("/api/payslip/summary")
async def get_payslip_summary(data: MonthSelection):
    try:
        connection = mysql.connector.connect(**db_config)
        cursor = connection.cursor(dictionary=True)

        # Get user ID and employment info
        cursor.execute("""
            SELECT u.id, e.employment_type, e.base_salary_hour, e.base_monthly_salary, e.salary_grade, u.full_name
            FROM users u
            LEFT JOIN employee_profiles e ON u.id = e.user_id
            WHERE u.username = %s
        """, (data.username,))
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        user_id = user["id"]
        full_name = user["full_name"]

        # Data containers
        monthly_summary = {}
        income_breakdown = defaultdict(lambda: defaultdict(float))
        deduction_breakdown = defaultdict(lambda: defaultdict(float))
        quarter_totals = defaultdict(float)
        month_list = []

        # Quarter label mapping
        quarter_map = {
            1: "Jan-Mar",
            2: "Apr-Jun",
            3: "Jul-Sep",
            4: "Oct-Dec"
        }

        for entry in data.selected_months:
            month = entry.month
            year = entry.year

            cursor.execute("""
                SELECT *
                FROM payslips
                WHERE user_id = %s AND month = %s AND year = %s
                ORDER BY created_at DESC
                LIMIT 1
            """, (user_id, month, year))
            payslip = cursor.fetchone()
            if not payslip:
                continue

            payslip_id = payslip["id"]
            month_key = f"{month} {year}"
            month_list.append(month_key)

            # Get quarter key for potential future use
            try:
                month_index = list(calendar.month_name).index(month.capitalize())
                quarter = (month_index - 1) // 3 + 1
                quarter_key = f"{quarter_map[quarter]} {year}"
            except:
                quarter_key = f"Q{month} {year}"

            gross = float(payslip.get("gross_income", 0))
            deductions = float(payslip.get("total_deductions", 0))
            net = float(payslip.get("net_income", 0))

            monthly_summary[month_key] = {
                "gross_income": gross,
                "total_deductions": deductions,
                "net_income": net,
                "quarter": quarter_key
            }

            quarter_totals[f"{quarter_key}_gross"] += gross
            quarter_totals[f"{quarter_key}_deductions"] += deductions
            quarter_totals[f"{quarter_key}_net"] += net

            # Base salary
            income_breakdown["Base Salary"][month_key] += gross

            # Bonuses
            cursor.execute("""
                SELECT bonus_name, amount
                FROM payslip_bonuses
                WHERE payslip_id = %s
            """, (payslip_id,))
            for bonus in cursor.fetchall():
                income_breakdown[bonus["bonus_name"]][month_key] += float(bonus["amount"])

            # Loan deductions
            cursor.execute("""
                SELECT pl.loan_name, pl.amount,
                       (SELECT balance FROM employee_loans 
                        WHERE user_id = %s AND loan_name = pl.loan_name
                        ORDER BY created_at DESC LIMIT 1) as balance
                FROM payslip_loan_deductions pl
                WHERE pl.payslip_id = %s
            """, (user_id, payslip_id))
            
            for loan in cursor.fetchall():
                deduction_breakdown[loan["loan_name"]][month_key] += float(loan["amount"])
                deduction_breakdown[f"{loan['loan_name']}_balance"][month_key] = float(loan["balance"]) if loan["balance"] is not None else 0.0

            # Gov deductions
            gsis = float(payslip.get("total_deductions", 0)) - float(payslip.get("loan_deduction", 0)) - float(payslip.get("tax_deduction", 0)) - float(payslip.get("philhealth_deduction", 0))
            philhealth = float(payslip.get("philhealth_deduction", 0))
            tax = float(payslip.get("tax_deduction", 0))

            deduction_breakdown["GSIS"][month_key] += gsis
            deduction_breakdown["PhilHealth"][month_key] += philhealth
            deduction_breakdown["Tax"][month_key] += tax

        # Compute totals
        total_gross = sum(month["gross_income"] for month in monthly_summary.values())
        total_deductions = sum(month["total_deductions"] for month in monthly_summary.values())
        total_net = sum(month["net_income"] for month in monthly_summary.values())

        quarter_summary = {}
        for quarter in set(m["quarter"] for m in monthly_summary.values()):
            quarter_summary[quarter] = {
                "gross_income": quarter_totals[f"{quarter}_gross"],
                "total_deductions": quarter_totals[f"{quarter}_deductions"],
                "net_income": quarter_totals[f"{quarter}_net"]
            }

        return {
            "fullName": full_name,
            "employmentType": user.get("employment_type", "regular"),
            "salaryGrade": user.get("salary_grade", ""),
            "monthlySummary": monthly_summary,
            "quarterSummary": quarter_summary,  # still useful for charts
            "incomeBreakdown": dict(income_breakdown),
            "deductionBreakdown": dict(deduction_breakdown),
            "totals": {
                "gross_income": total_gross,
                "total_deductions": total_deductions,
                "net_income": total_net
            },
            "months": month_list
        }

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        if 'connection' in locals() and connection.is_connected():
            cursor.close()
            connection.close()
