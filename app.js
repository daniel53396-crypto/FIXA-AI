const $ = (s) => document.querySelector(s);
const loader = $('#loader'), app = $('#app'), loadPercent = $('#loadPercent');
let attachedImage = null, lastAssistantText = '', studioOriginal = null, studioFileName = 'fix-ai-edit.png';
let history = [];

let progress = 0;
const loadTimer = setInterval(() => {
  progress = Math.min(100, progress + Math.ceil(Math.random() * 11));
  loadPercent.textContent = progress + '%';
  $('.loader-track span').style.width = progress + '%';
  if (progress >= 100) {
    clearInterval(loadTimer);
    setTimeout(() => { loader.style.opacity = '0'; setTimeout(() => { loader.classList.add('hidden'); app.classList.remove('hidden'); }, 450); }, 250);
  }
}, 130);

function switchView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
  $('#'+name+'View').classList.remove('hidden');
  document.querySelectorAll('.tool').forEach(b => b.classList.toggle('active', b.dataset.tool === name));
  $('#pageTitle').textContent = ({chat:'Chat with Fix AI', image:'Image Studio', voice:'Voice & language'})[name];
}
document.querySelectorAll('.tool').forEach(b => b.addEventListener('click', () => switchView(b.dataset.tool)));
$('#newChat').addEventListener('click', () => { history = []; $('#messages').innerHTML = ''; $('#welcome').classList.remove('hidden'); $('#prompt').value = ''; switchView('chat'); });

document.querySelectorAll('[data-prompt]').forEach(b => b.addEventListener('click', () => { $('#prompt').value = b.dataset.prompt; $('#prompt').focus(); }));
function addMessage(role, text, imageData) {
  $('#welcome').classList.add('hidden');
  const row = document.createElement('div'); row.className = 'message ' + role;
  const mark = document.createElement('div'); mark.className = 'bubble-mark'; mark.textContent = role === 'user' ? 'YOU' : 'F';
  const bubble = document.createElement('div'); bubble.className = 'bubble'; bubble.textContent = text;
  if (imageData) { const img = document.createElement('img'); img.src = imageData; img.alt = 'Uploaded image'; bubble.appendChild(img); }
  row.append(mark, bubble); $('#messages').appendChild(row); $('#messages').scrollTop = $('#messages').scrollHeight;
  return {row, bubble};
}
function setThinking() {
  const row = document.createElement('div'); row.className = 'message assistant'; row.id = 'thinkingRow';
  row.innerHTML = '<div class="bubble-mark">F</div><div class="bubble"><span class="thinking">Fix AI thinking<span class="dots">…</span></span></div>';
  $('#messages').appendChild(row); $('#messages').scrollTop = $('#messages').scrollHeight;
}
async function sendMessage() {
  const text = $('#prompt').value.trim();
  if (!text && !attachedImage) return;
  const imageData = attachedImage?.dataUrl || null;
  addMessage('user', text || 'Please look at this image.', imageData);
  history.push({role:'user', content:text || 'Please look at this image.'});
  $('#prompt').value = ''; $('#prompt').style.height = 'auto';
  $('#attachmentPreview').classList.add('hidden'); $('#attachmentPreview').innerHTML = '';
  attachedImage = null; $('#sendBtn').disabled = true; setThinking();
  try {
    const payload = {message:text || 'Please describe this image.', history:history.slice(-12), language:$('#language').value};
    if (imageData) payload.image = imageData;
    const res = await fetch('/api/chat', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    const answer = data.answer || 'I could not generate a response. Please try again.';
    history.push({role:'assistant',content:answer}); lastAssistantText = answer;
    $('#thinkingRow')?.remove(); addMessage('assistant', answer);
  } catch (err) {
    $('#thinkingRow')?.remove();
    const msg = err.message.includes('Failed to fetch') || err.message.includes('NetworkError')
      ? 'I could not connect to the AI server. Start the website server and add your API key in the .env file. See README.md.'
      : err.message;
    addMessage('assistant', 'Fix AI could not answer: ' + msg);
  } finally { $('#sendBtn').disabled = false; $('#prompt').focus(); }
}
$('#sendBtn').addEventListener('click', sendMessage);
$('#prompt').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } });
$('#prompt').addEventListener('input', () => { $('#prompt').style.height = 'auto'; $('#prompt').style.height = Math.min($('#prompt').scrollHeight,140)+'px'; });

function handleChatImage(file) {
  if (!file || !file.type.startsWith('image/')) return;
  if (file.size > 8 * 1024 * 1024) { alert('Please choose an image smaller than 8 MB.'); return; }
  const reader = new FileReader();
  reader.onload = () => {
    attachedImage = {file, dataUrl:reader.result};
    $('#attachmentPreview').classList.remove('hidden');
    $('#attachmentPreview').innerHTML = '';
    const img = document.createElement('img'); img.src = reader.result;
    const label = document.createElement('span'); label.textContent = file.name;
    const remove = document.createElement('button'); remove.textContent = 'Remove'; remove.onclick = () => { attachedImage=null; $('#attachmentPreview').classList.add('hidden'); };
    $('#attachmentPreview').append(img,label,remove);
  };
  reader.readAsDataURL(file);
}
$('#imageInput').addEventListener('change', e => handleChatImage(e.target.files[0]));

function getSpeechLang() {
  const selected = $('#language').value;
  if (selected !== 'auto') return selected;
  const text = $('#prompt').value;
  return /[\u0B80-\u0BFF]/.test(text) ? 'ta-IN' : 'en-US';
}
function startSpeech() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { $('#micStatus').textContent = 'Speech recognition is not supported in this browser. Try Chrome on a supported device.'; $('#voiceHelp').textContent = 'Speech recognition is unavailable in this browser. You can still type and use read-aloud if supported.'; return; }
  const rec = new SR(); rec.lang = getSpeechLang(); rec.interimResults = false; rec.maxAlternatives = 1;
  $('#micStatus').textContent = 'Listening… speak now';
  rec.onresult = e => { $('#prompt').value = ($('#prompt').value + ' ' + e.results[0][0].transcript).trim(); $('#prompt').dispatchEvent(new Event('input')); $('#micStatus').textContent = 'Voice captured — press send'; };
  rec.onerror = e => { $('#micStatus').textContent = 'Microphone: ' + e.error + '. Check permission and try again.'; };
  rec.onend = () => { if ($('#micStatus').textContent === 'Listening… speak now') $('#micStatus').textContent = 'Enter to send · Shift+Enter for a new line'; };
  rec.start();
}
$('#voiceInput').addEventListener('click', startSpeech);
$('#startVoice').addEventListener('click', () => { switchView('chat'); startSpeech(); });
function speak(text) {
  if (!text) { $('#voiceHelp').textContent = 'Send a message first, then try reading the answer aloud.'; return; }
  if (!('speechSynthesis' in window)) { $('#voiceHelp').textContent = 'Text-to-speech is not supported by this browser.'; return; }
  speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = $('#language').value === 'auto' ? 'en-US' : $('#language').value;
  speechSynthesis.speak(utter);
}
$('#speakLast').addEventListener('click', () => speak(lastAssistantText));

// Image Studio: local rename, basic filter controls and download.
$('#studioInput').addEventListener('change', e => loadStudioImage(e.target.files[0]));
$('#dropZone').addEventListener('dragover', e => { e.preventDefault(); $('#dropZone').style.borderColor = '#f1d38a'; });
$('#dropZone').addEventListener('drop', e => { e.preventDefault(); loadStudioImage(e.dataTransfer.files[0]); });
function loadStudioImage(file) {
  if (!file || !file.type.startsWith('image/')) return;
  if (file.size > 15 * 1024 * 1024) { alert('Please choose an image smaller than 15 MB.'); return; }
  const reader = new FileReader();
  reader.onload = () => {
    studioOriginal = new Image();
    studioOriginal.onload = () => {
      $('#studioImage').src = reader.result; studioFileName = file.name;
      $('#imageName').value = file.name.replace(/\.[^.]+$/,'') || 'fix-ai-edit';
      $('#dropZone').classList.add('hidden'); $('#editor').classList.remove('hidden'); applyFilters();
    };
    studioOriginal.src = reader.result;
  };
  reader.readAsDataURL(file);
}
function applyFilters() {
  $('#studioImage').style.filter = `brightness(${$('#brightness').value}%) contrast(${$('#contrast').value}%) saturate(${$('#saturation').value}%)`;
}
['brightness','contrast','saturation'].forEach(id => $('#'+id).addEventListener('input', applyFilters));
$('#resetImage').addEventListener('click', () => { $('#brightness').value=100; $('#contrast').value=100; $('#saturation').value=100; applyFilters(); });
$('#downloadImage').addEventListener('click', () => {
  if (!studioOriginal) return;
  const canvas = document.createElement('canvas'); canvas.width=studioOriginal.naturalWidth; canvas.height=studioOriginal.naturalHeight;
  const ctx=canvas.getContext('2d');
  ctx.filter=`brightness(${$('#brightness').value}%) contrast(${$('#contrast').value}%) saturate(${$('#saturation').value}%)`;
  ctx.drawImage(studioOriginal,0,0);
  const a=document.createElement('a'); a.href=canvas.toDataURL('image/png');
  const name=($('#imageName').value.trim() || 'fix-ai-edit').replace(/[\\/:*?"<>|]/g,'_');
  a.download=name.toLowerCase().endsWith('.png')?name:name+'.png'; a.click();
});
