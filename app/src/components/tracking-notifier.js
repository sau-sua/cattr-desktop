const tracker = require('../base/task-tracker');
const api = require('../base/api');
const Log = require('../utils/log');

const log = new Log('TrackingNotifier');

/**
 * Task being tracked right before a "switching" event, kept until "switched" fires
 * @type {Model<Task>|null}
 */
let taskBeforeSwitch = null;

/**
 * Sends a tracking event to the server, fire-and-forget: errors never interrupt the tracker
 * @async
 * @param {String} action Tracking action (started / switched / stopped)
 * @param {Model<Task>} task Task this event refers to
 * @param {Model<Task>} [previousTask] Previous task, only for "switched" events
 */
const send = async (action, task, previousTask) => {

  if (!task || !task.externalId) {

    log.warning(`Skipped "${action}" tracking event: task is not synced with the server yet`);
    return;

  }

  const body = { action, task_id: task.externalId };

  if (previousTask) {

    if (!previousTask.externalId) {

      log.warning(`Skipped "${action}" tracking event: previous task is not synced with the server yet`);
      return;

    }

    body.previous_task_id = previousTask.externalId;

  }

  try {

    const res = await api.post('tracking/events', body);

    if (!res.success)
      log.warning(`Failed to send "${action}" tracking event: ${res.error ? res.error.message : 'unknown error'}`);

  } catch (err) {

    log.warning(`Failed to send "${action}" tracking event: ${err.message}`);

  }

};

tracker.on('started', () => send('started', tracker.currentTask));

tracker.on('switching', () => {

  taskBeforeSwitch = tracker.currentTask;

});

tracker.on('switched', () => {

  send('switched', tracker.currentTask, taskBeforeSwitch);
  taskBeforeSwitch = null;

});

tracker.on('stopped', () => send('stopped', tracker.previousTask));
