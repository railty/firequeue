"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
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
class FirestoreBackend {
    /**
     * Firestore backend class
     * @constructor FirestoreBackend
     * @param {string} url the connection string of firestore
     * @param {object} opts the options object for firestore connect of iofirestore
     */
    constructor(url, opts) {
        this.keyPrefix = "celery-task-meta-";
        this.opts = opts;
        this.collection = this.opts.collection;
    }
    isReady() {
        return new Promise((resolve, reject) => {
            resolve();
        });
    }
    /**
     * @method firestoreBackend#disconnect
     * @returns {Promise} promises that continues if firestore disconnected.
     */
    disconnect() {
        return new Promise((resolve) => resolve());
    }
    /**
     * @method firestoreBackend#storeResult
     * @param {string} taskId
     * @param {*} result
     * @param {string} state
     */
    storeResult(taskId, result, state) {
        return this.set(`${this.keyPrefix}${taskId}`, JSON.stringify({
            status: state,
            result: state == 'FAILURE' ? null : result,
            traceback: result,
            children: [],
            task_id: taskId,
            date_done: new Date().toISOString()
        }));
    }
    /**
     * @method firestoreBackend#getTaskMeta
     * @param {string} taskId
     * @returns {Promise}
     */
    getTaskMeta(taskId) {
        return this.get(`${this.keyPrefix}${taskId}`).then(msg => JSON.parse(msg));
    }
    //////////////////////////////////////////////////////////
    //Patched by Shawn
    getKeyPrefix() {
        return this.keyPrefix;
    }
    listResults() {
        return __awaiter(this, void 0, void 0, function* () {
            const snapCol = yield this.collection.get();
            const docs = [];
            snapCol.forEach(doc => {
                if (doc.id.startsWith(this.keyPrefix)) {
                    docs.push({
                        id: doc.id,
                        value: doc.data().value
                    });
                }
            });
            return docs;
        });
    }
    deleteResults(results) {
        return __awaiter(this, void 0, void 0, function* () {
            const batch = this.collection.firestore.batch();
            for (let r of results) {
                const refDoc = this.collection.doc(r);
                batch.delete(refDoc);
            }
            yield batch.commit();
        });
    }
    //////////////////////////////////////////////////////////
    /**
     * @method firestoreBackend#set
     * @private
     * @param {String} key
     * @param {String} value
     * @returns {Promise}
     */
    set(key, value) {
        return (this.collection.doc(key)).set({ value: value });
    }
    /**
     * @method firestoreBackend#get
     * @private
     * @param {string} key
     * @return {Promise}
     */
    get(key) {
        return __awaiter(this, void 0, void 0, function* () {
            const snapDoc = yield (this.collection.doc(key)).get();
            if (snapDoc.exists) {
                const doc = yield snapDoc.data();
                return doc.value;
            }
            return null;
        });
    }
}
exports.default = FirestoreBackend;
