/* Public notes live in GitHub. Authorization is kept only for this tab session. */
const Cloud = (() => {
  const endpoint='https://api.github.com/repos/cosmos486/website-note/contents/data/notes.json';
  const pendingKey='cosmos-pending-v1', remoteKey='cosmos-remote-v1', tokenKey='cosmos-github-session';
  const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))||fallback}catch{return fallback}};
  let pending=read(pendingKey,{}), remote=read(remoteKey,[]), token='', busy=false, message='';
  try{token=sessionStorage.getItem(tokenKey)||''}catch{}
  const same=(a,b)=>JSON.stringify(a||null)===JSON.stringify(b||null);
  const valid=a=>Array.isArray(a)&&a.every(n=>n&&['id','title','body','category','date'].every(k=>typeof n[k]==='string'));
  const encode=s=>{let b='';for(const v of new TextEncoder().encode(s))b+=String.fromCharCode(v);return btoa(b)};
  const decode=s=>new TextDecoder().decode(Uint8Array.from(atob(s.replace(/\s/g,'')),c=>c.charCodeAt(0)));
  async function request(method='GET',body){
    const r=await fetch(endpoint+(method==='GET'?'?ref=main&t='+Date.now():''),{method,cache:'no-store',headers:{Accept:'application/vnd.github+json',...(token?{Authorization:'Bearer '+token}:{}),'X-GitHub-Api-Version':'2022-11-28'},...(body?{body:JSON.stringify(body)}:{})});
    if(r.status===404&&method==='GET')return {sha:null,items:[]};
    if(!r.ok){const e=new Error(r.status===401?'授权已失效，请重新连接 GitHub':r.status===403?'无写入权限或请求受限，请检查授权':`GitHub 请求失败（${r.status}），内容仍在本机`);e.status=r.status;throw e}
    const d=await r.json();if(method!=='GET')return d;
    const items=JSON.parse(decode(d.content||''));if(!valid(items))throw Error('云端笔记格式异常，已停止同步以保护内容');return {sha:d.sha,items};
  }
  function status(){const b=document.getElementById('cloud-status');if(b)b.textContent=busy?'正在同步…':Object.keys(pending).length?`${Object.keys(pending).length} 篇待同步 · ${token?'重试':'连接 GitHub'}`:token?'GitHub 已连接':'连接 GitHub';const m=document.getElementById('cloud-message');if(m)m.textContent=message||'保存后自动上传到公开仓库；未连接时先保存在本机。'}
  function changed(){window.dispatchEvent(new Event('cosmos-cloud-change'));status()}
  function merge(items){
    // Preserve unsent legacy notes and pending edits; replace only unchanged cached copies.
    const map=new Map(notes.map(n=>[n.id,n]));
    for(const n of items){const old=map.get(n.id),base=remote.find(x=>x.id===n.id)||seed.find(x=>x.id===n.id);if(!pending[n.id]&&(!old||same(old,base)||same(old,n)))map.set(n.id,n)}
    for(const entry of Object.values(pending))map.set(entry.note.id,entry.note);
    notes=[...map.values()];localStorage.setItem(KEY,JSON.stringify(notes));remote=items;localStorage.setItem(remoteKey,JSON.stringify(remote));changed();
  }
  function put(n){
    const next={...pending,[n.id]:{note:n,base:pending[n.id]?.base??remote.find(x=>x.id===n.id)??null}};
    localStorage.setItem(pendingKey,JSON.stringify(next));pending=next;
    notes=[n,...notes.filter(x=>x.id!==n.id)];localStorage.setItem(KEY,JSON.stringify(notes));message='已保存到本机，等待上传';changed();void flush();
  }
  async function flush(){
    if(busy||!token||!Object.keys(pending).length){status();return}busy=true;status();
    try{
      while(Object.keys(pending).length){
        const id=Object.keys(pending)[0],entry=pending[id];let done=false;
        for(let attempt=0;attempt<3&&!done;attempt++){
          const current=await request(),existing=current.items.find(n=>n.id===id);
          if(!same(existing,entry.note)&&!same(existing,entry.base))throw Error('同一篇笔记在其他设备上已修改。本机版本已保留，请先导出备份并对照云端，避免覆盖。');
          const items=[entry.note,...current.items.filter(n=>n.id!==id)];
          if(!same(existing,entry.note)){
            const content=encode(JSON.stringify(items,null,2));if(content.length>1200000)throw Error('笔记总量超过当前同步容量，请导出备份');
            try{await request('PUT',{message:'Save note: '+entry.note.title,content,branch:'main',...(current.sha?{sha:current.sha}:{})})}catch(e){if((e.status===409||e.status===422)&&attempt<2)continue;throw e}
          }
          if(pending[id]===entry)delete pending[id];else pending[id].base=entry.note;
          localStorage.setItem(pendingKey,JSON.stringify(pending));merge(items);done=true;
        }
      }
      message='已同步到 GitHub，其他设备可读取；网页发布可能稍有延迟。';
    }catch(e){message=e.message}finally{busy=false;status()}
  }
  async function refresh(){try{const d=await request();merge(d.items);message='已读取 GitHub 笔记';await flush()}catch(e){message=e.message}status()}
  function mount(){
    const bar=document.createElement('div');bar.className='cloud-bar';bar.innerHTML='<button class="tag" id="cloud-status"></button><span id="cloud-message" role="status"></span>';
    document.querySelector('main').prepend(bar);
    const dialog=document.createElement('dialog');dialog.id='cloud-dialog';dialog.innerHTML=`<button type="button" class="close" aria-label="关闭">×</button><h2>连接 GitHub</h2><p>连接后，新增和修改笔记会自动上传到 <strong>cosmos486/website-note</strong>，内容公开可见。</p><p>在 GitHub 创建 Fine-grained token：只选择 website-note 仓库，将 Repository permissions → Contents 设为 Read and write。</p><p><a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener noreferrer">前往 GitHub 创建授权 ↗</a></p><form><label>GitHub 授权令牌<input type="password" name="token" autocomplete="off" required placeholder="仅发送给 GitHub"></label><p class="tiny">令牌仅保留在当前标签页会话中，关闭后需重新连接。不要发送到聊天或写入公开代码。</p><button class="primary">连接并同步待上传笔记</button></form><button class="text-button" id="cloud-all">上传本机已有笔记</button><button class="text-button" id="cloud-disconnect">断开连接</button><p id="cloud-help" role="status"></p>`;
    document.body.append(dialog);dialog.querySelector('.close').onclick=()=>dialog.close();
    document.getElementById('cloud-status').onclick=()=>{dialog.showModal();if(token)void flush()};
    dialog.querySelector('form').onsubmit=async e=>{e.preventDefault();token=e.target.elements.token.value.trim();try{sessionStorage.setItem(tokenKey,token)}catch{}e.target.reset();await refresh();document.getElementById('cloud-help').textContent=message};
    document.getElementById('cloud-all').onclick=()=>{try{for(const n of [...notes])if(!same(n,remote.find(x=>x.id===n.id))&&!same(n,seed.find(x=>x.id===n.id)))put(n);document.getElementById('cloud-help').textContent=token?'正在上传，结果见页面同步状态':'已加入待上传队列，请先连接 GitHub'}catch{document.getElementById('cloud-help').textContent='本机存储失败，请先导出备份'}};
    document.getElementById('cloud-disconnect').onclick=()=>{token='';try{sessionStorage.removeItem(tokenKey)}catch{}message='已断开，待上传笔记保留在本机';status();dialog.close()};
    status();void refresh();
  }
  window.addEventListener('online',()=>void refresh());
  window.addEventListener('DOMContentLoaded',mount);
  return {put,flush,refresh};
})();
