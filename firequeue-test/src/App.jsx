import { useState, useEffect } from "react";

import { client } from "../initFirebase.js";

import './App.css'

function App() {
  const [tasks, setTasks] = useState();

  const addTask = async ()=>{
    const taskId = await client.createTask("job.tasks.rmaster", {a:123, b:456});
    console.log(taskId);
    await dl();
  }

  const check = async (taskId)=>{
    const status = await client.checkTask(taskId);
    console.log(status);
  }

  const list = async ()=>{
    await dl();
  }

  const dl = async ()=>{
    let tasks = await client.listTasks();
    tasks = tasks.map((t)=>{
      t.selected = false;
      return t;
    });
    setTasks(tasks);
    console.log("tasks", tasks);
  }

  useEffect(()=>{
    dl();
  }, []);

  const deleteSelectedTasks = async ()=>{
    const selected = tasks.filter((r)=>r.selected).map((r)=>r.id);
    console.log(selected);
    await client.deleteTasks(selected);
    await dl();
  }

  const toggleAllTasks = async ()=>{
    let res = tasks.map((r)=>{
      r.selected = !r.selected;
      return r;
    })
    setTasks([...res]);
  }

  return (
    <div className="bg-red-200">
      <button className="btn btn-primary" onClick={addTask}>Add task</button>
      <button className="btn btn-primary" onClick={list}>List</button>

      {tasks && (
        <table className="table border-2">
          <thead>
            <tr>
              <th>Pending tasks total = {tasks.length}</th>
              <th><button className="btn btn-primary" onClick={deleteSelectedTasks}>Delete Selected Tasks</button></th>
              <th><button className="btn btn-primary" onClick={toggleAllTasks}>Toggle All Tasks</button></th>
            </tr>      
          </thead>
          <tbody>
            {tasks.map((task, i) => (
              <tr key={i}>
                <td><a onClick={()=>{check(task.data.headers.id)}}>{task.value.headers.id}</a></td>
                <td>{task.value.headers.task}</td>
                <td>{new Date(task.value.created_at).toLocaleString()}</td>
                <td>{task.value.status}</td>
                <td>{JSON.stringify(task.value.body[1], null, 2)}</td>
                <td>
                  <input type="checkbox" className="checkbox" checked={task.selected} onChange={(e)=>{
                    tasks[i].selected = e.target.checked;
                    setTasks([...tasks]);
                  }} />
                </td>
              </tr>
            ))}

          </tbody>
        </table>
      )}

    </div>
  )
}

export default App;
