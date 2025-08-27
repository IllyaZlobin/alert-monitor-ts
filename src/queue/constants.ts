export const MESSAGE_PROCESSING_QUEUE = {
  name: 'message-processing',
  jobName: 'process-new-message'
};

export const PARSING_SCHEDULER_QUEUE = {
  name: 'parsing-scheduler',
  jobName: 'parse-and-process'
};

export const MESSAGE_CLEANUP_QUEUE = {
  name: 'message-cleanup',
  jobName: 'cleanup-old-messages'
};
