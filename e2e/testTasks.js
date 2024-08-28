import {listTasks, createTask, checkTask, disconnect} from "./tasks.js";

const sleep = async (n)=>{
  return new Promise((resolve)=>{
    setTimeout(()=>{
      resolve();
    }, n);
  });
}

const main = async ()=>{
  //gray scale image doesn't work
  const taskId = await createTask('./invoices/invoice.jpg', "test.png");

  for (let i=0; i < 60*10; i++){
    const result = await checkTask(taskId);
    console.log(result);
    if (result.status === 'SUCCESS'){
      disconnect();
      break;
    }
    await sleep(1000);
  }
}

const list = async ()=>{
  const jobs = await listTasks();
}

main();

//list();


