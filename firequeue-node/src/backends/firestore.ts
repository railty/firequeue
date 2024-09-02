import { CeleryBackend } from ".";

/**
 * celery key preifx for firestore result key
 * @private
 * @constant
 *
 * @type {string}
 */

/**
 * @exports
 */
export default class FirestoreBackend implements CeleryBackend {
  collection;
  opts;
  keyPrefix = "celery-task-meta-";
  /**
   * Firestore backend class
   * @constructor FirestoreBackend
   * @param {string} url the connection string of firestore
   * @param {object} opts the options object for firestore connect of iofirestore
   */
  constructor(url: string, opts: object) {
    this.opts = opts;
    this.collection = this.opts.collection;
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

  /**
   * @method firestoreBackend#getTaskMeta
   * @param {string} taskId
   * @returns {Promise}
   */
  public getTaskMeta(taskId: string): Promise<object> {
    return this.get(`${this.keyPrefix}${taskId}`).then(msg => JSON.parse(msg));
  }

  //////////////////////////////////////////////////////////
  //Patched by Shawn
  getKeyPrefix() {
    return this.keyPrefix;
  }

  async listResults() {
    const snapCol = await this.collection.get();
    const docs = [];
    snapCol.forEach(doc => {
      if (doc.id.startsWith(this.keyPrefix)){
        docs.push({
          id: doc.id,
          value: doc.data().value
        });
      }
    });
    return docs;
  }

  async deleteResults(results) {
    const batch = this.collection.firestore.batch();
    for (let r of results){
      const refDoc = this.collection.doc(r);
      batch.delete(refDoc);
    }
    await batch.commit();
  }
 
  //////////////////////////////////////////////////////////

  /**
   * @method firestoreBackend#set
   * @private
   * @param {String} key
   * @param {String} value
   * @returns {Promise}
   */
  private set(key: string, value: string) {
    return (this.collection.doc(key)).set({value: value});
  }

  /**
   * @method firestoreBackend#get
   * @private
   * @param {string} key
   * @return {Promise}
   */
  private async get(key: string): Promise<string> {
    const snapDoc = await (this.collection.doc(key)).get();
    if (snapDoc.exists){
      const doc = await snapDoc.data();
      return doc.value;
    }
    return null;
  }
}
