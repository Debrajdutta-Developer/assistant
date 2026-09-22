const $ = id => document.getElementById(id);
const messages = []; let voiceOn = true, recognition;
const bubble = (content, role) => { const el = document.createElement('div'); el.className = `bubble ${role}`; el.textContent = content; $('chat').append(el); $('chat').scrollTop = $('chat').scrollHeight; return el; };
const activity = value => { $('activity').textContent = value; $('portrait').classList.toggle('speaking', value === 'Speaking'); $('portrait').classList.toggle('listening', value === 'Listening'); };
let accessToken = ''; const api = (url, options = {}) => fetch(url, { ...options, headers: { ...(options.headers || {}), 'x-astra-token': accessToken } });
async function connect() { let r = await api('/api/status'); if (r.status === 401) { accessToken = prompt('Enter the Astra access token configured on your computer:') || ''; r = await api('/api/status'); } if (!r.ok) throw Error('Access denied'); const s = await r.json(); $('status').textContent = s.models.length ? 'Offline ready' : s.onlineConfigured ? 'Online ready' : 'Setup needed'; $('models').textContent = s.models.length ? 'Local: ' + s.models.join(', ') : 'No offline model installed'; await renderNotes(); } connect().catch(e => $('status').textContent = e.message);
function speak(text) { if (!voiceOn || !('speechSynthesis' in window)) return; speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = /[\u0980-\u09ff]/.test(text) ? 'bn-IN' : 'en-IN'; const voices = speechSynthesis.getVoices(); u.voice = voices.find(v => v.lang.startsWith(u.lang.slice(0,2)) && /female|woman/i.test(v.name)) || voices.find(v => v.lang.startsWith(u.lang.slice(0,2))) || null; u.onstart = () => activity('Speaking'); u.onend = () => activity('Ready to talk'); u.onerror = () => activity('Ready to talk'); speechSynthesis.speak(u); }
$('form').addEventListener('submit', async e => { e.preventDefault(); const content = $('input').value.trim(); if (!content) return; $('input').value = ''; bubble(content, 'user'); messages.push({role:'user',content}); activity('Thinking'); const pending = bubble('Thinking…','assistant'); $('form').querySelector('.send').disabled = true; try { const res = await api('/api/chat', { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({messages:messages.slice(-16),mode:$('mode').value,shareNotes:$('shareNotes').checked}) }); const data = await res.json(); if (!res.ok) throw new Error(data.error || 'Request failed'); pending.textContent = data.reply + '\n[' + data.source + ']'; messages.push({role:'assistant',content:data.reply}); speak(data.reply); } catch (err) { pending.textContent = `Error: ${err.message}`; } finally { $('form').querySelector('.send').disabled = false; if (!speechSynthesis.speaking) activity('Ready to talk'); } });
$('mic').onclick = () => { const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SpeechRecognition) { bubble('This browser does not support speech recognition. Type your message instead.','assistant'); return; } if (recognition) { recognition.stop(); return; } recognition = new SpeechRecognition(); recognition.lang = navigator.language || 'bn-IN'; recognition.onresult = e => { $('input').value = e.results[0][0].transcript; $('form').requestSubmit(); }; recognition.onerror = e => bubble(`Microphone: ${e.error}. Check browser microphone permission.`, 'assistant'); recognition.onend = () => { recognition = null; $('mic').classList.remove('active'); activity('Ready to talk'); }; recognition.start(); $('mic').classList.add('active'); activity('Listening'); };
$('sound').onclick = () => { voiceOn = !voiceOn; if (!voiceOn) speechSynthesis.cancel(); $('sound').textContent = voiceOn ? '🔊 Voice on' : '🔇 Voice off'; activity('Ready to talk'); };
$('clear').onclick = () => { messages.length = 0; speechSynthesis.cancel(); $('chat').replaceChildren(); bubble('Chat cleared. What would you like to ask?', 'assistant'); activity('Ready to talk'); };

async function renderPermissions() {
  const host = $('permissionList');
  if (!host) return;
  try {
    const res = await api('/api/permissions');
    const data = await res.json();
    if (!res.ok) throw Error(data.error || 'Could not load permissions.');
    host.replaceChildren();
    for (const [name, meta] of Object.entries(data.capabilities)) {
      const row = document.createElement('div');
      row.className = 'permission-row';
      const text = document.createElement('div');
      const title = document.createElement('strong');
      title.textContent = meta.label;
      const desc = document.createElement('small');
      desc.textContent = meta.description;
      text.append(title, desc);
      const action = document.createElement('button');
      const enabled = Boolean(data.permissions[name]);
      action.textContent = enabled ? 'Enabled' : (meta.oauth ? 'Connect' : 'Off');
      action.className = enabled ? 'permission-on' : '';
      action.disabled = Boolean(meta.oauth) && !data.connectors[meta.oauth];
      if (meta.oauth && !data.connectors[meta.oauth]) action.title = 'Configure this OAuth connector on the Astra server first.';
      action.onclick = async () => {
        const next = !Boolean(data.permissions[name]);
        const r = await api('/api/permissions', {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name,enabled:next})});
        if (!r.ok) { const e=await r.json(); alert(e.error || 'Permission change failed.'); return; }
        await renderPermissions();
      };
      row.append(text, action);
      host.append(row);
    }
  } catch (e) {
    host.textContent = e.message;
  }
}
renderPermissions();
async function renderNotes() { const res=await api('/api/notes'); if(!res.ok)return; const {notes}=await res.json(); $('noteList').replaceChildren(); for(const note of notes){const row=document.createElement('div');row.className='note';const title=document.createElement('strong');title.textContent=note.title;const content=document.createElement('p');content.textContent=note.content;const del=document.createElement('button');del.textContent='Delete';del.onclick=async()=>{if(!confirm('Delete this note?'))return;await api('/api/notes/delete',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({id:note.id})});await renderNotes();};row.append(title,content,del);$('noteList').append(row);}}
$('noteForm').onsubmit=async e=>{e.preventDefault();const res=await api('/api/notes',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({title:$('noteTitle').value,content:$('noteContent').value})});if(!res.ok){alert((await res.json()).error);return;}$('noteForm').reset();await renderNotes();};
$('download').onclick=async()=>{if(!confirm('Download qwen3:0.6b to this computer through Ollama? This uses internet and disk space.'))return;$('download').disabled=true;$('models').textContent='Downloading… this can take several minutes';try{const res=await api('/api/models/pull',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({model:'qwen3:0.6b'})});const data=await res.json();if(!res.ok)throw Error(data.error);await connect();}catch(e){$('models').textContent=e.message;}finally{$('download').disabled=false;}};
let installPrompt;
window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); installPrompt = event; $('install').hidden = false; });
$('install').onclick = async () => { if (!installPrompt) return; installPrompt.prompt(); await installPrompt.userChoice; installPrompt = null; $('install').hidden = true; };
window.addEventListener('appinstalled', () => { $('install').hidden = true; });
if ('serviceWorker' in navigator && window.isSecureContext) navigator.serviceWorker.register('/sw.js').catch(() => {});
window.addEventListener('offline', () => { $('status').textContent = 'Device offline'; });
window.addEventListener('online', () => { connect().catch(() => { $('status').textContent = 'Server unreachable'; }); });
$('repoForm').onsubmit=async event=>{event.preventDefault();$('repoResult').textContent='Checking public repository…';try{const response=await api('/api/repo/inspect',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({repository:$('repoUrl').value})});const info=await response.json();if(!response.ok)throw Error(info.error);$('repoResult').replaceChildren();const heading=document.createElement('strong');heading.textContent=info.fullName+' · '+info.language;const desc=document.createElement('p');desc.textContent=info.description||'No description';const files=document.createElement('p');files.textContent='Root files: '+info.files.map(f=>f.name).join(', ');const checks=document.createElement('p');checks.textContent=Object.entries(info.checks).map(([name,present])=>name+': '+(present?'found':'not found')).join(' · ');const caveat=document.createElement('small');caveat.textContent=info.note;$('repoResult').append(heading,desc,files,checks,caveat);}catch(err){$('repoResult').textContent=err.message;}};
$('useReply').onclick=()=>{const last=[...messages].reverse().find(m=>m.role==='assistant');if(!last){alert('Ask Astra to draft content first.');return;}$('exportBody').value=last.content;};
$('exportForm').onsubmit=async event=>{event.preventDefault();const type=event.submitter?.dataset.type;if(!['docx','pptx'].includes(type))return;const button=event.submitter;button.disabled=true;try{const response=await api('/api/export',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({type,title:$('exportTitle').value,content:$('exportBody').value})});if(!response.ok)throw Error((await response.json()).error);const blob=await response.blob();const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='astra-export.'+type;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}catch(err){alert(err.message);}finally{button.disabled=false;}};
