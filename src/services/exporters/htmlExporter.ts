import * as fs from 'fs';
import { GeneratedQuestionPaper } from '../../types';

export function exportToHtml(paper: GeneratedQuestionPaper, outputPath: string, includeSolutions = true): void {
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${paper.title}</title>
  <!-- KaTeX CSS for math rendering -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">
  
  <style>
    :root {
      --primary: #1e3a8a;
      --text: #1f2937;
      --bg: #ffffff;
      --border: #e5e7eb;
      --accent: #f3f4f6;
    }

    body {
      font-family: 'Outfit', sans-serif;
      color: var(--text);
      background-color: var(--bg);
      line-height: 1.6;
      margin: 0;
      padding: 40px;
    }

    .container {
      max-width: 800px;
      margin: 0 auto;
    }

    header {
      text-align: center;
      border-bottom: 2px double var(--primary);
      padding-bottom: 20px;
      margin-bottom: 30px;
    }

    header h1 {
      color: var(--primary);
      margin: 0 0 10px 0;
      font-size: 28px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .meta-info {
      display: flex;
      justify-content: space-around;
      flex-wrap: wrap;
      background-color: var(--accent);
      padding: 10px;
      border-radius: 6px;
      margin-bottom: 30px;
      font-size: 14px;
      font-weight: 600;
    }

    .meta-item {
      margin: 5px 15px;
    }

    .instructions {
      border: 1px solid var(--border);
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 40px;
      background-color: #fafafa;
    }

    .instructions h3 {
      margin-top: 0;
      color: var(--primary);
      border-bottom: 1px solid var(--border);
      padding-bottom: 8px;
    }

    .instructions ul {
      margin: 0;
      padding-left: 20px;
    }

    .instructions li {
      margin-bottom: 8px;
      font-size: 14px;
    }

    .question-card {
      margin-bottom: 35px;
      page-break-inside: avoid;
    }

    .question-header {
      font-weight: 600;
      font-size: 16px;
      margin-bottom: 12px;
      display: flex;
    }

    .q-number {
      margin-right: 10px;
      color: var(--primary);
    }

    .q-text {
      flex: 1;
    }

    .options-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      padding-left: 28px;
    }

    @media (max-width: 600px) {
      .options-grid {
        grid-template-columns: 1fr;
      }
    }

    .option-item {
      border: 1px solid var(--border);
      padding: 10px 15px;
      border-radius: 6px;
      background-color: #fff;
      display: flex;
      align-items: center;
    }

    .opt-key {
      font-weight: 700;
      color: var(--primary);
      margin-right: 10px;
    }

    .page-break {
      page-break-before: always;
      margin-top: 60px;
      border-top: 2px dashed var(--border);
      padding-top: 40px;
    }

    .key-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }

    .key-table th, .key-table td {
      border: 1px solid var(--border);
      padding: 12px;
      text-align: left;
    }

    .key-table th {
      background-color: var(--primary);
      color: white;
    }

    .solution-item {
      margin-bottom: 30px;
      border-bottom: 1px solid var(--border);
      padding-bottom: 20px;
    }

    .sol-header {
      font-weight: 600;
      color: var(--primary);
      margin-bottom: 8px;
    }

    /* Print-specific layout optimization */
    @media print {
      body {
        padding: 0;
      }
      .container {
        max-width: 100%;
      }
      .instructions {
        background-color: transparent;
      }
      .option-item {
        background-color: transparent;
      }
      @page {
        size: A4;
        margin: 20mm;
      }
    }
  </style>

  <!-- KaTeX JavaScript components for math auto-rendering -->
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js"
    onload="renderMathInElement(document.body, {
      delimiters: [
        {left: '$$', right: '$$', display: true},
        {left: '\\\\(', right: '\\\\)', display: false},
        {left: '\\\\[', right: '\\\\]', display: true}
      ],
      throwOnError: false
    });">
  </script>
</head>
<body>
  <div class="container">
    <header>
      <h1>${paper.title}</h1>
    </header>

    <div class="meta-info">
      ${paper.subject ? `<div class="meta-item">Subject: ${paper.subject.toUpperCase()}</div>` : ''}
      ${paper.chapter ? `<div class="meta-item">Chapter: ${paper.chapter}</div>` : ''}
      <div class="meta-item">Questions: ${paper.totalQuestions}</div>
      <div class="meta-item">Time: ${paper.totalTimeMinutes} Minutes</div>
    </div>

    <div class="instructions">
      <h3>General Instructions</h3>
      <ul>
        ${paper.instructions.map(ins => `<li>${ins}</li>`).join('')}
      </ul>
    </div>

    <main class="questions-section">
      ${paper.questions.map(q => `
        <div class="question-card">
          <div class="question-header">
            <span class="q-number">Q${q.index}.</span>
            <span class="q-text">${q.questionText}</span>
          </div>
          <div class="options-grid">
            ${q.options.map(opt => `
              <div class="option-item">
                <span class="opt-key">${opt.key}.</span>
                <span class="opt-text">${opt.text}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('')}
    </main>

    ${includeSolutions ? `
    <!-- Answer Key & Solutions Section (placed on a separate page for printing/distribution) -->
    <section class="page-break">
      <h2 style="color: var(--primary); text-align: center; border-bottom: 2px solid var(--primary); padding-bottom: 10px;">Answer Key & Detailed Solutions</h2>
      
      <h3 style="margin-top: 30px;">Quick Answer Key</h3>
      <table class="key-table">
        <thead>
          <tr>
            <th>Question No.</th>
            <th>Correct Option</th>
          </tr>
        </thead>
        <tbody>
          ${paper.answerKey.map(item => `
            <tr>
              <td>Q${item.index}</td>
              <td style="font-weight: bold; color: var(--primary);">${item.correctOption}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <h3 style="margin-top: 40px;">Detailed Solutions</h3>
      ${paper.answerKey.map(item => `
        <div class="solution-item">
          <div class="sol-header">Q${item.index} Solution (Correct Option: ${item.correctOption})</div>
          <div>${item.solutionText}</div>
        </div>
      `).join('')}
    </section>
    ` : ''}
  </div>
</body>
</html>
  `;

  fs.writeFileSync(outputPath, htmlContent, 'utf8');
}
