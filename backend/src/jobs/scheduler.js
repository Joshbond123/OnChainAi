import cron from 'node-cron';
import dayjs from 'dayjs';
import { collections, readJson, writeJson } from '../utils/fileDb.js';
import { logAutomation, runPostAutomation, runVideoAutomation, updateScheduleRun } from '../services/aiPipeline.js';

let task;

export async function runDueSchedulesOnce() {
  const schedules = readJson(collections.schedules);
  const now = dayjs();
  let executed = 0;

  for (const schedule of schedules.filter((s) => s.enabled !== false)) {
    if (dayjs(schedule.dateTime).isBefore(now) && (!schedule.lastRunAt || dayjs(schedule.lastRunAt).isBefore(dayjs(schedule.dateTime)))) {
      try {
        if (schedule.type === 'video') await runVideoAutomation(schedule);
        else await runPostAutomation(schedule);
        executed += 1;
        logAutomation({ level: 'info', message: `${schedule.type} schedule executed`, scheduleId: schedule.id });
        updateScheduleRun(schedule.id);
        if (schedule.recurringDaily) schedule.dateTime = dayjs(schedule.dateTime).add(1, 'day').toISOString();
        else schedule.enabled = false;
      } catch (error) {
        logAutomation({ level: 'error', message: error.message, scheduleId: schedule.id });
      }
    }
  }

  writeJson(collections.schedules, schedules);
  return executed;
}

export function startScheduler() {
  if (!task) task = cron.schedule('*/1 * * * *', runDueSchedulesOnce);
}
