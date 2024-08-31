import admin from 'firebase-admin';

//import { credential } from 'firebase-admin';
//import { initializeApp } from 'firebase-admin/app';
//import { getDatabase, getDocs, collection } from 'firebase-admin/database';

import serviceAccount from "./firequeue.sa.js";

const rootName = "celery";

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const main = async ()=>{
    const coll = db.collection(rootName);
    const docRef = await coll.add({
        firstName: 'Ada',
        lastName: 'Lovelace',
        born: 1815
      });
      console.log(docRef.id);

      const docRef2 = db.collection(rootName).doc(docRef.id);
      const doc = await docRef2.get();
    
      if (doc.exists) {
        console.log('Document data:', doc.data());
      } else {
        console.log('No such document!');
      }

      const documentsArray = [];
      const snapshot = await db.collection(rootName).get();

      snapshot.forEach(doc => {
        documentsArray.push({
          id: doc.id,
          data: doc.data()
        });
      });

      console.log(documentsArray);

      const batch = db.batch();

      for (let doc of documentsArray){
        const docRef = db.collection(rootName).doc(doc.id);
        batch.delete(docRef);
      }
    
      await batch.commit();

}
main();