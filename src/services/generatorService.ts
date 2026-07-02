import { prisma } from '../db';
import { QuestionPaperGeneratorInput, GeneratedQuestionPaper } from '../types';

// Helper to select questions based on difficulty mixing, timesUsed coverage, and previous paper overlap
function selectBalancedQuestions(
  candidates: any[],
  count: number,
  prevQuestionIds: Set<string>
): any[] {
  // 1. Group by difficulty
  const easy = candidates.filter((q) => q.difficulty === 'easy');
  const medium = candidates.filter((q) => q.difficulty === 'medium');
  const hard = candidates.filter((q) => q.difficulty === 'hard');
  const other = candidates.filter(
    (q) => !q.difficulty || (q.difficulty !== 'easy' && q.difficulty !== 'medium' && q.difficulty !== 'hard')
  );

  // 2. Shuffle and sort helper: randomizes equal timesUsed questions, then sorts by timesUsed ascending
  const shuffleAndSort = (arr: any[]) => {
    const res = [...arr];
    for (let i = res.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [res[i], res[j]] = [res[j], res[i]];
    }
    res.sort((a, b) => (a.timesUsed || 0) - (b.timesUsed || 0));
    return res;
  };

  const pools = [
    shuffleAndSort(easy),
    shuffleAndSort(medium),
    shuffleAndSort(hard),
    shuffleAndSort(other),
  ];

  const selected: any[] = [];
  const fallbackPool: any[] = [];
  let overlapCount = 0;
  const maxOverlap = Math.floor(0.4 * count); // at most 40% overlap (at least 60% different)

  const isPrev = (q: any) => prevQuestionIds.has(q.id);

  // Active pools list
  const activePools = pools.map((p, i) => ({ index: i, items: p }));
  let poolIndex = 0;

  while (selected.length < count && activePools.length > 0) {
    if (poolIndex >= activePools.length) {
      poolIndex = 0;
    }

    const poolObj = activePools[poolIndex];
    const pool = poolObj.items;

    if (pool.length === 0) {
      activePools.splice(poolIndex, 1);
      continue;
    }

    let pickedIndex = -1;
    for (let i = 0; i < pool.length; i++) {
      const q = pool[i];
      if (!isPrev(q)) {
        pickedIndex = i;
        break;
      } else if (overlapCount < maxOverlap) {
        pickedIndex = i;
        overlapCount++;
        break;
      }
    }

    if (pickedIndex !== -1) {
      const [picked] = pool.splice(pickedIndex, 1);
      selected.push(picked);
      poolIndex++;
    } else {
      // Move all remaining items in this pool to the fallback list, as they are all previous question paper items
      // and we cannot add them to selected due to maxOverlap limits.
      fallbackPool.push(...pool);
      activePools.splice(poolIndex, 1);
    }
  }

  // Fallback: If we couldn't satisfy the overlap constraint, relax it and draw from remaining candidates
  if (selected.length < count) {
    const remaining = [...fallbackPool];
    for (const p of activePools) {
      remaining.push(...p.items);
    }
    remaining.sort((a, b) => (a.timesUsed || 0) - (b.timesUsed || 0));

    while (selected.length < count && remaining.length > 0) {
      const picked = remaining.shift();
      selected.push(picked);
    }
  }

  return selected;
}

export async function generateQuestionPaper(
  input: QuestionPaperGeneratorInput
): Promise<GeneratedQuestionPaper> {
  const {
    subject,
    chapter,
    chapters,
    chapterQuestionCounts,
    difficultyQuestionCounts,
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

  // Fetch the last generated question IDs to enforce the 60% difference rule
  const lastPaper = await prisma.lastGeneratedPaper.findUnique({
    where: { id: 'LAST' },
  });
  const prevQuestionIds = new Set<string>(
    lastPaper ? lastPaper.questionIds.split(',').filter(Boolean) : []
  );

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

      // Pick balanced questions for this chapter
      const chapterSelected = selectBalancedQuestions(candidateQuestions, count, prevQuestionIds);
      selectedQuestions = selectedQuestions.concat(chapterSelected);
    }

    // Shuffle the final merged list of questions so chapters are randomized/mixed
    for (let i = selectedQuestions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [selectedQuestions[i], selectedQuestions[j]] = [selectedQuestions[j], selectedQuestions[i]];
    }
  }
  // 2. If specific counts per difficulty level are requested globally across selected chapters
  else if (difficultyQuestionCounts && Object.keys(difficultyQuestionCounts).length > 0) {
    calculatedQuestionCount = 0;

    // Apply chapter filters to whereClause first
    if (chapters && chapters.length > 0) {
      whereClause.chapter = {
        in: chapters,
      };
    } else if (chapter) {
      whereClause.chapter = {
        equals: chapter,
      };
    }

    for (const [diff, count] of Object.entries(difficultyQuestionCounts)) {
      if (count === 0) continue;
      calculatedQuestionCount += count;

      const diffWhere = {
        ...whereClause,
        difficulty: diff,
      };

      const candidateQuestions = await prisma.question.findMany({
        where: diffWhere,
        include: {
          options: true,
        },
      });

      if (candidateQuestions.length < count) {
        throw new Error(
          `Not enough questions matching difficulty level "${diff}" in the database. Requested: ${count}, Available: ${candidateQuestions.length}`
        );
      }

      // Pick balanced questions for this difficulty
      const diffSelected = selectBalancedQuestions(candidateQuestions, count, prevQuestionIds);
      selectedQuestions = selectedQuestions.concat(diffSelected);
    }

    // Shuffle the final merged list of questions so difficulties and chapters are randomized/mixed
    for (let i = selectedQuestions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [selectedQuestions[i], selectedQuestions[j]] = [selectedQuestions[j], selectedQuestions[i]];
    }
  }
  else {
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

    // Pick balanced questions
    selectedQuestions = selectBalancedQuestions(candidateQuestions, questionCount, prevQuestionIds);
    calculatedQuestionCount = selectedQuestions.length;
  }

  // Update timesUsed and last generated paper log in database in a transaction
  await prisma.$transaction([
    prisma.question.updateMany({
      where: { id: { in: selectedQuestions.map((q) => q.id) } },
      data: { timesUsed: { increment: 1 } },
    }),
    prisma.lastGeneratedPaper.upsert({
      where: { id: 'LAST' },
      update: { questionIds: selectedQuestions.map((q) => q.id).join(',') },
      create: { id: 'LAST', questionIds: selectedQuestions.map((q) => q.id).join(',') },
    }),
  ]);

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
