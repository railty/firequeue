//would like this, but doesn't work
//import { createClient, createWorker } from 'firequeue/firequeue-node';
import { createClient, createWorker, createSTWorker } from 'firequeue/firequeue-node/dist/index.js';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import serviceAccount from "./firequeue.sa.js";

if (getApps().length===0) initializeApp({
  credential: cert(serviceAccount)
});
const collection = getFirestore().collection("abc");

const worker = createSTWorker(collection);

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
