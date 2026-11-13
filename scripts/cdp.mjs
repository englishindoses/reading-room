import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
const pause = ms => new Promise(r=>setTimeout(r,ms));
export async function launchBrowser() {
  const chrome=process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
  const directory=path.resolve('.browser-test',`profile-${Date.now()}`);
  await mkdir(directory,{recursive:true});
  const child=spawn(chrome,['--headless=new','--no-sandbox','--in-process-gpu','--disable-gpu','--disable-software-rasterizer','--no-first-run','--no-default-browser-check','--remote-debugging-port=9337',`--user-data-dir=${directory}`,'about:blank'],{windowsHide:true,stdio:['ignore','ignore','pipe']});
  if(process.env.CDP_DEBUG)child.stderr.on('data',chunk=>console.log('Chrome:',chunk.toString()));
  child.on('error',err=>console.error(err));
  let targets;
  for(let i=0;i<60;i++){try{targets=await(await fetch('http://127.0.0.1:9337/json')).json();break;}catch{await pause(200);}}
  if(!targets)throw new Error('Chrome remote debugging did not start.');
  const target=targets.find(t=>t.type==='page');
  if(process.env.CDP_DEBUG)console.log('Targets',targets);
  const socket=new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Chrome websocket did not connect')),10000);socket.onopen=()=>{clearTimeout(timer);resolve();};socket.onerror=event=>{clearTimeout(timer);reject(new Error('Chrome websocket connection failed: '+event.message));};});
  socket.onclose=event=>console.error('Chrome socket closed',event.code,event.reason);
  let sequence=0;const waiting=new Map();const events=[];
  socket.onmessage=event=>{const message=JSON.parse(event.data);if(process.env.CDP_DEBUG)console.log('CDP',message);if(message.id){const p=waiting.get(message.id);if(!p)return;waiting.delete(message.id);message.error?p.reject(new Error(JSON.stringify(message.error))):p.resolve(message.result);}else events.push(message);};
  function send(method,params={}){return new Promise((resolve,reject)=>{const id=++sequence;const timer=setTimeout(()=>reject(new Error('Chrome command timed out: '+method)),15000);waiting.set(id,{resolve:value=>{clearTimeout(timer);resolve(value);},reject:err=>{clearTimeout(timer);reject(err);}});socket.send(JSON.stringify({id,method,params}));});}
  async function evaluate(expression){const result=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(result.exceptionDetails)throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);return result.result.value;}
  async function until(expression,timeout=10000){const start=Date.now();while(Date.now()-start<timeout){try{const value=await evaluate(expression);if(value)return value;}catch{}await pause(100);}throw new Error(`Timed out: ${expression}`);}
  async function click(selector){await until(`!!document.querySelector(${JSON.stringify(selector)})`);await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);}
  async function fill(selector,value){await evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});if(!el)throw new Error('Missing '+${JSON.stringify(selector)});el.value=${JSON.stringify(value)};el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));})()`);}
  await send('Page.enable');await send('Runtime.enable');await send('Network.enable');
  return {send,evaluate,until,click,fill,events,pause,async close(){try{await send('Browser.close');}catch{}socket.close();child.kill();}};
}
