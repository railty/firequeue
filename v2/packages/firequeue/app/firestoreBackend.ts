import { collection, writeBatch, Firestore, getDocs, getDoc, setDoc, CollectionReference, DocumentData, doc } from "firebase/firestore"; 

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
  collection: CollectionReference;
  keyPrefix: string;

  constructor(fbcollection, keyPrefix) {
    this.collection = fbcollection;
    this.keyPrefix = keyPrefix;
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
  ): Promise<void> {
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
    const snapCol = await getDocs(this.collection);
    const docs = <any>[];
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
    const batch = writeBatch(this.collection.firestore);
    for (let r of results){
      const refDoc = doc(this.collection, r);
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
  private async set(key: string, value: string): Promise<void> {
    const refDoc = doc(this.collection, key);
    await setDoc(refDoc, {value: value});
  }

  /**
   * @method firestoreBackend#get
   * @private
   * @param {string} key
   * @return {Promise}
   */
  private async get(key: string) {
    const refDoc = doc(this.collection, key);
    const snapDoc = await getDoc(refDoc);
    if (snapDoc.exists()){
      const data = await snapDoc.data();
      return data.value;
    }
    return null;
  }
}
