import { FieldValue } from 'firebase-admin/firestore';
import { Message } from "../kombu/message";

class FirestoreMessage extends Message {
  private raw: object;

  constructor(payload: object) {
    super(
      Buffer.from(payload["body"], "base64"),
      payload["content-type"],
      payload["content-encoding"],
      payload["properties"],
      payload["headers"]
    );

    this.raw = payload;
  }
}

export default class singleTaskWorker {
  collection;
  interval;
  queue;
  keyPrefix = "celery-task-meta-";

  handlers: object = {};
  closing;

  constructor(collection, interval, queue = "celery") {
    this.collection = collection;
    this.interval = interval;
    this.queue = queue;
    this.closing = false;
  }

  public register(name: string, handler: Function): void {
    if (!handler) {
      throw new Error("Undefined handler");
    }
    if (this.handlers[name]) {
      throw new Error("Handler is already set");
    }

    this.handlers[name] = async function registHandler(...args: any[]): Promise<any> {
      try {
        return await handler(...args);
      } catch (err) {
        return err;
      }
    };
  }

  public storeResult(
    taskId: string,
    result: any,
    state: string
  ) {
    return this.set(
      `${this.keyPrefix}${taskId}`,
      JSON.stringify({
        status: state,
        result: state == 'FAILURE' ? null : result,
        traceback: result,
        children: [],
        task_id: taskId,
        date_done: new Date().toISOString()
      })
    );
  }
  
  private set(key: string, value: string) {
    return (this.collection.doc(key)).set({value: value});
  }

  public async start() {
    console.info("celery.node worker starting...");
    console.info(`registered task: ${Object.keys(this.handlers)}`);

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

  public async stop() {
    this.closing = true;
  }

  public async disconnect(){
    console.log("disconnect");
    this.stop();
  }

  private async processTasks() {
    const onMessage = this.createTaskHandler();

    try{
      const body = await this.receiveOne(this.queue);
      if (body) {
        return await onMessage(body);
      }
    }
    catch(err){
      console.log(err);
    }
  }

  private async receiveOne(queue: string): Promise<Message> {
    console.log("checking queue");
    const doc = this.collection.doc(queue);
    const results = await doc.get();
    if (results.exists){
      const tasks = results.data()['value'];
      if (tasks.length > 0) {
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
  }

  public createTaskHandler() {
    const onTaskReceived = async (message: Message) => {
      if (message) {
        let payload = null;
        let taskName = message.headers["task"];
        if (!taskName) {
          // protocol v1
          payload = message.decode();
          taskName = payload["task"];
        }
  
        // strategy
        let body;
        let headers;
        if (payload == null && !("args" in message.decode())) {
          body = message.decode(); // message.body;
          headers = message.headers;
        } else {
          const args = payload["args"] || [];
          const kwargs = payload["kwargs"] || {};
          const embed = {
            callbacks: payload["callbacks"],
            errbacks: payload["errbacks"],
            chord: payload["chord"],
            chain: null
          };
  
          body = [args, kwargs, embed];
          headers = {
            lang: payload["lang"],
            task: payload["task"],
            id: payload["id"],
            rootId: payload["root_id"],
            parentId: payload["parentId"],
            group: payload["group"],
            meth: payload["meth"],
            shadow: payload["shadow"],
            eta: payload["eta"],
            expires: payload["expires"],
            retries: payload["retries"] || 0,
            timelimit: payload["timelimit"] || [null, null],
            kwargsrepr: payload["kwargsrepr"],
            origin: payload["origin"]
          };
        }
  
        // request
        const [args, kwargs /*, embed */] = body;
        const taskId = headers["id"];
  
        const handler = this.handlers[taskName];
        if (!handler) {
          throw new Error(`Missing process handler for task ${taskName}`);
        }
  
        console.info(
          `Received task: ${taskName}[${taskId}], args: ${args}, kwargs: ${JSON.stringify(
            kwargs
          )}`
        );
  
        let result;
        try {
          const timeStart = process.hrtime();
          result = await handler(...args, kwargs);
          const diff = process.hrtime(timeStart);
  
          console.info(
            `Task ${taskName}[${taskId}] succeeded in ${diff[0] +
              diff[1] / 1e9}s: ${result}`
          );
          await this.storeResult(taskId, result, "SUCCESS");
        }
        catch(err) {
          console.info(`celery.node Task ${taskName}[${taskId}] failed: [${err}]`);
          await this.storeResult(taskId, err, "FAILURE");
        };
  
        return result;
      };
    }

    return onTaskReceived;
  }
}
