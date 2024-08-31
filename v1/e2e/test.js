import celery from "celery-node";
import serviceAccount from "./firequeue.sa.js";

const client = celery.createClient('firestore://', 'firestore://');
client.conf.CELERY_BACKEND_OPTIONS.sa = serviceAccount;
client.conf.CELERY_BROKER_OPTIONS.sa = serviceAccount;

const main = async ()=>{
    const keyPrefix = client.backend.getKeyPrefix();
    console.log("keyPrefix = ", keyPrefix);

    const ks = await client.backend.keys("*");
    console.log("ks = ", ks);

    client.disconnect();
}
main();