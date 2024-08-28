import * as admin from 'firebase-admin';
import { CeleryBackend } from ".";
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
    constructor(url: string, opts: object);
    isReady(): Promise<void>;
    /**
     * @method firestoreBackend#disconnect
     * @returns {Promise} promises that continues if firestore disconnected.
     */
    disconnect(): Promise<void>;
    /**
     * @method firestoreBackend#storeResult
     * @param {string} taskId
     * @param {*} result
     * @param {string} state
     */
    storeResult(taskId: string, result: any, state: string): Promise<admin.firestore.WriteResult>;
    /**
     * @method firestoreBackend#getTaskMeta
     * @param {string} taskId
     * @returns {Promise}
     */
    getTaskMeta(taskId: string): Promise<object>;
    getKeyPrefix(): string;
    keys(): Promise<any[]>;
    lrange(key: any, start: any, stop: any): Promise<string>;
    /**
     * @method firestoreBackend#set
     * @private
     * @param {String} key
     * @param {String} value
     * @returns {Promise}
     */
    private set;
    /**
     * @method firestoreBackend#get
     * @private
     * @param {string} key
     * @return {Promise}
     */
    private get;
}
