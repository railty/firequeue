import { v4 } from "uuid";
import { Message } from "../message";
import { collection, getDoc, Firestore, updateDoc, doc, arrayRemove, setDoc, arrayUnion, CollectionReference, DocumentData, getDocs } from "firebase/firestore"; 

function toBase64(message) {
  const utf8Bytes = new TextEncoder().encode(message);
  const base64String = btoa(String.fromCharCode(...utf8Bytes));
  return base64String;
}

function fromBase64(base64String) {
  const binaryString = atob(base64String);
  const utf8Bytes = new Uint8Array([...binaryString].map(char => char.charCodeAt(0)));
  const originalString = new TextDecoder().decode(utf8Bytes);
  return originalString;
}

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

export default class FirestoreBroker{
  firestore: Firestore;
  collection: CollectionReference<DocumentData, DocumentData>;
  channels = [];
  closing = false;
  opts: object;
  task_queue;

  /**
   * Firestore broker class
   * @constructor FirestoreBroker
   * @param {string} url the connection string of Firestore
   * @param {object} opts the options object for Firestore connect of ioFirestore
   */
  constructor(collection, task_queue) {
    this.task_queue = task_queue;
    this.collection = collection;
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
  ): Promise<void> {
    const messageBody = JSON.stringify(body);
    const contentType = "application/json";
    const contentEncoding = "utf-8";
    const message = {
      body: toBase64(messageBody),
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

    const refDoc = doc(this.collection, routingKey);
    try{
      await updateDoc(refDoc, {
        value: arrayUnion(JSON.stringify(message))
      });
    }
    catch(ex){
      if(ex.code==='not-found'){
        await setDoc(refDoc, {value: [JSON.stringify(message)]});
      }
    }
  }

  public async listTasks(routingKey: string): Promise<any> {
    const refDoc = doc(this.collection, routingKey);
    const docSnap = await getDoc(refDoc);
    const tasks = docSnap.data().value;
    return tasks;
  }

  public async deleteTasks(routingKey: string, tasks: Array<string>): Promise<any> {
    const refDoc = doc(this.collection, routingKey);
    await updateDoc(refDoc, {
      value: arrayRemove(...tasks)
    });
  }
}
