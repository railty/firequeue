import Client from "./app/client";
import Worker from "./app/worker";
import STWorker from "./app/singleTaskWorker";

export function createClient(collection, queue = "celery"): Client {
  const client = new Client("firestore://", "firestore://", queue);
  client.conf.CELERY_BACKEND_OPTIONS["collection"] = collection;
  client.conf.CELERY_BROKER_OPTIONS["collection"] = collection;
  return client;
}

export function createWorker(collection, interval = 5000, queue = "celery"): Worker {
  const worker = new Worker('firestore://', 'firestore://', queue);
  worker.conf.CELERY_BACKEND_OPTIONS["collection"] = collection;
  worker.conf.CELERY_BROKER_OPTIONS = {
    collection: collection,
    interval: interval
  };
  return worker;
}

//create Single Task Worker
export function createSTWorker(collection, interval = 5000, queue = "celery") {
  return new STWorker(collection, interval, queue);
}
