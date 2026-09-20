import assert from 'node:assert/strict';
import http from 'node:http';
import {spawn} from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const work=await fs.mkdtemp(path.join(os.tmpdir(),'astra-test-'));
await fs.symlink(path.resolve('server.js'),path.join(work,'server.js'));
await fs.symlink(path.resolve('public'),path.join(work,'public'));
let lastOnline, lastLocal;
const mock=http.createServer(async(req,res)=>{let body='';for await(const c of req)body+=c;res.setHeader('content-type','application/json');
 if(req.url==='/api/tags')return res.end(JSON.stringify({models:[{name:'qwen3:0.6b'}]}));
 if(req.url==='/api/chat'){lastLocal=JSON.parse(body);return res.end(JSON.stringify({message:{content:'local answer'}}));}
 if(req.url==='/v1/chat/completions'){lastOnline=JSON.parse(body);return res.end(JSON.stringify({choices:[{message:{content:'online answer'}}]}));}
 res.statusCode=404;res.end('{}');
});
await new Promise(resolve=>mock.listen(20128,'127.0.0.1',resolve));
const localModel=http.createServer((req,res)=>mock.emit('request',req,res));
await new Promise(resolve=>localModel.listen(11434,'127.0.0.1',resolve));
const app=spawn(process.execPath,[path.resolve('server.js')],{cwd:work,env:{...process.env,PORT:'30487',ROUTER_API_KEY:'test-only',ASTRA_ACCESS_TOKEN:'local-test-token'},stdio:'ignore'});
const api=async(route,method='GET',payload)=>{const r=await fetch('http://127.0.0.1:30487'+route,{method,headers:{'content-type':'application/json','x-astra-token':'local-test-token'},body:payload?JSON.stringify(payload):undefined});return {status:r.status,data:await r.json()};};
try{
 for(let i=0;i<30;i++){try{await api('/api/status');break;}catch{await new Promise(r=>setTimeout(r,100));}}
 let r=await fetch('http://127.0.0.1:30487/api/notes');assert.equal(r.status,401);
 r=await fetch('http://127.0.0.1:30487/manifest.webmanifest');assert.equal(r.status,200);const manifest=await r.json();assert.equal(manifest.display,'standalone');
 for(const icon of manifest.icons){r=await fetch('http://127.0.0.1:30487'+icon.src);assert.equal(r.status,200);assert.equal(r.headers.get('content-type'),'image/png');assert.equal((await r.arrayBuffer()).byteLength>100,true);}
 r=await fetch('http://127.0.0.1:30487/sw.js');assert.equal(r.status,200);assert.doesNotMatch(await r.text(),/SHELL = \[[^\]]*\/api\//);
 assert.equal((await api('/api/notes','POST',{title:'school',content:'PRIVATE_TEST_NOTE'})).status,201);
 let chat={messages:[{role:'user',content:'hello'}],mode:'offline',shareNotes:false};
 assert.equal((await api('/api/chat','POST',chat)).data.source,'Offline: qwen3:0.6b');
 assert.match(lastLocal.messages[0].content,/PRIVATE_TEST_NOTE/);
 chat.mode='online';assert.equal((await api('/api/chat','POST',chat)).data.source,'Online router');
 assert.doesNotMatch(lastOnline.messages[0].content,/PRIVATE_TEST_NOTE/);
 chat.shareNotes=true;await api('/api/chat','POST',chat);assert.match(lastOnline.messages[0].content,/PRIVATE_TEST_NOTE/);
 assert.equal((await api('/api/models/pull','POST',{model:'random'})).status,400);
 console.log('Integration checks passed: PWA assets, token, local notes, online privacy, model restriction.');
}finally{app.kill();mock.close();localModel.close();await fs.rm(work,{recursive:true,force:true});}
