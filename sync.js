/* Public notes live in GitHub. Authorization is kept only for this tab session. */
const Cloud = (() => {
  const endpoint='https://api.github.com/repos/cosmos486/website-note/contents/data/notes.json';
  const pendingKey='cosmos-pending-v1', remoteKey='cosmos-remote-v1', tokenKey='cosmos-owner-session';
  const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))||fallback}catch{return fallback}};
  let pending=read(pendingKey,{}), remote=read(remoteKey,[]), token='', busy=false, message='';
  try{sessionStorage.removeItem('cosmos-github-session');token=sessionStorage.getItem(tokenKey)||''}catch{}
  const api=window.COSMOS_API||'';
  const auth=new URLSearchParams(location.hash.slice(1));
  if(auth.has('auth')){token=auth.get('auth');try{sessionStorage.setItem(tokenKey,token)}catch{}history.replaceState(null,'',location.pathname+location.search)}
  if(auth.has('auth_error')){message=auth.get('auth_error')==='not_allowed'?'只有 cosmos486 可以上传笔记':'登录未完成，请重试';history.replaceState(null,'',location.pathname+location.search)}
  const same=(a,b)=>JSON.stringify(a||null)===JSON.stringify(b||null);
  const valid=a=>Array.isArray(a)&&a.every(n=>n&&['id','title','body','category','date'].every(k=>typeof n[k]==='string'));
  const encode=s=>{let b='';for(const v of new TextEncoder().encode(s))b+=String.fromCharCode(v);return btoa(b)};
  const decode=s=>new TextDecoder().decode(Uint8Array.from(atob(s.replace(/\s/g,'')),c=>c.charCodeAt(0)));
  async function request(method='GET',body){
    if(method!=='GET'&&!api)throw Error('作者登录服务尚未配置');
    const r=await fetch(method==='GET'?endpoint+'?ref=main&t='+Date.now():api+'/api/notes',{method,cache:'no-store',headers:{Accept:'application/vnd.github+json',...(method!=='GET'&&token?{Authorization:'Bearer '+token}:{}),...(method==='GET'?{'X-GitHub-Api-Version':'2022-11-28'}:{'Content-Type':'application/json'})},...(body?{body:JSON.stringify(body)}:{})});
    if(r.status===404&&method==='GET')return {sha:null,items:[]};
    if(!r.ok){const e=new Error(r.status===401?'授权已失效，请重新登录':r.status===403?'无写入权限或请求受限，请检查授权':`GitHub 请求失败（${r.status}），内容仍在本机`);e.status=r.status;throw e}
    const d=await r.json();if(method!=='GET')return d;
    const items=JSON.parse(decode(d.content||''));if(!valid(items))throw Error('云端笔记格式异常，已停止同步以保护内容');return {sha:d.sha,items};
  }
  function status(){const b=document.getElementById('cloud-status');if(b)b.textContent=busy?'正在同步…':Object.keys(pending).length?`${Object.keys(pending).length} 篇待同步 · ${token?'重试':'作者登录'}`:token?'作者已登录':'作者登录';const m=document.getElementById('cloud-message');if(m)m.textContent=message||'保存后自动上传到公开仓库；未连接时先保存在本机。'}
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
  async function refresh(){try{
    if(token&&api){const me=await fetch(api+'/api/me',{headers:{Authorization:'Bearer '+token},cache:'no-store'});if(me.status===401||me.status===403){token='';try{sessionStorage.removeItem(tokenKey)}catch{}message='登录已过期，请重新使用 GitHub 登录'}else if(!me.ok)throw Error('登录服务暂时不可用，笔记仍保存在本机');else {const user=await me.json();if(user.login!=='cosmos486')throw Error('只有 cosmos486 可以上传笔记')}}
    const d=await request();merge(d.items);if(!message)message='已读取 GitHub 笔记';await flush()
  }catch(e){message=e.message}status()}
  function mount(){
    const bar=document.createElement('div');bar.className='cloud-bar';bar.innerHTML='<button class="tag" id="cloud-status"></button><span id="cloud-message" role="status"></span>';
    document.querySelector('main').prepend(bar);
    const dialog=document.createElement('dialog');dialog.id='cloud-dialog';dialog.innerHTML=`<button type="button" class="close" aria-label="关闭">×</button><h2>作者登录</h2><p>所有人都可以阅读，只有 GitHub 账号 <strong>cosmos486</strong> 登录后可以上传。保存后自动提交到 GitHub。</p><button class="primary" id="cloud-login">使用 GitHub 登录</button><button class="text-button" id="cloud-all">上传本机已有笔记</button><button class="text-button" id="cloud-disconnect">退出登录</button><p id="cloud-help" role="status"></p>`;
    document.body.append(dialog);dialog.querySelector('.close').onclick=()=>dialog.close();
    document.getElementById('cloud-status').onclick=()=>{dialog.showModal();if(token)void flush()};
    document.getElementById('cloud-login').onclick=()=>{if(!api){document.getElementById('cloud-help').textContent='作者登录服务正在配置，草稿仍保存在本机。';return}location.assign(api+'/auth/login?return_to='+encodeURIComponent(location.origin+location.pathname+location.search))};
    document.getElementById('cloud-all').onclick=()=>{try{for(const n of [...notes])if(!same(n,remote.find(x=>x.id===n.id))&&!same(n,seed.find(x=>x.id===n.id)))put(n);document.getElementById('cloud-help').textContent=token?'正在上传，结果见页面同步状态':'已加入待上传队列，请先作者登录'}catch{document.getElementById('cloud-help').textContent='本机存储失败，请先导出备份'}};
    document.getElementById('cloud-disconnect').onclick=()=>{token='';try{sessionStorage.removeItem(tokenKey)}catch{}message='已断开，待上传笔记保留在本机';status();dialog.close()};
    status();void refresh();
  }
  window.addEventListener('online',()=>void refresh());
  window.addEventListener('DOMContentLoaded',mount);
  return {put,flush,refresh};
})();
