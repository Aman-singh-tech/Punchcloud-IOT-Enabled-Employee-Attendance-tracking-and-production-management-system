# PunchCloud — Client Demo Script

## Setup (Demo Se 10 Min Pehle)

**3 alag terminal tabs kholo:**

**Terminal 1 — Backend (chhedna mat, hamesha khula rakhna):**
```bash
cd "C:\Users\Aman Singh\OneDrive\Desktop\TEMP\PunchCloud\backend"
pnpm build
pnpm start:prod
```
Confirm: `PunchCloud API listening on port 3000` dikhna chahiye.

**Terminal 2 — Admin Dashboard:**
```bash
cd "C:\Users\Aman Singh\OneDrive\Desktop\TEMP\PunchCloud\frontend\admin-dashboard"
pnpm dev
```

**Terminal 3 — Self-Service:**
```bash
cd "C:\Users\Aman Singh\OneDrive\Desktop\TEMP\PunchCloud\frontend\self-service"
pnpm dev
```

**Browser mein 2 tabs khol lo:**
- `http://localhost:5173` (Admin — HR)
- `http://localhost:5174` (Self-Service — Employee)

**Login credentials (sab ka password: `Password123!`):**

| Email | Kaun |
|---|---|
| `hr@punchcloud.dev` | HR — ek hi login se sab kuch (employees, attendance, production, payroll, disbursement, shifts) |
| `asha.rao@punchcloud.dev` | Employee (Fixed-Salary) |
| `ravi.kumar@punchcloud.dev` | Employee (Piece-Rate) |

---

## Part A — Concept Samjhao (Computer Chhune Se Pehle, 2 Min)

> "Ye system 4 steps mein kaam karta hai: **Employee punch karta hai machine pe → System khud attendance calculate karta hai (late/half-day rule ke saath) → HR production entry karta hai (data-entry workers ke liye) → Mahine ke end mein system khud payroll calculate kar deta hai.** Koi Excel nahi, koi manual calculation nahi."

> "Do tarah ke employees hote hain: **Piece-Rate** (data entry operators — jitna kaam accept hua utna paisa, attendance ka koi lena-dena nahi) aur **Fixed-Salary** (office staff — mahine ki salary sirf present days ke proportion mein). OT kisi ko paid nahi hota, leave ka bhi paisa nahi milta — attendance hi salary decide karti hai."

> "Piece-rate wale ki attendance record hoti hai, lekin sirf HR ki jaankari ke liye — uski salary sirf pieces se banti hai. Fixed-salary wale agar pieces banaye, wo sirf company ke total production mein judte hain, uski salary mein nahi."

---

## Part B — Live Demo (Step-by-Step)

### 1. Admin Dashboard — Company Overview
`localhost:5173` → HR login → seedha **Company Overview** dashboard khulega.

> "Ye dashboard company ka poora health ek nazar mein dikhata hai — last 6 mahine ka production aur salary cost trend, aaj kitne log present/absent hain, rejection rate. Har 30 second mein khud refresh hota hai."

### 2. LIVE Punch Karo
Terminal 4 (naya terminal) mein:
```bash
cd "C:\Users\Aman Singh\OneDrive\Desktop\TEMP\PunchCloud\backend"
pnpm mock:punch -- --employee=BIO-0001 --direction=IN
```
**"Attendance"** page kholo, Asha Rao select karo — naya punch time turant dikhega. Bolo: *"Ye real machine se bhi bilkul aise hi aayega."*

### 3. Naya Employee LIVE Add Karo
**"Employees" → "+ New Employee"** — client ke saamne ek naya employee banao.
- **Shift** dropdown dikhao — bolo: *"Ye decide karta hai employee ka office time kya hai, aur late kab ginega."*
- **Pay Type toggle** dikhao (Piece-Rate select karo to sirf rate field dikhega, Fixed-Salary karo to sirf salary field)
- Save karte hi ek **temporary password** dikhega — bolo: *"HR isi tarah naye employee ka login bhi turant bana deta hai."*

### 4. Late-Comer Rule Samjhao
**"Late Comers"** report kholo — jo log late aaye unki list dikhegi.

> "Har employee ko mahine mein **4 din late aane ki chhoot** hai — 15 minute se zyada late ho to wahi din late gina jaata hai. 4 din tak poori salary milti hai. **5th late din se** us din **Half-day** lag jaata hai — matlab aadhe din ki salary kat jaati hai. Ye rule **Settings → Shifts** page se HR khud set/badal sakta hai."

### 5. Attendance History Dikhao
**"Attendance Report"** → Asha Rao select karo → poora August ka record dikhao (Present/Absent/Off/On Leave colored status ke saath).

> "Sunday aur company holiday dono 'Off' dikhte hain, Absent nahi — aur Off din ka salary pe koi negative asar nahi hota."

### 6. Production Dikhao
**"Production Report"** → upar employee dropdown se Ravi Kumar filter karo → poore mahine ka Produced/Accepted/Rejected data + rejection-rate chart.

### 7. Self-Service App Dikhao (Doosri Browser Tab)
`localhost:5174` → Ravi Kumar se login:
- "This Period" production card dikhega
- Asha Rao se alag tab mein login karo — dikhao **"Production" tab hai hi nahi** uske liye (conditional UI proof)
- Asha se **"Apply for Leave"** pe click karo, ek din ki leave apply karo (koi leave-type choose nahi karna padta — sab automatically "Unpaid" hai, kyunki company paid leave deti hi nahi)

### 8. Notification Bell Dikhao (Naya, Impressive Moment)
Turant **wapas Admin tab** pe jao — **bell icon** pe laal badge "1" dikhega, bina refresh kiye (har 20 second khud check karta hai).

> "Jaise hi employee kuch bhi karta hai — leave maange, to HR ko turant pata chal jaata hai, app ke andar hi. Koi email ki zaroorat nahi."

Bell pe click karo → notification pe click karo → seedha **Leave Approvals** page khul jaata hai.

### 9. Leave Approval
**"Leave Approvals"** → Approve dabao. Wapas self-service (Ravi/Asha) tab pe jao aur uska bell bhi check karo — usko turant "approved" ka notification milega.

> "Leave ka record rakha jaata hai taaki HR ko pata rahe employee kyun nahi aaya — lekin **leave ka paisa nahi milta**. Salary sirf present days ki banti hai, chahe leave li ho ya bina bataye absent hua ho."

---

## Part C — **Payroll Generate Karo (Sabse Bada Moment)**

**"Generate Payroll"** → Month=8, Year=2026 → **Generate** dabao. **"Payroll Records"** pe dono payslips khol ke dikhao.

### 🔹 Ravi Kumar (Piece-Rate) — Formula: `Accepted Pieces × Rate`

> "Is mahine Ravi ne total **~2,486 pieces accept** karwaye, rate ₹1/piece hai. System ne calculate kiya: **2,486 × ₹1 = ₹2,486**. Attendance ka isme koi role nahi — chahe wo kabhi absent hua ho, late aaya ho, uske accepted pieces pe koi asar nahi."

*(Paper/whiteboard pe likho: `2,486 × ₹1 = ₹2,486` — payslip pe wahi number dikhao, client khud verify kar lega)*

### 🔹 Asha Rao (Fixed-Salary) — Formula: `Present Days / Working Days × Salary`

> "August mein **26 working days** the (31 din minus 5 Sunday). Asha **24 din present** thi, **2 din absent**. System ne calculate kiya:
> **24 / 26 × ₹25,000 = ₹23,076.92**"

*(Ye number **poori salary nahi hai** — isse dikhta hai ki system sach mein absent days ke liye kaat raha hai, hamesha full salary nahi de raha)*

**OT ka point:** payslip pe OT minutes record hote hain, par paisa nahi jodta.
> "OT kisi ko bhi paid nahi hota — na fixed-salary wale ko, na piece-rate wale ko. Record isliye rakha jaata hai taaki HR ko pata rahe kaun kitna ruk raha hai, lekin salary attendance se hi banti hai."

**Off days ka point:** payslip pe Weekly Off Days bhi dikhte hain (Sundays).
> "Sunday ya company holiday — dono 'Off' hain. Ye din working days mein ginte hi nahi, isliye fixed-salary wale ka in dino ka paisa **nahi katta**."

### 🔹 Finalize + Disbursement
**"Finalize"** dabao dono payslips pe — bolo: *"Ye button ek baar dabne ke baad payslip lock ho jaati hai, dobara automatically recalculate nahi hogi."* Wahi HR login se **"Disbursement File"** pe jao aur CSV download karo — dikhao ki dono ka net pay (₹2,486 + ₹23,076.92) ek bank-ready file mein hai (ek hi HR account se sab kuch access hota hai — alag Finance ya Admin login ki zaroorat nahi).

---

## Part D — Security Proof (Bonus, Bahut Impressive)

Ravi Kumar (Employee) se login karke Asha ka payslip URL directly access karne ki koshish karo — **403 Forbidden** milega:
> "Har employee sirf apna hi data dekh sakta hai — koi doosre ka nahi, chahe wo URL seedha type kare."

---

## Agar Client Poochhe: "Holiday kaise add karenge?"

**Settings → Shifts** page ke neeche **"Festival Holidays"** section hai — Diwali/Holi date daalo, wo din bhi "Off" ban jaayega, sabki salary pe koi negative asar nahi hoga.

## Agar Kuch Crash Ho Jaye Demo Ke Beech

1. Backend wali Terminal 1 dekho — agar error dikhe, `pnpm start:prod` dobara chala do (10-15 sec mein wapas up)
2. `pnpm mock:punch` "connection refused" de raha ho → matlab Terminal 1 chal nahi raha, use check/restart karo
3. **Kabhi Terminal 1 mein doosra command mat type karna** — wo hamesha `start:prod` chalata rehna chahiye; nayi command ke liye naya terminal tab kholo

---

## Zaroori Reminder

Ye demo data (poore August ka attendance/production) ek **one-time script se pehle se bhara gaya hai** taaki numbers realistic dikhein — real deployment mein ye data roz punch machine aur HR se aayega, is script se nahi.
