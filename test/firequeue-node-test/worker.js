import { createClient, createWorker } from 'firequeue/firequeue-node';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import serviceAccount from "./firequeue.sa.js";

if (getApps().length===0) initializeApp({
  credential: cert(serviceAccount)
});
const collection = getFirestore().collection("abc");

const worker = createWorker(collection);

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
