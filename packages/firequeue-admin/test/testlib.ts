import { getApps, initializeApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import serviceAccount from "./firequeue.sa";
import { createClient, createWorker } from "../src/index";

if (getApps().length===0) initializeApp({
  credential: cert(serviceAccount as ServiceAccount)
});
export const collection = getFirestore().collection("abc");

export const getWorker = () => {
  const worker = createWorker('firestore://', 'firestore://');
  worker.conf.CELERY_BACKEND_OPTIONS["collection"] = collection;
  worker.conf.CELERY_BROKER_OPTIONS = {
    collection: collection,
    interval: 5000
  };

  return worker;
}

export const getClient = () => {
  const client = createClient("firestore://", "firestore://");
  client.conf.CELERY_BACKEND_OPTIONS["collection"] = collection;
  client.conf.CELERY_BROKER_OPTIONS["collection"] = collection;

  return client;
}
