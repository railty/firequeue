import * as admin from 'firebase-admin';
import { CeleryBroker } from ".";
export default class FirestoreBroker implements CeleryBroker {
    firestore: FirebaseFirestore.Firestore;
    store: FirebaseFirestore.CollectionReference;
    channels: any[];
    closing: boolean;
    opts: object;
    /**
     * Firestore broker class
     * @constructor FirestoreBroker
     * @param {string} url the connection string of Firestore
     * @param {object} opts the options object for Firestore connect of ioFirestore
     */
    constructor(url: string, opts: object);
    /**
     * codes from here: https://github.com/OptimalBits/bull/blob/129c6e108ce67ca343c8532161d06742d92b651c/lib/utils.js#L21-L44
     * @method FirestoreBroker#isReady
     * @returns {Promise} promises that continues if Firestore connected.
     */
    isReady(): Promise<void>;
    /**
     * @method FirestoreBroker#disconnect
     * @returns {Promise} promises that continues if Firestore disconnected.
     */
    disconnect(): Promise<void>;
    /**
     * @method FirestoreBroker#publish
     *
     * @returns {Promise}
     */
    publish(body: object | [Array<any>, object, object], exchange: string, routingKey: string, headers: object, properties: object): Promise<admin.firestore.WriteResult>;
    /**
     * @method FirestoreBroker#subscribe
     * @param {string} queue
     * @param {Function} callback
     * @returns {Promise}
     */
    subscribe(queue: string, callback: Function): Promise<any[]>;
    /**
     * @private
     * @param {number} index
     * @param {Fucntion} resolve
     * @param {string} queue
     * @param {Function} callback
     */
    private receive;
    /**
     * @private
     * @param {number} index
     * @param {Function} resolve
     * @param {String} queue
     * @param {Function} callback
     * @returns {Promise}
     */
    private recieveOneOnNextTick;
    /**
     * @private
     * @param {string} queue
     * @return {Promise}
     */
    private receiveOne;
}
