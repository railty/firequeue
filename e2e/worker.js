import celery from "celery-node";
//import { ask } from "./openai.js";
import { ask } from "./goofing.js";
import serviceAccount from "./firequeue.sa.js";

const worker = celery.createWorker('firestore://', 'firestore://');
worker.conf.CELERY_BACKEND_OPTIONS.sa = serviceAccount;
worker.conf.CELERY_BROKER_OPTIONS.sa = serviceAccount;

worker.register("job.tasks.convert", async ({taskId, originalName}) => {
  const answer = await ask(taskId);
  return answer;
});

worker.start();
