import { bulkImportFromFolder } from '../services/bulkImportService';
import * as path from 'path';

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Error: Please provide the path to the folder to bulk import.');
    console.error('Usage: npm run bulk-import <path_to_folder>');
    process.exit(1);
  }

  const folderPath = path.resolve(args[0]);
  console.log(`Starting bulk import from folder: "${folderPath}"...\n`);

  try {
    const summary = await bulkImportFromFolder(folderPath);

    console.log('--- Bulk Import File Details ---');
    summary.fileDetails.forEach((detail) => {
      const icon = detail.status === 'imported' ? '✅' : detail.status === 'skipped' ? '⏭️' : '❌';
      console.log(`${icon} [${detail.status.toUpperCase()}] ${detail.fileName}`);
      if (detail.status === 'imported') {
        console.log(`   Questions - Imported: ${detail.questionsImported}, Skipped: ${detail.questionsSkipped}, Failed: ${detail.questionsFailed}`);
      } else if (detail.status === 'failed') {
        console.error(`   Error: ${detail.error}`);
      }
    });

    console.log('\n--- Bulk Import Summary ---');
    console.log(`Total JSON files found : ${summary.totalFilesFound}`);
    console.log(`Files newly processed  : ${summary.filesProcessed}`);
    console.log(`Files skipped (tracked): ${summary.filesSkipped}`);
    console.log(`Files failed to process: ${summary.filesFailed}`);
  } catch (err: any) {
    console.error(`Fatal bulk import error: ${err.message || err}`);
    process.exit(1);
  }
}

main();
