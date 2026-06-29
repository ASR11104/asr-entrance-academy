# ASR Entrance Academy - Question Bank & Paper Generator

A lightweight, local command-line application to import multiple-choice question banks (MCQs) for subjects like Physics, Chemistry, and Mathematics (e.g., for NEET, JEE Main, KEAM) and compile professional, print-ready question papers.

---

## 🚀 Features

- **Local SQLite Database**: Powered by **Prisma ORM** for lightweight, robust local storage.
- **Bulk Question Import**: Scans folders for JSON files, parses and validates inputs (using Zod schemas), and prevents duplicate entries.
- **Import History Registry**: Automatically tracks processed files in the database so subsequent folder scans skip previously processed files.
- **LaTeX Math Rendering**: Supports high-fidelity formula display (KaTeX auto-render) for HTML exports.
- **MS Word (.docx) Compilation**: Generates professional Word documents featuring dual-column layouts for MCQ options and page-broken solutions.
- **Interactive CLI Generator**: Prompts for subject, chapter, exam target, markings, timing, and format specifications directly based on database records.
- **Dual Handout Mode**: Every run compiles two documents:
  1. A **Full Handout**: Questions + Answer Key + Detailed Solutions.
  2. A **Questions-Only Handout**: Questions only (perfect for conducting tests).
- **Subject-Based Nesting**: Saves generated files in subject-based subfolders under `question_papers/`.

---

## 🛠️ Technology Stack

- **Core**: Node.js & TypeScript
- **Database**: SQLite & Prisma ORM
- **CLI Prompts**: Inquirer
- **Document Exporter**: Docx (Microsoft Word compilation)
- **Math Rendering**: KaTeX (HTML/CSS)
- **Validation**: Zod (Schema validation)

---

## ⚙️ Getting Started

### 1. Prerequisites
Ensure you have **Node.js** (v20+) and **npm** installed.

### 2. Installation
Clone the repository and install dependencies:
```bash
npm install
```

### 3. Database Initialization
Synchronize the SQLite database with the Prisma schema:
```bash
npx prisma db push
```

---

## 📖 How to Run

### Import Questions
Import a single JSON file of questions:
```bash
npm run import <path_to_json_file>
```
*Example:*
```bash
npm run import samples/sample_questions.json
```

---

### Bulk Import from Folder
Import all `.json` files within a folder (skips already processed files):
```bash
npm run bulk-import <path_to_folder>
```
*Example:*
```bash
npm run bulk-import samples/bulk
```

---

### Inspect Database Visually
Launch Prisma Studio to search, filter, and edit questions in your browser:
```bash
npm run db:studio
```
Then navigate to: **[http://localhost:5555](http://localhost:5555)**.

---

### Generate Question Papers (Interactive CLI)
Launch the interactive compiler wizard:
```bash
npm run generate-interactive
```
The wizard will guide you through:
1. Selecting **Subject** & **Chapter** (dynamically loaded from database).
2. Selecting **Target Exam** (NEET, JEE Main, KEAM, or All).
3. Configuring question counts, time bounds, and positive/negative markings.
4. Exporting to **Microsoft Word (.docx)** or **HTML (Printable PDF)**.

Generated files will be saved in `question_papers/<subject>/` with current timestamps.

---

## 📝 JSON Question Format Schema
Refer to [IMPORT_INSTRUCTIONS.md](file:///Users/akhilsr/Developer/gitrepos/asr-entrance-academy/IMPORT_INSTRUCTIONS.md) for detailed JSON schemas, escaping LaTeX math notation, and import validation rules.
