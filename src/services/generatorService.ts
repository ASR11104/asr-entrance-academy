import { prisma } from '../db';
import { QuestionPaperGeneratorInput, GeneratedQuestionPaper } from '../types';

export async function generateQuestionPaper(
  input: QuestionPaperGeneratorInput
): Promise<GeneratedQuestionPaper> {
  const {
    subject,
    chapter,
    exams,
    questionCount,
    timePerQuestionSeconds,
    positiveMark,
    negativeMark,
  } = input;

  // Build the Prisma where clause
  const whereClause: any = {};

  if (subject) {
    whereClause.subject = subject;
  }

  if (chapter) {
    whereClause.chapter = {
      equals: chapter,
    };
  }

  if (exams && exams.length > 0) {
    whereClause.exams = {
      some: {
        examName: {
          in: exams.map((e) => e.trim()),
        },
      },
    };
  }

  // Fetch candidate questions with their options
  const candidateQuestions = await prisma.question.findMany({
    where: whereClause,
    include: {
      options: true,
    },
  });

  if (candidateQuestions.length < questionCount) {
    throw new Error(
      `Not enough questions matching the criteria in the database. Requested: ${questionCount}, Available: ${candidateQuestions.length}`
    );
  }

  // Shuffle questions randomly (Fisher-Yates shuffle)
  const shuffled = [...candidateQuestions];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Select the requested number of questions
  const selectedQuestions = shuffled.slice(0, questionCount);

  // Calculate total time
  const totalTimeSeconds = questionCount * timePerQuestionSeconds;
  const totalTimeMinutes = Math.ceil(totalTimeSeconds / 60);

  // Generate instructions
  const instructions = [
    `This paper contains ${questionCount} multiple choice questions.`,
    `Total duration of the examination is ${totalTimeMinutes} minutes.`,
    `Each correct response carries +${positiveMark} marks.`,
    `For each incorrect response, ${Math.abs(negativeMark)} marks will be deducted.`,
    `There is no negative marking for unattempted questions.`,
    `Only one option is correct for each question. Mark your choice carefully.`,
  ];

  // Construct paper title
  const titleParts = ['ASR Entrance Academy'];
  if (exams && exams.length > 0) {
    titleParts.push(`(${exams.join(', ')})`);
  }
  titleParts.push('Practice Question Paper');
  const title = titleParts.join(' - ');

  // Map to target structures
  const questionsList = selectedQuestions.map((q, idx) => {
    // Sort options A, B, C, D in alphabetical order
    const sortedOptions = [...q.options].sort((a, b) =>
      a.optionKey.localeCompare(b.optionKey)
    );

    return {
      index: idx + 1,
      id: q.id,
      questionText: q.questionText,
      options: sortedOptions.map((opt) => ({
        key: opt.optionKey,
        text: opt.optionText,
      })),
    };
  });

  const answerKeyList = selectedQuestions.map((q, idx) => ({
    index: idx + 1,
    questionId: q.id,
    correctOption: q.correctOption,
    solutionText: q.solutionText,
  }));

  return {
    title,
    subject: subject || undefined,
    chapter: chapter || undefined,
    exams: exams || undefined,
    totalQuestions: questionCount,
    totalTimeMinutes,
    positiveMark,
    negativeMark,
    instructions,
    questions: questionsList,
    answerKey: answerKeyList,
  };
}
