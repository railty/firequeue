import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import serviceAccount from "./firequeue.sa.js";
import { listResults, deleteResults, listTasks, fromBase64, createTask, sleep } from "./lib.js";

if (getApps().length===0) initializeApp({
  credential: cert(serviceAccount)
});
const col = getFirestore().collection("rmaster");

const list = async ()=>{
  const results = await listResults(col);
  console.log(results);
  /*
  let tasks = await listTasks(col);
  tasks = tasks.map((t)=>{
    const task = JSON.parse(t);
    task.body = fromBase64(task.body);
    task.body = JSON.parse(task.body);
    return task;
  });

  console.log(JSON.stringify(tasks, null, 2));
  */
}

//list();
const create = async ()=>{
  for (let i=0; i<1; i++){
    const taskId = await createTask(col, "job.tasks.rmaster", {a:123, b:456});
    await sleep(500);
    console.log(`${taskId} created`);
  }
}
const work = async ()=>{
  console.log("checking queue");

  const collectionRef = col.where('status', '==', 'ready').orderBy('created_at', 'asc').limit(1);
  const results = await collectionRef.get();
  if (!results.empty){
    
    const docId = results.docs[0].id;
    const task = results.docs[0].data();

    const docRef = col.doc(docId);
    await docRef.update({
      status: 'working'
    });

  }
/*
      const result = tasks.shift();
      await doc.update({
        value: FieldValue.arrayRemove(result)
      });
      
      const rawMsg = JSON.parse(result);

      // now supports only application/json of content-type
      if (rawMsg["content-type"] !== "application/json") {
        throw new Error(
          `queue ${queue} item: unsupported content type ${rawMsg["content-type"]}`
        );
      }
      // now supports only base64 of body_encoding
      if (rawMsg.properties.body_encoding !== "base64") {
        throw new Error(
          `queue ${queue} item: unsupported body encoding ${rawMsg.properties.body_encoding}`
        );
      }
      // now supports only utf-8 of content-encoding
      if (rawMsg["content-encoding"] !== "utf-8") {
        throw new Error(
          `queue ${queue} item: unsupported content encoding ${rawMsg["content-encoding"]}`
        );
      }

      return new FirestoreMessage(rawMsg);
    }
  }
  return null;
*/



}
//create();
//list();
work();