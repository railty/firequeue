import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import serviceAccount from "./firequeue.sa.js";
import { Worker, sleep } from "../index.js";

if (getApps().length===0) initializeApp({
    credential: cert(serviceAccount)
  });

const col = getFirestore().collection("abcd");

const work = async ()=>{
  const worker = new Worker(col);
  worker.register("job.tasks.rmaster", async ({a, b}) => {
    await sleep(1000);
    return {x: a + b};
  });

  worker.start();
}
  
work();