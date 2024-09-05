import { FieldValue } from 'firebase-admin/firestore';

import { v4 } from "uuid";
import { CeleryBroker } from ".";
import { Message } from "../message";

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

export default class FirestoreBroker implements CeleryBroker {
  collection;
  opts;
  interval: number;
  channels = [];
  closing = false;

  /**
   * Firestore broker class
   * @constructor FirestoreBroker
   * @param {string} url the connection string of Firestore
   * @param {object} opts the options object for Firestore connect of ioFirestore
   */
  constructor(url: string, opts: object) {
    this.opts = opts;
    this.collection = this.opts.collection;
    this.interval = this.opts.interval;
  }

  /**
   * codes from here: https://github.com/OptimalBits/bull/blob/129c6e108ce67ca343c8532161d06742d92b651c/lib/utils.js#L21-L44
   * @method FirestoreBroker#isReady
   * @returns {Promise} promises that continues if Firestore connected.
   */
  public isReady(): Promise<void> {
    return new Promise((resolve, reject) => {
      resolve();
    });
  }

  /**
   * @method FirestoreBroker#disconnect
   * @returns {Promise} promises that continues if Firestore disconnected.
   */
  public disconnect(): Promise<void> {
    this.closing = true;
    return new Promise((resolve)=>resolve());
  }

  /**
   * @method FirestoreBroker#publish
   *
   * @returns {Promise}
   */
  public async publish(
    body: object | [Array<any>, object, object],
    exchange: string,
    routingKey: string,
    headers: object,
    properties: object
  ) {
    const messageBody = JSON.stringify(body);
    const contentType = "application/json";
    const contentEncoding = "utf-8";
    const message = {
      body: Buffer.from(messageBody).toString("base64"),
      "content-type": contentType,
      "content-encoding": contentEncoding,
      headers,
      properties: {
        body_encoding: "base64",
        delivery_info: {
          exchange: exchange,
          routing_key: routingKey
        },
        delivery_mode: 2,
        delivery_tag: v4(),
        ...properties
      }
    };

    const refDoc = this.collection.doc(routingKey);
    try{
      await refDoc.update({
        value: FieldValue.arrayUnion(JSON.stringify(message))
      });
    }
    catch(ex){
      if (ex.code === 5){   //celery key is not exist, meaning system not initilized yet
        await refDoc.set({
          value: [JSON.stringify(message)]
        });
      }
      else console.log(ex);
    }
  }

  public async listTasks(routingKey: string): Promise<any> {
    const refDoc = this.collection.doc(routingKey);
    const doc = await refDoc.get()
    const tasks = doc.data().value;
    return tasks;
  }

  public async deleteTasks(routingKey: string, tasks: Array<string>): Promise<any> {
    const refDoc = this.collection.doc(routingKey);
    return refDoc.update({
      value: FieldValue.arrayRemove(...tasks)
    });
  }

  /**
   * @method FirestoreBroker#subscribe
   * @param {string} queue
   * @param {Function} callback
   * @returns {Promise}
   */
  public subscribe(queue: string, callback: Function): Promise<any[]> {
    const promiseCount = 1;

    return this.isReady().then(() => {
      for (let index = 0; index < promiseCount; index += 1) {
        this.channels.push(
          new Promise(resolve => this.receive(index, resolve, queue, callback))
        );
      }

      return Promise.all(this.channels);
    });
  }

  /**
   * @private
   * @param {number} index
   * @param {Fucntion} resolve
   * @param {string} queue
   * @param {Function} callback
   */
  private receive(
    index: number,
    resolve: Function,
    queue: string,
    callback: Function
  ): void {
    process.nextTick(() =>
      this.receiveOneOnNextTick(index, resolve, queue, callback)
    );
  }

  /**
   * @private
   * @param {number} index
   * @param {Function} resolve
   * @param {String} queue
   * @param {Function} callback
   * @returns {Promise}
   */
  private receiveOneOnNextTick(
    index: number,
    resolve: Function,
    queue: string,
    callback: Function
  ): Promise<void> {
    if (this.closing) {
      resolve();
      return;
    }

    return this.receiveOne(queue)
      .then(body => {
        if (body) {
          callback(body);
        }
        Promise.resolve();
      })
      .then(() => this.receive(index, resolve, queue, callback))
      .catch(err => console.log(err));
  }

  /**
   * @private
   * @param {string} queue
   * @return {Promise}
   */
  private async receiveOne(queue: string): Promise<Message> {
    console.log("checking queue");
    const doc = this.collection.doc(queue);
    const results = await doc.get();
    if (results.exists){
      const tasks = results.data()['value'];
      if (tasks.length > 0) {
        const result = tasks.shift();
        doc.update({
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
    //wait for next check
    return new Promise((resolve)=>{
      setTimeout(()=>{resolve(null)}, this.interval);
    });
  }
}
