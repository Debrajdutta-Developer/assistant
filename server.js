import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {makeDocx,makePptx} from './lib/office.mjs';
import {CAPABILITIES,readPermissions,setPermission,requirePermission} from './lib/permissions.mjs';
import {runtimeStatus,runtimeConfig,runtimeMessage,pullPreferredModel,chat as runtimeChat} from './lib/ai-runtime.mjs';

const execFileAsync=promisify(execFile);
try { for (const line of (await fs.readFile('.env','utf8')).split('\n')) { const m=line.match(/^([A-Z_]+)=(.*)$/); if(m && !process.env[m[1]]) process.env[m[1]]=m[2].trim(); } } catch {}
const port=Number(process.env.PORT||3000), host=process.env.HOST||'127.0.0.1';
const root=path.resolve('public'), notesFile=path.resolve('data/notes.json');
const bridge=path.resolve('android/termux/jarvis-bridge.sh');
const router=process.env.ROUTER_URL||'http://127.0.0.1:20128/v1';
if(!(/^https:\/\/[^\s/?#]+(?::\d+)?\/v1$/.test(router)||/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/v1$/.test(router)))throw Error('ROUTER_URL requires HTTPS or localhost /v1');
if(!['127.0.0.1','localhost'].includes(host)&&!process.env.ASTRA_ACCESS_TOKEN)throw Error('Set ASTRA_ACCESS_TOKEN before allowing network clients.');
const token=process.env.ASTRA_ACCESS_TOKEN;
const send=(r,c,d,t='application/json')=>{r.writeHead(c,{'content-type':t,'cache-control':'no-store','x-content-type-options':'nosniff','content-security-policy':"default-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; frame-ancestors 'none'"});r.end(typeof d==='string'||Buffer.isBuffer(d)?d:JSON.stringify(d));};
async function body(req){let s='';for await(const part of req){s+=part;if(s.length>32000)throw Error('Request too large');}return JSON.parse(s);}
async function notes(){try{return JSON.parse(await fs.readFile(notesFile,'utf8'));}catch(e){if(e.code==='ENOENT')return [];throw e;}}
async function save(list){await fs.mkdir(path.dirname(notesFile),{recursive:true,mode:0o700});await fs.writeFile(notesFile,JSON.stringify(list,null,2),{mode:0o600});}
async function bridgeRun(args){try{await execFileAsync('bash',[bridge,...args],{timeout:15000,maxBuffer:20000});return {ok:true};}catch(e){throw Error(e.stderr?.trim()||e.stdout?.trim()||'Android bridge is unavailable. Start Jarvis from Termux on the Android device.');}}
const error=e=>{const m=String(e.message||e);if(m==='RUNTIME_SETUP_REQUIRED')return 'Jarvis needs an AI runtime. Start 9Router or install the local starter model.';if(m==='LOCAL_MODEL_UNAVAILABLE')return 'No local AI model is installed yet. Use Advanced → Model → Download offline starter model.';if(/missing api key|invalid api key|unauthorized/i.test(m))return '9Router is running, but Jarvis is missing its 9Router API key. Check ROUTER_API_KEY in ~/assistant/.env and restart Jarvis.';if(m==='ONLINE_NOT_CONFIGURED')return '9Router is not configured. Check ROUTER_URL and ROUTER_API_KEY in the server environment.';return /fetch failed|timeout|aborted/i.test(m)?'Model unavailable or timed out. Check the local model or 9Router.':m.slice(0,200);};
http.createServer(async(req,res)=>{
 const url=req.url?.split('?')[0];
 if(url?.startsWith('/api/')){
  if(token){const supplied=req.headers['x-astra-token'];if(typeof supplied!=='string'||Buffer.byteLength(supplied)!==Buffer.byteLength(token)||!crypto.timingSafeEqual(Buffer.from(supplied),Buffer.from(token)))return send(res,401,{error:'Enter this computer’s Astra access token.'});}
  try{
   if(url==='/api/permissions'&&req.method==='GET')return send(res,200,{capabilities:CAPABILITIES,permissions:await readPermissions(),connectors:{github:!!process.env.GITHUB_CLIENT_ID,google:!!process.env.GOOGLE_CLIENT_ID}});
   if(url==='/api/permissions'&&req.method==='POST'){const {name,enabled}=await body(req);const permissions=await setPermission(name,enabled);return send(res,200,{permissions});}
   if(url==='/api/runtime'&&req.method==='GET'){const status=await runtimeStatus();return send(res,200,{...status,config:runtimeConfig(),message:runtimeMessage(status)});}
   if(url==='/api/runtime/pull'&&req.method==='POST'){const result=await pullPreferredModel();return send(res,200,{ok:true,status:result.status||'complete',message:'Offline starter model is ready.'});}
   if(url==='/api/status'&&req.method==='GET'){const runtime=await runtimeStatus();return send(res,200,{models:runtime.ollama.models,onlineConfigured:runtime.router.authentication==='configured',deviceBridge:await fs.access(bridge).then(()=>true).catch(()=>false),runtime:runtime.mode});}
   if(url==='/api/device/open-app'&&req.method==='POST'){
    requirePermission(await readPermissions(),'device_open_apps');const {app}=await body(req);if(!['whatsapp','youtube','chrome','maps','settings'].includes(app))return send(res,400,{error:'App is not allowlisted.'});await bridgeRun(['open-app',app]);return send(res,200,{ok:true,action:'open-app',app});
   }
   if(url==='/api/device/open-url'&&req.method==='POST'){
    requirePermission(await readPermissions(),'device_open_urls');const {url:target}=await body(req);if(typeof target!=='string'||!/^https:\/\//i.test(target)||target.length>2048)return send(res,400,{error:'Only HTTPS URLs up to 2048 characters are allowed.'});await bridgeRun(['open-url',target]);return send(res,200,{ok:true,action:'open-url'});
   }
   if(url==='/api/device/dial'&&req.method==='POST'){
    requirePermission(await readPermissions(),'device_dial');const {number}=await body(req);if(typeof number!=='string'||!/^[0-9+*#() -]{3,30}$/.test(number))return send(res,400,{error:'Invalid phone number.'});await bridgeRun(['dial',number]);return send(res,200,{ok:true,action:'dial'});
   }
   if(url==='/api/device/notify'&&req.method==='POST'){
    requirePermission(await readPermissions(),'device_notifications');const {title,text}=await body(req);if(typeof title!=='string'||typeof text!=='string'||!title.trim()||!text.trim()||title.length>100||text.length>1000)return send(res,400,{error:'Invalid notification.'});await bridgeRun(['notify',title,text]);return send(res,200,{ok:true,action:'notify'});
   }
   if(url==='/api/device/battery'&&req.method==='GET'){requirePermission(await readPermissions(),'device_battery');const result=await bridgeRun(['battery']);return send(res,200,result);}
   if(url==='/api/device/flashlight'&&req.method==='POST'){requirePermission(await readPermissions(),'device_flashlight');const {on}=await body(req);if(typeof on!=='boolean')return send(res,400,{error:'on must be boolean'});await bridgeRun(['flashlight',on?'on':'off']);return send(res,200,{ok:true,action:'flashlight',on});}
   if(url==='/api/notes'&&req.method==='GET'){requirePermission(await readPermissions(),'memory');return send(res,200,{notes:await notes()});}
   if(url==='/api/notes'&&req.method==='POST'){requirePermission(await readPermissions(),'memory');const {title,content}=await body(req);if(typeof title!=='string'||typeof content!=='string'||!title.trim()||title.length>100||!content.trim()||content.length>4000)return send(res,400,{error:'Title 1–100 and content 1–4000 characters required.'});const list=await notes();if(list.length>=100)return send(res,400,{error:'100-note limit reached.'});list.push({id:crypto.randomUUID(),title:title.trim(),content:content.trim()});await save(list);return send(res,201,{notes:list});}
   if(url==='/api/notes/delete'&&req.method==='POST'){requirePermission(await readPermissions(),'memory');const {id}=await body(req);if(typeof id!=='string')return send(res,400,{error:'Invalid ID'});const list=await notes();if(!list.some(n=>n.id===id))return send(res,404,{error:'Note not found'});const updated=list.filter(n=>n.id!==id);await save(updated);return send(res,200,{notes:updated});}
   if(url==='/api/models/pull'&&req.method==='POST'){const result=await pullPreferredModel();return send(res,200,{status:result.status||'complete'});}
   if(url==='/api/repo/inspect'&&req.method==='POST'){
    const {repository}=await body(req);if(typeof repository!=='string')return send(res,400,{error:'Enter a public GitHub repository.'});const cleaned=repository.trim().replace(/^https:\/\/github\.com\//i,'').replace(/\/$/,'').replace(/\.git$/,'');if(!/^[\w.-]{1,39}\/[\w.-]{1,100}$/.test(cleaned)||cleaned.includes('..'))return send(res,400,{error:'Use owner/repo or its github.com URL.'});const base='https://api.github.com/repos/'+cleaned,headers={'accept':'application/vnd.github+json','user-agent':'Jarvis-Assistant'};const metaResponse=await fetch(base,{headers,signal:AbortSignal.timeout(12000)});if(!metaResponse.ok)return send(res,metaResponse.status===404?404:502,{error:metaResponse.status===404?'Public repository not found.':'GitHub unavailable or rate limited.'});const repo=await metaResponse.json();const listResponse=await fetch(base+'/contents',{headers,signal:AbortSignal.timeout(12000)});const files=listResponse.ok?(await listResponse.json()).map(x=>({name:x.name,type:x.type})).slice(0,100):[];const names=files.map(f=>f.name.toLowerCase());return send(res,200,{fullName:repo.full_name,url:repo.html_url,description:repo.description||'',language:repo.language||'Unknown',defaultBranch:repo.default_branch,updatedAt:repo.pushed_at,files,checks:{readme:names.some(n=>n.startsWith('readme')),license:names.some(n=>n.startsWith('license')),gitignore:names.includes('.gitignore'),tests:names.some(n=>['test','tests','__tests__'].includes(n)),ci:names.includes('.github')},note:'Root files and metadata only. Checks are presence checks, not a security audit.'});
   }
   if(url==='/api/export'&&req.method==='POST'){
    const {type,title,content}=await body(req);if(!['docx','pptx'].includes(type)||typeof title!=='string'||!title.trim()||title.length>120||typeof content!=='string'||!content.trim()||content.length>16000)return send(res,400,{error:'Provide a title and up to 16000 characters of content.'});const out=type==='docx'?makeDocx(title.trim(),content):makePptx(title.trim(),content);res.writeHead(200,{'content-type':type==='docx'?'application/vnd.openxmlformats-officedocument.wordprocessingml.document':'application/vnd.openxmlformats-officedocument.presentationml.presentation','content-disposition':`attachment; filename="jarvis-export.${type}"`,'content-length':out.length,'cache-control':'no-store','x-content-type-options':'nosniff'});return res.end(out);
   }
   if(url==='/api/chat'&&req.method==='POST'){
    requirePermission(await readPermissions(),'chat');const {messages,mode,shareNotes}=await body(req);if(!Array.isArray(messages)||!messages.length||messages.length>16||messages.some(m=>!['user','assistant'].includes(m.role)||typeof m.content!=='string'||m.content.length>4000)||!['offline','online','auto'].includes(mode)||typeof shareNotes!=='boolean')return send(res,400,{error:'Invalid chat request'});
    const result=await runtimeChat({messages,mode,shareNotes,notes:await notes()});return send(res,200,result);
   }
   return send(res,404,{error:'Unknown API route'});
  }catch(e){return send(res,400,{error:error(e)});}
 }
 if(req.method!=='GET')return send(res,405,'Method not allowed','text/plain');
 const files={'/':['index.html','text/html; charset=utf-8'],'/app.js':['app.js','text/javascript; charset=utf-8'],'/style.css':['style.css','text/css; charset=utf-8'],'/avatar.svg':['avatar.svg','image/svg+xml'],'/manifest.webmanifest':['manifest.webmanifest','application/manifest+json'],'/sw.js':['sw.js','text/javascript; charset=utf-8'],'/icon-192.png':['icon-192.png','image/png'],'/icon-512.png':['icon-512.png','image/png']};const f=files[url];if(!f)return send(res,404,'Not found','text/plain');try{return send(res,200,await fs.readFile(path.join(root,f[0])),f[1]);}catch{return send(res,500,'File unavailable','text/plain');}
}).listen(port,host,()=>console.log('Jarvis: http://'+host+':'+port));
