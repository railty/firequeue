import { doc, setDoc, getDocs, writeBatch, query, orderBy } from "firebase/firestore"; 

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

export const sleep = (n)=>{
  return new Promise((resolve)=>{
    setTimeout(()=>{
      resolve();
    }, n);
  });
}

//this is using firebase modular sdk, very different style
export class Client {
  constructor(col, taskPrefix="task-") {
    console.log("new client");
    this.col = col;
    this.taskPrefix = taskPrefix;
  }
  
  genTaskId() {
    const uniqueDocId = doc(this.col).id; 
    return this.taskPrefix + uniqueDocId;
  }

  async createTask(taskName, args){
    const taskId = this.genTaskId();
    args.taskId = taskId;
  
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
   
    const refDoc = doc(this.col, taskId);
    await setDoc(refDoc, {
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
  
  async listTasks() {
    //const querySnapshot = await getDocs(this.col);
    const querySnapshot = await getDocs(query(this.col, orderBy('created_at', "asc")));

    let tasks = [];
    querySnapshot.forEach((doc) => {
      tasks.push({
        id: doc.id,
        value: doc.data()
      });
    })

    tasks = tasks.map((task)=>{
      task.value.body = JSON.parse(fromBase64(task.value.body));
      return task;
    });

    return tasks;
  }

  async deleteTasks(taskIds) {
    const batch = writeBatch(this.col.firestore);
    for (let docId of taskIds){
      const refDoc = doc(this.col, docId);
      batch.delete(refDoc);
    }
    await batch.commit();
  }
}


//this is using firebase-admin, very different style
export class Worker {
  constructor(col, interval=2500) {
    this.col = col;
    this.interval = interval;
    this.closing = false;
    this.handlers = {};
  }

  register(name, handler){
    if (!handler) {
      throw new Error("Undefined handler");
    }
    if (this.handlers[name]) {
      throw new Error("Handler is already set");
    }

    this.handlers[name] = async (...args) => {
      try {
        return await handler(...args);
      } catch (err) {
        return err;
      }
    };
  }

  async start() {
    this.closing = false;
    const timer = setInterval(()=>{
      if (this.closing) {
        if (timer) clearInterval(timer);
      }
      try{
        this.processTasks();
      }
      catch(err){
        console.error(err)
      }
    }, this.interval);
  }

  async stop() {
    this.closing = true;
  }

  async processTasks() {
    console.log("checking queue");
    const collectionRef = this.col.where('status', '==', 'ready').orderBy('created_at', 'asc').limit(1);
    const tasks = await collectionRef.get();
    if (!tasks.empty){
      const docId = tasks.docs[0].id;
      const task = tasks.docs[0].data();
      const taskId = task.headers["id"];
      const taskName = task.headers["task"];
    
      await this.col.doc(docId).update({
        status: 'working',
        started_at: new Date().getTime(),
      });

      const body = JSON.parse(fromBase64(task.body));
      const [args, kwargs] = body;

      const handler = this.handlers[taskName];
      if (!handler) {
        throw new Error(`Missing process handler for task ${taskName}`);
      }

      try{
        const result = await handler(...args, kwargs);
        
        await this.col.doc(docId).update({
          status: 'success',
          result: result,
          completed_at: new Date().getTime(),
        });
      }
      catch(error){
        await this.col.doc(docId).update({
          status: 'failure',
          error: error.toString(),
          completed_at: new Date().getTime(),
        });
      }
    }
  }
}
