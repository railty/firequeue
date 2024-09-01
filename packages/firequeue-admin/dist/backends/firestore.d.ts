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
    collection: any;
    opts: any;
    keyPrefix: string;
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
    storeResult(taskId: string, result: any, state: string): any;
    /**
     * @method firestoreBackend#getTaskMeta
     * @param {string} taskId
     * @returns {Promise}
     */
    getTaskMeta(taskId: string): Promise<object>;
    getKeyPrefix(): string;
    listResults(): Promise<any[]>;
    deleteResults(results: any): Promise<void>;
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
