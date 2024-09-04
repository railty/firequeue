import { v4 as uuidv4 } from 'uuid';
const keyPrefix = "task-";

export async function listResults(col) {
  const snapCol = await col.get();
  let docs = [];
  snapCol.forEach(doc => {
    if (doc.id.startsWith(keyPrefix)){
      docs.push({
        id: doc.id,
        value: doc.data()
      });
    }
  });
  docs = docs.map((doc)=>{
    doc.value.body = JSON.parse(fromBase64(doc.value.body));
    return doc;
  });
  return docs;
}

export async function deleteResults(col, docIds) {
  const batch = col.firestore.batch();
  for (let docId of docIds){
    const refDoc = col.doc(docId);
    batch.delete(refDoc);
  }
  await batch.commit();
}

export async function listTasks(col, routingKey="celery") {
  const refDoc = col.doc(routingKey);
  const doc = await refDoc.get()
  const tasks = doc.data().value;
  return tasks;
}

export function toBase64(message) {
  const utf8Bytes = new TextEncoder().encode(message);
  const base64String = btoa(String.fromCharCode(...utf8Bytes));
  return base64String;
}

export function fromBase64(base64String) {
  const binaryString = atob(base64String);
  const utf8Bytes = new Uint8Array([...binaryString].map(char => char.charCodeAt(0)));
  const originalString = new TextDecoder().decode(utf8Bytes);
  return originalString;
}

export function genTaskId(col) {
  const uniqueDocId = col.doc().id; 
  return 'T'+ uniqueDocId;

/*
  //this doesn't work as the base64 has / and \ so firebase can treat it as path divider
  const uuid = uuidv4();

  const hexString = uuid.replace(/-/g, '');
  const byteArray = new Uint8Array(
    hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16))
  );

  function uint8ArrayToBase64(uint8Array) {
    let binary = '';
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    return btoa(binary).replace(/=/g, '');
  }
  return 'T' + uint8ArrayToBase64(byteArray);
*/
}


export async function set(col, docId, value) {
  await (col.doc(docId)).set(value);
}

export async function get(col, docId) {
  const snapDoc = await (col.doc(docId)).get();
  if (snapDoc.exists){
    const doc = await snapDoc.data();
    return doc.value;
  }
  return null;
}


/*
https://docs.celeryq.dev/en/latest/internals/protocol.html
in Celery Protocol Version 2, body is base64 encoded array of 3 elements
[
  [1, 2], // args 
  {a:1, b:2},    // kwargs 
  {       // options
     "callbacks":null,
     "errbacks":null,
     "chain":null,
     "chord":null
  }
]
*/

export async function createTask(col, taskName, args){
  const taskId = genTaskId(col);

  const properties = {
    'correlation_id': null,
    "content-type": "application/json",
    "content-encoding": "utf-8",
  };

  const headers = {
    'lang': 'js',
    'task': taskName,
    'id': taskId,
    'root_id': null,
    'parent_id': null,
    'group': null,
  }

  const body = [
    [],
    args,
    null
  ];
 
  const docId = await set(col, `${keyPrefix}${taskId}`, {
    status: 'ready',
    result: null,
    created_at: new Date().getTime(),
    completed_at: null,
    headers,
    properties,
    body: toBase64(JSON.stringify(body))
  });
  return taskId;
}

export const sleep = (n)=>{
  return new Promise((resolve)=>{
    setTimeout(()=>{
      resolve();
    }, n);
  });
}