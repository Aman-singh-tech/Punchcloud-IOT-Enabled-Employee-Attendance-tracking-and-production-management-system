# PunchCloud — Client Demo Script

## Setup (Demo Se 10 Min Pehle)

**3 alag terminal tabs kholo** (VS Code mein `Ctrl+Shift+\`` se naya tab, ya "+" button):

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
- `http://localhost:5173` (Admin)
- `http://localhost:5174` (Self-Service)

**Login credentials (sab ka password: `Password123!`):**

| Email | Role |
|---|---|
| `hr@punchcloud.dev` | HR (production entry, attendance, payroll, disbursement — sab kuch) |
| `asha.rao@punchcloud.dev` | Employee (Fixed-Salary) |
| `ravi.kumar@punchcloud.dev` | Employee (Piece-Rate) |

---

## Part A — Concept Samjhao (Computer Chhune Se Pehle, 2 Min)

> "Ye system 4 steps mein kaam karta hai: **Employee punch karta hai machine pe → System khud attendance calculate karta hai → HR production entry karta hai (data-entry workers ke liye) → Mahine ke end mein system khud payroll calculate kar deta hai.** Koi Excel nahi, koi manual calculation nahi."

> "Do tarah ke employees hote hain: **Piece-Rate** (data entry operators — jitna kaam accept hua utna paisa, attendance ka koi lena-dena nahi) aur **Fixed-Salary** (office staff — mahine ki salary sirf present days ke proportion mein). OT kisi ko paid nahi hota."

> "Piece-rate wale ki attendance record to hoti hai, lekin sirf HR ki jaankari ke liye — uski salary sirf pieces se banti hai. Aur fixed-salary wale agar pieces banaye, wo sirf company ke total production mein judte hain, uski salary mein nahi."

---

## Part B — Live Demo (Step-by-Step)

### 1. Admin Dashboard — Today's Attendance
`localhost:5173` → HR login → **"Today's Attendance"** dikhao.

### 2. LIVE Punch Karo
Terminal 4 (ek aur naya terminal, ya Terminal 2/3 ke beech mein) mein:
```bash
cd "C:\Users\Aman Singh\OneDrive\Desktop\TEMP\PunchCloud\backend"
pnpm mock:punch -- --employee=BIO-0001 --direction=IN
```
Dashboard refresh karo — Asha Rao ka naya punch time turant dikhega. Bolo: *"Ye real machine se bhi bilkul aise hi aayega."*

### 3. Naya Employee LIVE Add Karo
**"Employees" → "+ New Employee"** — client ke saamne ek naya employee banao. **Pay Type toggle** dikhao (Piece-Rate select karo to sirf rate field dikhega, Fixed-Salary karo to sirf salary field). Save karte hi ek **temporary password** dikhega — bolo: *"HR isi tarah naye employee ka login bhi turant bana deta hai."*

### 4. Attendance History Dikhao
**"Attendance Report"** → Asha Rao select karo → poora August ka record dikhao (Present/Absent/Off/On Leave colored status ke saath). Bolo: *"Poore mahine ka record automatically bana hai — Sunday aur company holiday dono 'Off' dikhte hain, absent nahi."*

### 5. Production Dikhao
**"Production Report"** → Ravi Kumar ka poore mahine ka Produced/Accepted/Rejected data + rejection-rate chart.

### 6. Self-Service App Dikhao (Doosri Browser Tab)
`localhost:5174` → Ravi Kumar se login:
- Naya polished UI dikhao (gradient login, icons wala bottom nav)
- "This Period" production card dikhega
- Asha Rao se alag tab mein login karo — dikhao **"Production" tab hai hi nahi** uske liye (conditional UI proof)
- Asha se **"Apply for Leave"** pe click karo, ek din ki leave apply karo

### 7. Leave Approval (Wapas Admin)
**"Leave Approvals"** → approve karo. **"Attendance"** mein wo din turant **"On Leave"** dikhega, Leave Balance automatically kam hoga.

> "Leave ka record rakha jaata hai taaki HR ko pata rahe employee kyun nahi aaya — lekin **leave ka paisa nahi milta**. Salary sirf present days ki banti hai."

### 8. Correction/Dispute Dikhao (Optional)
**"Corrections"** queue pe jao — dikhao ki agar employee "forgot to punch out" jaisi dispute raise kare, to wo yahan aati hai approval ke liye.

---

## Part C — **Payroll Generate Karo (Sabse Bada Moment)**

**"Generate Payroll"** → Month=8, Year=2026 → **Generate** dabao. **"Payroll Records"** pe dono payslips khol ke dikhao.

### 🔹 Ravi Kumar (Piece-Rate) — Formula: `Accepted Pieces × Rate`

> "Is mahine Ravi ne total **2486 pieces accept** karwaye, rate ₹1/piece hai. System ne calculate kiya: **2486 × ₹1 = ₹2,486**. Attendance ka isme koi role nahi — chahe wo kabhi absent hua ho, uske accepted pieces pe koi asar nahi."

*(Paper/whiteboard pe likho: `2486 × ₹1 = ₹2,486` — payslip pe wahi number dikhao, client khud verify kar lega)*

### 🔹 Asha Rao (Fixed-Salary) — Formula: `Present Days / Working Days × Salary`

> "August mein **26 working days** the (31 din minus 5 Sunday). Asha **24 din present** thi, **2 din absent**. System ne calculate kiya:
> **24 / 26 × ₹25,000 = ₹23,076.92**"

*(Ye number **poori salary nahi hai** — isse dikhta hai ki system sach mein absent days ke liye kaat raha hai, hamesha full salary nahi de raha)*

**OT ka point:** Asha ke payslip pe **240 OT minutes** likhe hain, lekin uske paise nahi jude.
> "OT kisi ko bhi paid nahi hota — na fixed-salary wale ko, na piece-rate wale ko. Record isliye rakha jaata hai taaki HR ko pata rahe kaun kitna ruk raha hai, lekin salary attendance se hi banti hai."

**Off days ka point:** payslip pe **5 Off days** bhi dikhte hain (Sundays).
> "Sunday ya company holiday — dono 'Off' hain. Ye din working days mein ginte hi nahi, isliye fixed-salary wale ka in dino ka paisa **nahi katta**. Piece-rate wale ka us din koi kaam nahi to koi paisa nahi — automatic."

### 🔹 Finalize + Disbursement
**"Finalize"** dabao dono payslips pe. Wahi HR login se **"Disbursement File"** pe jao aur CSV download karo — dikhao ki dono ka net pay (₹2,486 + ₹23,076.92) ek bank-ready file mein hai (ek hi HR account se sab kuch access hota hai — alag Finance ya Admin login ki zaroorat nahi).

---

## Part D — Security Proof (Bonus, Bahut Impressive)

Ravi Kumar (Employee) se login karke Asha ka payslip URL directly access karne ki koshish karo — **403 Forbidden** milega:
> "Har employee sirf apna hi data dekh sakta hai — koi doosre ka nahi, chahe wo URL seedha type kare."

---

## Agar Kuch Crash Ho Jaye Demo Ke Beech

1. Backend wali Terminal 1 dekho — agar error dikhe, `pnpm start:prod` dobara chala do (10-15 sec mein wapas up)
2. `pnpm mock:punch` "connection refused" de raha ho → matlab Terminal 1 chal nahi raha, use check/restart karo
3. **Kabhi Terminal 1 mein doosra command mat type karna** — wo hamesha `start:prod` chalata rehna chahiye; nayi command ke liye naya terminal tab kholo

---

## Zaroori Reminder

Ye demo data (poore August ka attendance/production) ek **one-time script se pehle se bhara gaya hai** taaki numbers realistic dikhein — real deployment mein ye data roz punch machine aur supervisor se aayega, is script se nahi.
