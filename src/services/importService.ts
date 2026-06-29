import { prisma } from '../db';
import { ImportPayloadSchema, QuestionImport } from '../types';

export interface ImportResult {
  totalPassed: number;
  totalFailed: number;
  importedCount: number;
  skippedCount: number;
  errors: string[];
}

export async function importQuestions(data: unknown): Promise<ImportResult> {
  const result: ImportResult = {
    totalPassed: 0,
    totalFailed: 0,
    importedCount: 0,
    skippedCount: 0,
    errors: [],
  };

  // 1. Validate payload
  const parseResult = ImportPayloadSchema.safeParse(data);
  if (!parseResult.success) {
    result.totalFailed = 1;
    result.errors.push(`JSON structure validation failed: ${parseResult.error.message}`);
    return result;
  }

  const questionsToImport: QuestionImport[] = Array.isArray(parseResult.data)
    ? parseResult.data
    : [parseResult.data];

  // 2. Import each question
  for (let i = 0; i < questionsToImport.length; i++) {
    const q = questionsToImport[i];
    try {
      // Check if question already exists (exact match of questionText, subject, and chapter)
      const existing = await prisma.question.findFirst({
        where: {
          questionText: q.question_text,
          subject: q.subject,
          chapter: q.chapter,
        },
      });

      if (existing) {
        result.skippedCount++;
        continue;
      }

      // Store in DB inside a transaction
      await prisma.$transaction(async (tx) => {
        const question = await tx.question.create({
          data: {
            subject: q.subject,
            chapter: q.chapter,
            topic: q.topic || null,
            difficulty: q.difficulty || null,
            questionText: q.question_text,
            correctOption: q.correct_option,
            solutionText: q.solution_text,
          },
        });

        // Insert options
        const optionKeys: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
        await tx.option.createMany({
          data: optionKeys.map((key) => ({
            questionId: question.id,
            optionKey: key,
            optionText: q.options[key],
          })),
        });

        // Insert exams if applicable
        if (q.exams && q.exams.length > 0) {
          await tx.questionExam.createMany({
            data: q.exams.map((examName) => ({
              questionId: question.id,
              examName: examName.trim(),
            })),
          });
        }
      });

      result.importedCount++;
      result.totalPassed++;
    } catch (err: any) {
      result.totalFailed++;
      result.errors.push(`Failed to import question at index ${i}: ${err.message || err}`);
    }
  }

  return result;
}
