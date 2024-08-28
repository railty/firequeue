import * as admin from 'firebase-admin';
import { CeleryBackend } from ".";

/**
 * celery key preifx for firestore result key
 * @private
 * @constant
 *
 * @type {string}
 */
const rootName = "celery";
const keyPrefix = "celery-task-meta-";

/**
 * @exports
 */
export default class FirestoreBackend implements CeleryBackend {
  firestore: FirebaseFirestore.Firestore;
  store: FirebaseFirestore.CollectionReference;
  opts: object;
  /**
   * Firestore backend class
   * @constructor FirestoreBackend
   * @param {string} url the connection string of firestore
   * @param {object} opts the options object for firestore connect of iofirestore
   */
  constructor(url: string, opts: object) {
    this.opts = opts;

    if (admin.apps.length === 0){
      admin.initializeApp({
        credential: admin.credential.cert(this.opts["sa"])
      });
    }

    this.firestore = admin.firestore();
    this.store = this.firestore.collection(rootName);
  }

  public isReady(): Promise<void> {
    return new Promise((resolve, reject) => {
      resolve();
    });
  }

  /**
   * @method firestoreBackend#disconnect
   * @returns {Promise} promises that continues if firestore disconnected.
   */
  public disconnect(): Promise<void> {
    return new Promise((resolve)=>resolve());
  }


  /**
   * @method firestoreBackend#storeResult
   * @param {string} taskId
   * @param {*} result
   * @param {string} state
   */
  public storeResult(
    taskId: string,
    result: any,
    state: string
  ): Promise<admin.firestore.WriteResult> {
    return this.set(
      `${keyPrefix}${taskId}`,
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

  /**
   * @method firestoreBackend#getTaskMeta
   * @param {string} taskId
   * @returns {Promise}
   */
  public getTaskMeta(taskId: string): Promise<object> {
    return this.get(`${keyPrefix}${taskId}`).then(msg => JSON.parse(msg));
  }

  //////////////////////////////////////////////////////////
  //Patched by Shawn
  getKeyPrefix() {
    return keyPrefix;
  }

  async keys() {
    const snapCol = await this.store.get();
    const docs = [];
    snapCol.forEach(doc => {
      docs.push(doc.id);
    });
    return docs;
  }

  async lrange(key, start, stop){
    const doc = await this.get(key);
    return doc;
  }
  //////////////////////////////////////////////////////////

  /**
   * @method firestoreBackend#set
   * @private
   * @param {String} key
   * @param {String} value
   * @returns {Promise}
   */
  private set(key: string, value: string): Promise<admin.firestore.WriteResult> {
    return (this.store.doc(key)).set({value: value});
  }

  /**
   * @method firestoreBackend#get
   * @private
   * @param {string} key
   * @return {Promise}
   */
  private async get(key: string): Promise<string> {
    const snapDoc = await (this.store.doc(key)).get();
    if (snapDoc.exists){
      const doc = await snapDoc.data();
      return doc.value;
    }
    return null;
  }
}
