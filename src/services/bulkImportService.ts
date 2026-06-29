import * as fs from 'fs';
import * as path from 'path';
import { prisma } from '../db';
import { importQuestions, ImportResult } from './importService';

export interface BulkImportFileResult {
  filePath: string;
  fileName: string;
  status: 'imported' | 'skipped' | 'failed';
  questionsImported: number;
  questionsSkipped: number;
  questionsFailed: number;
  error?: string;
}

export interface BulkImportResult {
  totalFilesFound: number;
  filesProcessed: number;
  filesSkipped: number;
  filesFailed: number;
  fileDetails: BulkImportFileResult[];
}

export async function bulkImportFromFolder(folderPath: string): Promise<BulkImportResult> {
  const resolvedFolder = path.resolve(folderPath);
  const result: BulkImportResult = {
    totalFilesFound: 0,
    filesProcessed: 0,
    filesSkipped: 0,
    filesFailed: 0,
    fileDetails: [],
  };

  if (!fs.existsSync(resolvedFolder) || !fs.statSync(resolvedFolder).isDirectory()) {
    throw new Error(`Directory not found or is not a directory: ${resolvedFolder}`);
  }

  const allFiles = fs.readdirSync(resolvedFolder);
  const jsonFiles = allFiles.filter((file) => file.toLowerCase().endsWith('.json'));
  result.totalFilesFound = jsonFiles.length;

  for (const file of jsonFiles) {
    const filePath = path.join(resolvedFolder, file);
    const normalizedPath = path.normalize(filePath);

    try {
      // Check if file is already imported
      const alreadyImported = await prisma.importedFile.findUnique({
        where: { filePath: normalizedPath },
      });

      if (alreadyImported) {
        result.filesSkipped++;
        result.fileDetails.push({
          filePath: normalizedPath,
          fileName: file,
          status: 'skipped',
          questionsImported: 0,
          questionsSkipped: 0,
          questionsFailed: 0,
        });
        continue;
      }

      // Read and import the file
      const rawContent = fs.readFileSync(normalizedPath, 'utf8');
      let parsedData: any;
      try {
        parsedData = JSON.parse(rawContent);
      } catch (err: any) {
        throw new Error(`Invalid JSON syntax: ${err.message}`);
      }

      const importRes: ImportResult = await importQuestions(parsedData);

      if (importRes.errors.length > 0 && importRes.importedCount === 0) {
        if (importRes.errors.some((e) => e.startsWith('JSON structure validation failed'))) {
          throw new Error(importRes.errors[0]);
        }
      }

      // Mark file as imported in database
      await prisma.importedFile.create({
        data: {
          filePath: normalizedPath,
        },
      });

      result.filesProcessed++;
      result.fileDetails.push({
        filePath: normalizedPath,
        fileName: file,
        status: 'imported',
        questionsImported: importRes.importedCount,
        questionsSkipped: importRes.skippedCount,
        questionsFailed: importRes.totalFailed,
      });

    } catch (err: any) {
      result.filesFailed++;
      result.fileDetails.push({
        filePath: normalizedPath,
        fileName: file,
        status: 'failed',
        questionsImported: 0,
        questionsSkipped: 0,
        questionsFailed: 0,
        error: err.message || err,
      });
    }
  }

  return result;
}
