import * as inquirer from 'inquirer';
import * as path from 'path';
import * as fs from 'fs';
import { prisma } from '../db';
import { generateQuestionPaper } from '../services/generatorService';
import { exportToDocx } from '../services/exporters/docxExporter';
import { exportToHtml } from '../services/exporters/htmlExporter';
import { Subject } from '../types';

async function main() {
  console.log('--- ASR Entrance Academy Question Paper Generator ---\n');

  try {
    // 1. Fetch distinct subjects from database
    const dbSubjects = await prisma.question.findMany({
      select: { subject: true },
      distinct: ['subject'],
    });
    const subjects = dbSubjects.map((s) => s.subject);

    // 2. Fetch distinct exams
    const dbExams = await prisma.questionExam.findMany({
      select: { examName: true },
      distinct: ['examName'],
    });
    const exams = dbExams.map((e) => e.examName);

    // Prompt Part 1: Subject Selection
    const subjectAns = await inquirer.prompt([
      {
        type: 'list',
        name: 'subject',
        message: 'Select Subject:',
        choices: ['All', ...subjects.map((s) => ({ name: s.toUpperCase(), value: s }))],
      },
    ]);

    // 3. Fetch chapters dynamically based on subject selection
    const chapterWhere: any = {};
    if (subjectAns.subject !== 'All') {
      chapterWhere.subject = subjectAns.subject;
    }
    const dbChapters = await prisma.question.findMany({
      where: chapterWhere,
      select: { chapter: true },
      distinct: ['chapter'],
    });
    const chapters = dbChapters.map((c) => c.chapter);

    // Prompt Part 2: Rest of questions
    const restAns = await inquirer.prompt([
      {
        type: 'list',
        name: 'chapter',
        message: 'Select Chapter:',
        choices: ['All', ...chapters],
      },
      {
        type: 'list',
        name: 'exam',
        message: 'Select Exam Target:',
        choices: ['All', ...exams],
      },
      {
        type: 'input',
        name: 'count',
        message: 'Number of questions:',
        default: '10',
        validate: (val) => {
          const num = parseInt(val, 10);
          return !isNaN(num) && num > 0 ? true : 'Please enter a valid positive number';
        },
      },
      {
        type: 'input',
        name: 'timePerQuestion',
        message: 'Time allowed per question (in seconds):',
        default: '180',
        validate: (val) => {
          const num = parseInt(val, 10);
          return !isNaN(num) && num > 0 ? true : 'Please enter a valid positive number';
        },
      },
      {
        type: 'input',
        name: 'positive',
        message: 'Positive mark per correct answer:',
        default: '4',
      },
      {
        type: 'input',
        name: 'negative',
        message: 'Negative mark per incorrect answer:',
        default: '-1',
      },
      {
        type: 'list',
        name: 'format',
        message: 'Select Export Format:',
        choices: [
          { name: 'Microsoft Word (.docx)', value: 'docx' },
          { name: 'HTML (Printable PDF in browser)', value: 'html' },
        ],
      },
      {
        type: 'input',
        name: 'outputFilename',
        message: 'Enter output filename (without extension):',
        default: () => {
          const now = new Date();
          const timestamp = now.getFullYear().toString() +
            (now.getMonth() + 1).toString().padStart(2, '0') +
            now.getDate().toString().padStart(2, '0') + '_' +
            now.getHours().toString().padStart(2, '0') +
            now.getMinutes().toString().padStart(2, '0') +
            now.getSeconds().toString().padStart(2, '0');
          return `practice_paper_${timestamp}`;
        },
      },
    ]);

    // Construct generation criteria
    const criteria: any = {
      questionCount: parseInt(restAns.count, 10),
      timePerQuestionSeconds: parseInt(restAns.timePerQuestion, 10),
      positiveMark: parseInt(restAns.positive, 10),
      negativeMark: parseInt(restAns.negative, 10),
    };

    if (subjectAns.subject !== 'All') {
      criteria.subject = subjectAns.subject as Subject;
    }
    if (restAns.chapter !== 'All') {
      criteria.chapter = restAns.chapter;
    }
    if (restAns.exam !== 'All') {
      criteria.exams = [restAns.exam];
    }

    console.log('\nQuerying questions and compiling paper...');

    const paper = await generateQuestionPaper(criteria);
    const subjectFolder = subjectAns.subject === 'All' || !subjectAns.subject
      ? 'general'
      : subjectAns.subject.toLowerCase();

    const targetDir = path.join(process.cwd(), 'question_papers', subjectFolder);
    fs.mkdirSync(targetDir, { recursive: true });

    const ext = restAns.format === 'docx' ? '.docx' : '.html';
    const sanitizedBase = restAns.outputFilename.replace(/\./g, '_');
    const questionsOnlyFilename = `${sanitizedBase}_questions${ext}`;

    const fullOutputPath = path.join(targetDir, `${sanitizedBase}${ext}`);
    const questionsOnlyOutputPath = path.join(targetDir, questionsOnlyFilename);

    if (restAns.format === 'docx') {
      await exportToDocx(paper, fullOutputPath, true);
      await exportToDocx(paper, questionsOnlyOutputPath, false);
    } else {
      exportToHtml(paper, fullOutputPath, true);
      exportToHtml(paper, questionsOnlyOutputPath, false);
    }

    console.log('\n=============================================');
    console.log('✅ Question Paper Generated Successfully!');
    console.log(`Title: ${paper.title}`);
    console.log(`Total Questions: ${paper.totalQuestions}`);
    console.log(`Total Time: ${paper.totalTimeMinutes} minutes`);
    console.log(`Full Paper Saved: ${fullOutputPath}`);
    console.log(`Questions-Only Saved: ${questionsOnlyOutputPath}`);
    console.log('=============================================');

  } catch (err: any) {
    console.error(`\nError: ${err.message || err}`);
    process.exit(1);
  }
}

main();
