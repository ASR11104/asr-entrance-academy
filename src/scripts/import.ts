import * as fs from 'fs';
import * as path from 'path';
import { importQuestions } from '../services/importService';

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Error: Please provide the path to the JSON file to import.');
    console.error('Usage: npm run import <path_to_json_file>');
    process.exit(1);
  }

  const filePath = path.resolve(args[0]);
  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found at "${filePath}"`);
    process.exit(1);
  }

  try {
    const rawContent = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(rawContent);

    console.log(`Starting import of questions from: ${filePath}...`);
    const result = await importQuestions(parsed);

    console.log('\n--- Import Summary ---');
    console.log(`Successfully imported  : ${result.importedCount}`);
    console.log(`Skipped (already exist): ${result.skippedCount}`);
    console.log(`Failed/Invalid          : ${result.totalFailed}`);

    if (result.errors.length > 0) {
      console.log('\nErrors encountered:');
      result.errors.forEach((err) => console.error(`- ${err}`));
    }
  } catch (err: any) {
    console.error(`Fatal error reading or parsing file: ${err.message || err}`);
    process.exit(1);
  }
}

main();
