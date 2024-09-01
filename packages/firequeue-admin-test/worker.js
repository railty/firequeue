import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { createWorker } from 'firequeue-admin';
import serviceAccount from "./firequeue.sa.js";

initializeApp({
  credential: cert(serviceAccount)
});

const firestore = getFirestore();
const collection = firestore.collection("abc");

const worker = createWorker('firestore://', 'firestore://');
worker.conf.CELERY_BACKEND_OPTIONS.collection = collection;
worker.conf.CELERY_BROKER_OPTIONS = {
  collection: collection,
  interval: 5000
};

const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}
const goofing = async (taskId)=>{
  await sleep(3000);
  return `complete ${taskId}`;
}

worker.register("job.tasks.convert", async ({taskId, originalName}) => {
  const answer = await goofing(taskId);
  return answer;
});

worker.start();
