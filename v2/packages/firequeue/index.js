import Client from "./app/client";

let client = null;

export function createClient(collection){
  if (client) return client;
  
  client = new Client(collection);
  return client;
}
