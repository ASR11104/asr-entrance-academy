import { z } from 'zod';

export const SubjectSchema = z.enum(['physics', 'chemistry', 'maths']);
export type Subject = z.infer<typeof SubjectSchema>;

export const DifficultySchema = z.enum(['easy', 'medium', 'hard']);
export type Difficulty = z.infer<typeof DifficultySchema>;

export const OptionKeySchema = z.enum(['A', 'B', 'C', 'D']);
export type OptionKey = z.infer<typeof OptionKeySchema>;

export const QuestionImportSchema = z.object({
  subject: SubjectSchema,
  chapter: z.string().min(1, 'Chapter is required'),
  topic: z.string().optional(),
  difficulty: DifficultySchema.optional(),
  exams: z.array(z.string()).optional(),
  question_text: z.string().min(1, 'Question text is required'),
  options: z.object({
    A: z.string().min(1, 'Option A is required'),
    B: z.string().min(1, 'Option B is required'),
    C: z.string().min(1, 'Option C is required'),
    D: z.string().min(1, 'Option D is required'),
  }),
  correct_option: OptionKeySchema,
  solution_text: z.string().min(1, 'Solution text is required'),
});

export type QuestionImport = z.infer<typeof QuestionImportSchema>;

export const ImportPayloadSchema = z.union([
  QuestionImportSchema,
  z.array(QuestionImportSchema),
]);

export type ImportPayload = z.infer<typeof ImportPayloadSchema>;

export interface QuestionPaperGeneratorInput {
  subject?: Subject;
  chapter?: string;
  exams?: string[];
  questionCount: number;
  timePerQuestionSeconds: number; // e.g., 180 seconds for 3 mins
  positiveMark: number;
  negativeMark: number;
}

export interface GeneratedQuestionPaper {
  title: string;
  subject?: string;
  chapter?: string;
  exams?: string[];
  totalQuestions: number;
  totalTimeMinutes: number;
  positiveMark: number;
  negativeMark: number;
  instructions: string[];
  questions: {
    index: number;
    id: string;
    questionText: string;
    options: {
      key: string;
      text: string;
    }[];
    // We don't return the answer/solution in the main paper, but we can provide an answer key / solution key separately
  }[];
  answerKey: {
    index: number;
    questionId: string;
    correctOption: string;
    solutionText: string;
  }[];
}
