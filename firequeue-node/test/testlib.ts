import { getApps, initializeApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import serviceAccount from "./firequeue.sa";
import { createClient, createWorker } from "../src/index";

if (getApps().length===0) initializeApp({
  credential: cert(serviceAccount as ServiceAccount)
});
export const collection = getFirestore().collection("abc");

export const getWorker = () => {
  return createWorker(collection);
}

export const getClient = () => {
  return createClient(collection);
}
