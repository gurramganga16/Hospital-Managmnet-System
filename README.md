# MediSync Hospital Management System (HMS)

MediSync is a full-stack, enterprise-grade Hospital Management System designed for acute care, general hospitals, outpatient departments, and specialized medical centers.

---

## 1. Core Architecture & Technology Stack

- **Frontend Application**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React, Recharts
- **Relational Data Engine**: 34+ normalized entities (Patients, Staff, Appointments, Consultations, Vitals, Prescriptions, Medicines, Batches, Inventory Transactions, Lab Tests, Lab Orders, Wards, Beds, Admissions, Invoices, Payments, Insurance Claims, Audit Logs)
- **Role-Based Access Control (RBAC)**: 9 distinct user roles with fine-grained access control
- **Security & Integrity**:
  - Atomic bed allocations and transfers
  - Pharmacy negative-stock prevention and expiration checks
  - Automatic BMI and physiological category indexer
  - Complete, immutable audit log for clinical and financial events
  - OpenAPI 3.0 / Swagger API specification (`/docs/swagger.json`)

---

## 2. Seed Accounts & 1-Click Role Switcher

You can test any role instantly using the **Role Switcher dropdown** in the top navigation bar, or log in using any of the pre-configured accounts:

| Role | Name | Email | Default Focus Area |
| :--- | :--- | :--- | :--- |
| **Super Admin** | Dr. Arthur Vance | `admin@hospital.com` | System config, user RBAC, audit trails |
| **Hospital Admin** | Sarah Jenkins, MHA | `hospital.admin@hospital.com` | Operations, wards, departments, finances |
| **Doctor** | Dr. Marcus Chen, MD | `doctor.chen@hospital.com` | Appointments, EMR, prescriptions, lab orders |
| **Doctor** | Dr. Elena Rostova, MD | `doctor.rostova@hospital.com` | Neurology consultations, medical records |
| **Nurse** | Nurse Clara Barton, BSN | `nurse.barton@hospital.com` | Vitals recording, bedside care, triage |
| **Receptionist** | Emily Thorne | `reception@hospital.com` | Patient registration, scheduling, check-in |
| **Pharmacist** | Robert Zhao, PharmD | `pharmacy@hospital.com` | Prescriptions, batch dispensing, stock alerts |
| **Lab Technician** | Kevin Miller, MLS | `lab@hospital.com` | Diagnostic orders, specimen analysis, abnormal flags |
| **Accountant** | Linda Morales, CPA | `accounts@hospital.com` | Billing, payments, receipts, insurance claims |
| **Patient** | John Doe | `patient@hospital.com` | Personal portal, appointments, lab results, bills |

---

## 3. Implemented Modules & Workflows

### A. Patient Directory & 360° Profile
- Automatic generation of unique patient IDs (`PAT-2025-001`)
- Demographics, emergency contacts, blood group, chronic conditions, and allergy warnings
- 360° Drawer with sub-tabs for Vitals History, Appointments, Prescriptions, Lab Results, Inpatient Stays, and Billing Statements

### B. Appointments & Queue Scheduling
- Scheduling with automatic conflict detection if the chosen doctor is already booked at that slot
- Real-time queue numbering (`#Q1`, `#Q2`, etc.)
- 1-click status transitions: `Scheduled` -> `Confirmed` -> `Checked-in` -> `In Consultation` -> `Completed`

### C. Electronic Medical Records (EMR)
- Encounter recording with Chief Complaints, Symptoms, Physical Examination Findings, and Management Plans
- ICD-10 diagnostic coding support (`I10`, `E11.9`, `J20.9`)
- Vital signs recording with automatic BMI calculation and risk stratification (`Underweight`, `Normal`, `Overweight`, `Obese`)
- Direct cross-module dispatch to Pharmacy and Laboratory

### D. Pharmacy & Stock Inventory
- Prescription queue with item-level tracking (`quantityPrescribed` vs `quantityDispensed`)
- Strict negative-stock prevention: will not dispense beyond available batch quantity
- Batch expiration safeguard: blocks dispensing from expired batches
- Real-time inventory movement log (`Purchase`, `Dispense`, `Adjustment`)
- Printable official prescription document with physician signature block

### E. Laboratory Management (LIS)
- Test catalog with normal biological reference ranges and pricing
- Order workflow: `Ordered` -> `Sample Collected` -> `Processing` -> `Completed`
- Measured value input with automatic or technician flag indicators (`Normal`, `High`, `Low`, `Critical`)
- Printable certified laboratory report with hospital pathology header

### F. Inpatient & Bed Management
- Live interactive visual bed grid across ICU, Surgical, General Medical, Maternity, and Pediatric wards
- Color-coded statuses: Available (Green), Occupied (Blue), Maintenance (Amber), Reserved (Purple)
- Atomic admission workflow linking bed to patient
- Bed-to-bed transfers with recorded transfer reason
- Clinical discharge workflow with discharge summary and automatic bed availability release

### G. Billing & Financial Accounting
- Itemized invoice creation for consultations, bed nights, pharmacy items, and lab tests
- Automated calculation of subtotal, discounts, and healthcare taxes (5%)
- Payment recording supporting Cash, Card, UPI, Bank Transfer, and Insurance Copay
- Partial payments support with live balance due tracking
- Printable patient billing invoice & receipt

### H. Patient Portal
- Dedicated self-service interface for patients to review upcoming visits, prescribed medications with frequency/duration instructions, lab test results, and billing receipts

### I. System Administration & Audit Trail
- Comprehensive audit log tracking user identity, role, action, target entity, details, and timestamp
- User account activation/deactivation and role reassignments

---

## 4. Local Installation & Docker Setup

### Prerequisites
- Node.js 20+
- npm 10+
- Docker & Docker Compose (optional for containerized deployment)

### Development Setup
```bash
# 1. Install dependencies
npm install

# 2. Copy environment file
cp .env.example .env

# 3. Start development server on port 3000
npm run dev
```

### Docker Deployment
```bash
# Run multi-container stack with PostgreSQL
docker compose up --build -d
```

---

## 5. Automated Verification & Testing

Execute test suits via:
```bash
npm test
```
Or check TypeScript types with:
```bash
npm run lint
```