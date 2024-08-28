import fs from 'fs/promises';
import celery from "celery-node";
import xml2js from  'xml2js';
import serviceAccount from "./firequeue.sa.js";
import { v4 } from 'uuid';

const dataFolder = "./invoices/";
const client = celery.createClient('firestore://', 'firestore://');
client.conf.CELERY_BACKEND_OPTIONS.sa = serviceAccount;
client.conf.CELERY_BROKER_OPTIONS.sa = serviceAccount;

export const disconnect = ()=>{
  client.disconnect();
}

export const checkTask = async (taskId)=>{
  const meta = await client.backend.getTaskMeta(taskId);
  if (meta){
    if (meta["status"]==='SUCCESS') {
      const regexJSON = /```json([\s\S]*?)```/;
      const regexXML = /```xml([\s\S]*?)```/;
      const regex = regexXML;
      const ms = regex.exec(meta.result);
      if (ms && ms[1]){
        const xml = ms[1];
        await fs.writeFile(`${dataFolder}/${taskId}.xml`, xml);
        const json = await xml2js.parseStringPromise(xml);
        await fs.writeFile(`${dataFolder}/${taskId}.json`, JSON.stringify(json, null, 2));
        console.log(json);
        return {status:'SUCCESS', data: json};
      }
    }
    else return {status: meta["status"]};
  }
  return {status: 'NULL-META'};
}

export const createTask = async (srcImage, originalName)=>{
  const taskId = v4();
  if (typeof srcImage === "string") {
    await fs.copyFile(srcImage, `${dataFolder}/${taskId}.png`);
  }
  else{
    await fs.writeFile(`${dataFolder}/${taskId}.png`, srcImage);
  }

  const task = client.sendTask("job.tasks.convert", [], {taskId: taskId, originalName: originalName}, taskId);

  return taskId;
}

export const listTasks = async ()=>{
  const jobs = await client.backend.listTasks();
  return jobs;
}

export const keys = async (pattern)=>{
  const ks = await client.backend.keys(pattern);
  return ks;
}
