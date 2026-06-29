import { prisma } from '../db';
import { QuestionPaperGeneratorInput, GeneratedQuestionPaper } from '../types';

export async function generateQuestionPaper(
  input: QuestionPaperGeneratorInput
): Promise<GeneratedQuestionPaper> {
  const {
    subject,
    chapter,
    chapters,
    chapterQuestionCounts,
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

  if (exams && exams.length > 0) {
    whereClause.exams = {
      some: {
        examName: {
          in: exams.map((e) => e.trim()),
        },
      },
    };
  }

  let selectedQuestions: any[] = [];
  let calculatedQuestionCount = questionCount;

  // 1. If specific counts per chapter are requested
  if (chapterQuestionCounts && Object.keys(chapterQuestionCounts).length > 0) {
    calculatedQuestionCount = 0;
    for (const [chName, count] of Object.entries(chapterQuestionCounts)) {
      if (count === 0) continue;
      calculatedQuestionCount += count;

      const chWhere = {
        ...whereClause,
        chapter: chName,
      };

      const candidateQuestions = await prisma.question.findMany({
        where: chWhere,
        include: {
          options: true,
        },
      });

      if (candidateQuestions.length < count) {
        throw new Error(
          `Not enough questions matching chapter "${chName}" in the database. Requested: ${count}, Available: ${candidateQuestions.length}`
        );
      }

      // Shuffle candidate questions for this chapter
      const shuffled = [...candidateQuestions];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      selectedQuestions = selectedQuestions.concat(shuffled.slice(0, count));
    }

    // Shuffle the final merged list of questions so chapters are randomized/mixed
    for (let i = selectedQuestions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [selectedQuestions[i], selectedQuestions[j]] = [selectedQuestions[j], selectedQuestions[i]];
    }
  } else {
    // 2. Standard query logic (single chapter or multiple chapters without counts, or all chapters)
    if (chapters && chapters.length > 0) {
      whereClause.chapter = {
        in: chapters,
      };
    } else if (chapter) {
      whereClause.chapter = {
        equals: chapter,
      };
    }

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

    // Shuffle questions randomly
    const shuffled = [...candidateQuestions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    selectedQuestions = shuffled.slice(0, questionCount);
    calculatedQuestionCount = selectedQuestions.length;
  }

  // Calculate total time
  const totalTimeSeconds = calculatedQuestionCount * timePerQuestionSeconds;
  const totalTimeMinutes = Math.ceil(totalTimeSeconds / 60);

  // Generate instructions
  const instructions = [
    `This paper contains ${calculatedQuestionCount} multiple choice questions.`,
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
      diagramPath: q.diagramPath,
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

  // Construct summary text for chapters in returning paper
  const finalChapterText = chapterQuestionCounts && Object.keys(chapterQuestionCounts).length > 0
    ? Object.keys(chapterQuestionCounts).join(', ')
    : (chapters && chapters.length > 0 ? chapters.join(', ') : (chapter || undefined));

  return {
    title,
    subject: subject || undefined,
    chapter: finalChapterText,
    exams: exams || undefined,
    totalQuestions: calculatedQuestionCount,
    totalTimeMinutes,
    positiveMark,
    negativeMark,
    instructions,
    questions: questionsList,
    answerKey: answerKeyList,
  };
}
