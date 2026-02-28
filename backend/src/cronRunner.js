import { ensureDb } from './utils/fileDb.js';
import { runDueSchedulesOnce } from './jobs/scheduler.js';

ensureDb();
const executed = await runDueSchedulesOnce();
console.log(`Cron run complete. Executed schedules: ${executed}`);
