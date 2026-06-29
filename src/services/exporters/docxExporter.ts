import * as fs from 'fs';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  HeadingLevel,
  PageBreak,
  WidthType,
  BorderStyle,
} from 'docx';
import { GeneratedQuestionPaper } from '../../types';

export async function exportToDocx(paper: GeneratedQuestionPaper, outputPath: string, includeSolutions = true): Promise<void> {
  const children: any[] = [];

  // 1. Header
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: paper.title.toUpperCase(),
          bold: true,
          size: 32, // 16pt
          color: '1e3a8a',
        }),
      ],
    })
  );

  // Divider line
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
      border: {
        bottom: {
          color: '1e3a8a',
          space: 4,
          style: BorderStyle.DOUBLE,
          size: 12,
        },
      },
    })
  );

  // 2. Meta Info Table (Subject, Chapter, Questions, Time)
  const metaCells: TableCell[] = [];
  if (paper.subject) {
    metaCells.push(
      new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text: `Subject: ${paper.subject.toUpperCase()}`, bold: true })],
          }),
        ],
        width: { size: 25, type: WidthType.PERCENTAGE },
      })
    );
  }
  if (paper.chapter) {
    metaCells.push(
      new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text: `Chapter: ${paper.chapter}`, bold: true })],
          }),
        ],
        width: { size: 40, type: WidthType.PERCENTAGE },
      })
    );
  }
  metaCells.push(
    new TableCell({
      children: [
        new Paragraph({
          children: [new TextRun({ text: `Questions: ${paper.totalQuestions}`, bold: true })],
        }),
      ],
      width: { size: 18, type: WidthType.PERCENTAGE },
    })
  );
  metaCells.push(
    new TableCell({
      children: [
        new Paragraph({
          children: [new TextRun({ text: `Duration: ${paper.totalTimeMinutes} Min`, bold: true })],
        }),
      ],
      width: { size: 17, type: WidthType.PERCENTAGE },
    })
  );

  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [new TableRow({ children: metaCells })],
    })
  );

  children.push(new Paragraph({ spacing: { after: 400 } }));

  // 3. Instructions Block
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_3,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: 'General Instructions:',
          bold: true,
          color: '1e3a8a',
          size: 24, // 12pt
        }),
      ],
    })
  );

  paper.instructions.forEach((ins) => {
    children.push(
      new Paragraph({
        bullet: { level: 0 },
        spacing: { after: 80 },
        children: [new TextRun({ text: ins, size: 20 })], // 10pt
      })
    );
  });

  children.push(new Paragraph({ spacing: { after: 400 } }));

  // 4. Questions
  paper.questions.forEach((q) => {
    children.push(
      new Paragraph({
        spacing: { before: 180, after: 120 },
        keepNext: true,
        children: [
          new TextRun({ text: `Q${q.index}. `, bold: true, color: '1e3a8a', size: 22 }),
          new TextRun({ text: q.questionText, size: 22 }),
        ],
      })
    );

    // Options layout (2x2 grid table with no borders)
    const row1 = new TableRow({
      children: [
        new TableCell({
          borders: {
            top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
          },
          children: [
            new Paragraph({
              indent: { left: 240 },
              children: [
                new TextRun({ text: 'A. ', bold: true, color: '1e3a8a' }),
                new TextRun({ text: q.options.find((o) => o.key === 'A')?.text || '' }),
              ],
            }),
          ],
          width: { size: 50, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          borders: {
            top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
          },
          children: [
            new Paragraph({
              indent: { left: 240 },
              children: [
                new TextRun({ text: 'B. ', bold: true, color: '1e3a8a' }),
                new TextRun({ text: q.options.find((o) => o.key === 'B')?.text || '' }),
              ],
            }),
          ],
          width: { size: 50, type: WidthType.PERCENTAGE },
        }),
      ],
    });

    const row2 = new TableRow({
      children: [
        new TableCell({
          borders: {
            top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
          },
          children: [
            new Paragraph({
              indent: { left: 240 },
              children: [
                new TextRun({ text: 'C. ', bold: true, color: '1e3a8a' }),
                new TextRun({ text: q.options.find((o) => o.key === 'C')?.text || '' }),
              ],
            }),
          ],
          width: { size: 50, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          borders: {
            top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
          },
          children: [
            new Paragraph({
              indent: { left: 240 },
              children: [
                new TextRun({ text: 'D. ', bold: true, color: '1e3a8a' }),
                new TextRun({ text: q.options.find((o) => o.key === 'D')?.text || '' }),
              ],
            }),
          ],
          width: { size: 50, type: WidthType.PERCENTAGE },
        }),
      ],
    });

    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
          bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
          left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
          right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
        },
        rows: [row1, row2],
      })
    );
  });

  // 5. Page Break for Answers and Solutions
  if (includeSolutions) {
    children.push(new Paragraph({ children: [new PageBreak()] }));

    // Solutions Header
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: 'ANSWER KEY & DETAILED SOLUTIONS',
            bold: true,
            size: 28, // 14pt
            color: '1e3a8a',
          }),
        ],
      })
    );

    // Quick Answer Key Table
    const tableHeader = new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: 'Question No.', bold: true })],
            }),
          ],
          width: { size: 50, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: 'Correct Answer', bold: true })],
            }),
          ],
          width: { size: 50, type: WidthType.PERCENTAGE },
        }),
      ],
    });

    const tableRows = [tableHeader];
    paper.answerKey.forEach((item) => {
      tableRows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ text: `Q${item.index}`, alignment: AlignmentType.CENTER })],
            }),
            new TableCell({
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: item.correctOption,
                      bold: true,
                    }),
                  ],
                }),
              ],
            }),
          ],
        })
      );
    });

    children.push(
      new Table({
        width: { size: 60, type: WidthType.PERCENTAGE },
        alignment: AlignmentType.CENTER,
        rows: tableRows,
      })
    );

    children.push(new Paragraph({ spacing: { after: 400 } }));

    // Detailed Solutions
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: 'Detailed Solutions:',
            bold: true,
            color: '1e3a8a',
            size: 22,
          }),
        ],
      })
    );

    paper.answerKey.forEach((item) => {
      children.push(
        new Paragraph({
          spacing: { before: 120, after: 120 },
          children: [
            new TextRun({
              text: `Q${item.index} Solution (Correct Option: ${item.correctOption})`,
              bold: true,
              color: '1e3a8a',
              size: 20,
            }),
          ],
        })
      );

      children.push(
        new Paragraph({
          spacing: { after: 180 },
          children: [new TextRun({ text: item.solutionText, size: 20 })],
        })
      );
    });
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, buffer);
}
