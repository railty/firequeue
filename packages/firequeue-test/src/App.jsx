import { useState, useEffect } from "react";
import { createClient } from 'firequeue';
import { firestore } from "../initFb";
import { collection } from "firebase/firestore"; 
import { v4 } from "uuid";

import './App.css'

const client = createClient(collection(firestore, "abc"));

function App() {
  const [tasks, setTasks] = useState();
  const [results, setResults] = useState();

  const addTask = async ()=>{
    const taskId = v4();
    await client.sendTask("job.tasks.convert", [], {taskId, abc: 123}, taskId);
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
    let results = await client.listResults();
    results = results.map((r)=>{
      r.value = JSON.parse(r.value);
      r.selected = false;
      return r;
    });
    setResults(results);
    console.log("results", results);

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
    const selected = tasks.filter((r)=>r.selected).map((r)=>r.value);
    console.log(selected);
    await client.deleteTasks(selected);
    await dl();
  }

  const deleteSelectedResults = async ()=>{
    const selected = results.filter((r)=>r.selected).map((r)=>r.id);
    console.log(selected);
    await client.deleteResults(selected);
    await dl();
  }

  const toggleAll = async ()=>{
    let res = results.map((r)=>{
      r.selected = !r.selected;
      return r;
    })
    setResults([...res]);
  }

  return (
    <div className="bg-red-200">
      <button className="btn btn-primary" onClick={addTask}>Add task</button>
      <button className="btn btn-primary" onClick={list}>List</button>
      <button className="btn btn-primary" onClick={toggleAll}>Toggle All</button>

      {tasks && (
        <table className="table border-2">
          <thead>
            <tr>
              <th>Pending tasks total = {tasks.length}</th>
              <th><button className="btn btn-primary" onClick={deleteSelectedTasks}>Delete Selected Tasks</button></th>
            </tr>      
          </thead>
          <tbody>
            {tasks.map((task, i) => (
              <tr key={i}>
                <td><a onClick={()=>{check(task.data.headers.id)}}>{task.data.headers.id}</a></td>
                <td>{task.data.headers.task}</td>
                <td>{task.data.body}</td>
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

      {results && (
        <table className="table border-2">
          <thead>
            <tr>
              <th>Completed tasks (total = {results.length})</th>
              <th><button className="btn btn-primary" onClick={deleteSelectedResults}>Delete Selected Results</button></th>
            </tr>      
          </thead>
          <tbody>
            {results.map((result, i) => (
              <tr key={i}>
                <td>{result.value.task_id}</td>
                <td>{result.value.status}</td>
                <td>{result.value.date_done.toLocaleString()}</td>
                <td>{result.value.result}</td>
                <td>
                <input type="checkbox" className="checkbox" checked={result.selected} onChange={(e)=>{
                  results[i].selected = e.target.checked;
                  setResults([...results]);
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
