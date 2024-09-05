"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createClient = createClient;
exports.createWorker = createWorker;
exports.createSTWorker = createSTWorker;
const client_1 = require("./app/client");
const worker_1 = require("./app/worker");
const singleTaskWorker_1 = require("./app/singleTaskWorker");
function createClient(collection, queue = "celery") {
    const client = new client_1.default("firestore://", "firestore://", queue);
    client.conf.CELERY_BACKEND_OPTIONS["collection"] = collection;
    client.conf.CELERY_BROKER_OPTIONS["collection"] = collection;
    return client;
}
function createWorker(collection, interval = 5000, queue = "celery") {
    const worker = new worker_1.default('firestore://', 'firestore://', queue);
    worker.conf.CELERY_BACKEND_OPTIONS["collection"] = collection;
    worker.conf.CELERY_BROKER_OPTIONS = {
        collection: collection,
        interval: interval
    };
    return worker;
}
//create Single Task Worker
function createSTWorker(collection, interval = 5000, queue = "celery") {
    return new singleTaskWorker_1.default(collection, interval, queue);
}
