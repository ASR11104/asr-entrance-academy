import { prisma } from '../db';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function runQuery(sql: string) {
  try {
    const isMutation = /^\s*(insert|update|delete|create|drop|alter|replace)/i.test(sql);
    
    if (isMutation) {
      const affected = await prisma.$executeRawUnsafe(sql);
      console.log(`\n✅ Success: ${affected} row(s) affected.`);
    } else {
      const result: any = await prisma.$queryRawUnsafe(sql);
      if (!Array.isArray(result) || result.length === 0) {
        console.log('\nQuery executed successfully. No rows returned.');
        return;
      }
      console.log(`\n--- Result (${result.length} row(s) found) ---`);
      console.table(result);
    }
  } catch (err: any) {
    console.error('\n❌ SQL Execution Error:', err.message || err);
  }
}

function promptQuery() {
  rl.question('\nSQL> ', async (input) => {
    const trimmed = input.trim();
    if (trimmed.toLowerCase() === 'exit' || trimmed.toLowerCase() === 'quit') {
      console.log('Goodbye!');
      rl.close();
      process.exit(0);
    }

    if (trimmed) {
      // Basic support for multi-line or just running single queries
      if (trimmed.endsWith(';')) {
        await runQuery(trimmed);
      } else {
        await runQuery(trimmed + ';');
      }
    }
    promptQuery();
  });
}

console.log('==================================================');
console.log('       ASR Entrance Academy SQL Console           ');
console.log('  Query the local SQLite database directly using SQL.');
console.log('  Type "exit" or "quit" to leave.                 ');
console.log('==================================================');

promptQuery();
