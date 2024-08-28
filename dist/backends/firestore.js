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
const admin = require("firebase-admin");
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
class FirestoreBackend {
    /**
     * Firestore backend class
     * @constructor FirestoreBackend
     * @param {string} url the connection string of firestore
     * @param {object} opts the options object for firestore connect of iofirestore
     */
    constructor(url, opts) {
        this.opts = opts;
        if (admin.apps.length === 0) {
            admin.initializeApp({
                credential: admin.credential.cert(this.opts["sa"])
            });
        }
        this.firestore = admin.firestore();
        this.store = this.firestore.collection(rootName);
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
        return this.set(`${keyPrefix}${taskId}`, JSON.stringify({
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
        return this.get(`${keyPrefix}${taskId}`).then(msg => JSON.parse(msg));
    }
    //////////////////////////////////////////////////////////
    //Patched by Shawn
    getKeyPrefix() {
        return keyPrefix;
    }
    keys() {
        return __awaiter(this, void 0, void 0, function* () {
            const snapCol = yield this.store.get();
            const docs = [];
            snapCol.forEach(doc => {
                docs.push(doc.id);
            });
            return docs;
        });
    }
    lrange(key, start, stop) {
        return __awaiter(this, void 0, void 0, function* () {
            const doc = yield this.get(key);
            return doc;
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
        return (this.store.doc(key)).set({ value: value });
    }
    /**
     * @method firestoreBackend#get
     * @private
     * @param {string} key
     * @return {Promise}
     */
    get(key) {
        return __awaiter(this, void 0, void 0, function* () {
            const snapDoc = yield (this.store.doc(key)).get();
            if (snapDoc.exists) {
                const doc = yield snapDoc.data();
                return doc.value;
            }
            return null;
        });
    }
}
exports.default = FirestoreBackend;
