# ASR Entrance Academy - Question Import Instructions

This guide explains how to import multiple-choice questions (MCQs) into the ASR Entrance Academy database.

---

## 1. Setup & Requirements

Ensure that you have installed all dependencies and synced the database schema:
```bash
npm install
npx prisma db push
```

---

## 2. JSON Format Schema

The import script accepts a JSON file containing either a single question object or an array of question objects. Each question object must conform to the following schema:

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `subject` | String | Yes | Must be one of: `"physics"`, `"chemistry"`, `"maths"`. |
| `chapter` | String | Yes | Name of the chapter (e.g., `"Electrostatics"`, `"Calculus"`). |
| `topic` | String | No | Optional sub-topic/concept name. |
| `difficulty` | String | No | Optional difficulty level: `"easy"`, `"medium"`, `"hard"`. |
| `exams` | Array of Strings | No | Array of exams the question belongs to (e.g., `["JEE Main", "KEAM"]`). |
| `question_text` | String | Yes | The question content. Supports Markdown & LaTeX math notation `\( ... \)` and `$$ ... $$`. |
| `options` | Object | Yes | Must contain exactly 4 keys: `"A"`, `"B"`, `"C"`, and `"D"`. |
| `correct_option` | String | Yes | Must be one of: `"A"`, `"B"`, `"C"`, `"D"`. |
| `solution_text` | String | Yes | Detailed explanation or step-by-step solution. Supports LaTeX. |

---

## 3. Example JSON File

Create a file named `my_questions.json` (or edit `samples/sample_questions.json`) with contents like this:

```json
[
  {
    "subject": "physics",
    "chapter": "Electrostatics",
    "topic": "Coulomb's Law",
    "difficulty": "medium",
    "exams": ["JEE Main", "KEAM"],
    "question_text": "Two point charges \\(q_1 = +2\\,\\mu\\text{C}\\) and \\(q_2 = -6\\,\\mu\\text{C}\\) are separated by a distance of \\(3\\,\\text{m}\\) in vacuum. What is the magnitude of the electrostatic force between them?",
    "options": {
      "A": "\\(1.2 \\times 10^{-2}\\,\\text{N}\\)",
      "B": "\\(1.2 \\times 10^{-3}\\,\\text{N}\\)",
      "C": "\\(3.6 \\times 10^{-2}\\,\\text{N}\\)",
      "D": "\\(3.6 \\times 10^{-3}\\,\\text{N}\\)"
    },
    "correct_option": "A",
    "solution_text": "Using Coulomb's law: \\(F = k \\frac{|q_1 q_2|}{r^2}\\). Given \\(k = 9 \\times 10^9\\,\\text{N m}^2/\\text{C}^2\\), the result is \\(1.2 \\times 10^{-2}\\,\\text{N}\\)."
  }
]
```

> [!NOTE]
> Backslashes (`\`) inside JSON strings must be escaped as double backslashes (`\\`) so they parse correctly (e.g. write `\\( ... \\)` instead of `\( ... \)`).

---

## 4. Run the Import Command

To import the questions into your local SQLite database:

```bash
npm run import <path_to_json_file>
```

**Example:**
```bash
npm run import samples/sample_questions.json
```

---

## 5. Duplicate Detection & Handling

To keep the database clean, the import script checks for duplicates before inserting:
- If a question with the exact same `question_text`, `subject`, and `chapter` already exists, it is **skipped** automatically.
- A summary of imported, skipped, and failed questions will be displayed in the terminal upon completion.

---

## 6. Bulk Import from Folder (with Tracking)

You can import all `.json` files within a folder in one command. The system tracks successfully imported files in a database table called `ImportedFile` so they will not be re-processed on subsequent runs.

### Command Syntax:
```bash
npm run bulk-import <path_to_folder>
```

### How tracking works:
1. When you run `npm run bulk-import`, it scans the target folder for all files ending in `.json`.
2. For each file, it checks the database using the absolute file path.
3. If the file is recorded as already imported, it **skips** processing that file entirely.
4. If it's a new file, the script parses and imports its questions (handling individual question duplicate checks inside), and then saves the file's path to the database.
5. If a file fails to parse or fails to import structurally, it is not marked as imported, allowing you to fix the file and run again.

---

## 7. Inspecting Questions in the Database

You can visually inspect, filter, search, and edit the questions that have been imported into the SQLite database.

### Running Prisma Studio:
Run the following command in your terminal:
```bash
npm run db:studio
```

### Accessing the Web UI:
1. Once running, open your browser and navigate to: **[http://localhost:5555](http://localhost:5555)**.
2. Select the **`Question`** model table to browse the full list of imported questions, their options, and answers.
3. Select the **`ImportedFile`** model table to view the list of files successfully processed and skipped on bulk imports.

---

## 8. Generating Question Papers

You can compile professional practice question papers and answer keys directly from the database questions.

### Running the Interactive Generator CLI:
Run the following command in your terminal:
```bash
npm run generate-interactive
```

### Prompt Details:
1. **Subject Selection**: Select a specific subject (e.g., Physics, Chemistry, Maths) or select "All".
2. **Chapter Selection**: Dynamically shows only the chapters corresponding to the selected subject. Select a chapter or "All".
3. **Exam Target**: Filter questions by a specific target exam (e.g., NEET, JEE Main, KEAM) or select "All".
4. **Configuration**: Set the number of questions, positive marks, negative marks, and allowed time per question.
5. **Output Format**:
   - **Microsoft Word (.docx)**: Generates a formatted Word document, perfect for editing or converting to PDF.
   - **HTML (Printable PDF)**: Generates a web page that renders all mathematical and chemical formulas using KaTeX, ready to print to PDF from your browser.

