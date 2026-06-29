import * as fs from 'fs';
import * as path from 'path';
import { generateQuestionPaper } from '../services/generatorService';
import { Subject } from '../types';

async function main() {
  const args = process.argv.slice(2);
  
  // Simple parser
  const params: any = {
    count: 5,
    time: 180,
    positive: 4,
    negative: -1,
    subject: undefined,
    chapter: undefined,
    exams: undefined,
    output: 'question_paper.json',
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--count' && args[i + 1]) params.count = parseInt(args[++i], 10);
    else if (arg === '--time' && args[i + 1]) params.time = parseInt(args[++i], 10);
    else if (arg === '--positive' && args[i + 1]) params.positive = parseInt(args[++i], 10);
    else if (arg === '--negative' && args[i + 1]) params.negative = parseInt(args[++i], 10);
    else if (arg === '--subject' && args[i + 1]) params.subject = args[++i] as Subject;
    else if (arg === '--chapter' && args[i + 1]) params.chapter = args[++i];
    else if (arg === '--exams' && args[i + 1]) params.exams = args[++i].split(',').map((x) => x.trim());
    else if (arg === '--output' && args[i + 1]) params.output = args[++i];
  }

  console.log('Generating question paper with criteria:', {
    subject: params.subject,
    chapter: params.chapter,
    exams: params.exams,
    questionCount: params.count,
    timePerQuestionSeconds: params.time,
    positiveMark: params.positive,
    negativeMark: params.negative,
  });

  try {
    const paper = await generateQuestionPaper({
      subject: params.subject,
      chapter: params.chapter,
      exams: params.exams,
      questionCount: params.count,
      timePerQuestionSeconds: params.time,
      positiveMark: params.positive,
      negativeMark: params.negative,
    });

    const outputPath = path.resolve(params.output);
    fs.writeFileSync(outputPath, JSON.stringify(paper, null, 2), 'utf8');

    console.log('\n--- Question Paper Generated Successfully! ---');
    console.log(`Title: ${paper.title}`);
    console.log(`Total Questions: ${paper.totalQuestions}`);
    console.log(`Total Time: ${paper.totalTimeMinutes} minutes`);
    console.log(`Output saved to: ${outputPath}`);

    console.log('\n--- General Instructions ---');
    paper.instructions.forEach((ins) => console.log(`- ${ins}`));

    console.log('\n--- Questions ---');
    paper.questions.forEach((q) => {
      console.log(`\nQ${q.index}. ${q.questionText}`);
      q.options.forEach((o) => {
        console.log(`  ${o.key}. ${o.text}`);
      });
    });
  } catch (err: any) {
    console.error(`Error generating question paper: ${err.message || err}`);
    process.exit(1);
  }
}

main();
