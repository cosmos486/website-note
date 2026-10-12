const noteId=new URLSearchParams(location.search).get('id');let note=notes.find(n=>n.id===noteId);let observer;
function inline(text){return esc(text).replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/`([^`]+)`/g,'<code>$1</code>')}
function renderNote(){
 if(!note){$('#note-title').textContent='没有找到这篇笔记';$('#note-summary').textContent='本机笔记只能在保存它的浏览器中打开。';$('#note-content').textContent='请返回所有笔记，检查笔记是否已删除，或先导入你的备份。';$('#edit-note').hidden=true;$('#delete-note').hidden=true;return}
 document.title=note.title+' · Cosmos';$('#note-title').textContent=note.title;$('#note-kind').textContent=note.category==='论文阅读'?'PAPER NOTE':'PERSONAL NOTE';$('#note-summary').textContent=note.excerpt||'';$('#note-meta').textContent=`${note.date} · ${note.category} · 约 ${Math.max(1,Math.ceil(note.body.length/400))} 分钟阅读`;$('#note-tags').innerHTML=`<span class="tag">${esc(note.tag||note.category)}</span>`;
 const headings=[];let out='',paragraph=[],listType='',code=null;
 const flush=()=>{if(paragraph.length){out+='<p>'+paragraph.map(inline).join('<br>')+'</p>';paragraph=[]}if(listType){out+=`</${listType}>`;listType=''}};
 for(const line of note.body.split(/\r?\n/)){
  if(line.trim().startsWith('```')){flush();if(code===null)code=[];else{out+='<pre><code>'+esc(code.join('\n'))+'</code></pre>';code=null}continue}
  if(code!==null){code.push(line);continue}
  const heading=line.match(/^(#{1,3})\s+(.+)$/)||line.match(/^([一二三四五六七八九十]+、)(.+)$/)||line.match(/^(\d{2}\s+)(.+)$/);
  if(heading){flush();const id='section-'+(headings.length+1),level=heading[1]==='###'?3:2;const title=heading[2];headings.push({id,title,level});out+=`<h${level} id="${id}">${inline(title)}</h${level}>`;continue}
  const item=line.match(/^\s*(?:([-*])|\d+[.、])\s+(.+)$/);if(item){if(paragraph.length){out+='<p>'+paragraph.map(inline).join('<br>')+'</p>';paragraph=[]}const kind=item[1]?'ul':'ol';if(listType!==kind){if(listType)out+=`</${listType}>`;out+=`<${kind}>`;listType=kind}out+='<li>'+inline(item[2])+'</li>';continue}
  if(listType){out+=`</${listType}>`;listType=''}if(!line.trim())flush();else paragraph.push(line);
 }
 flush();if(code!==null)out+='<pre><code>'+esc(code.join('\n'))+'</code></pre>';
 $('#note-content').innerHTML=out;$('#toc').innerHTML=headings.length?headings.map(h=>`<a class="${h.level===3?'toc-child':''}" href="#${h.id}">${esc(h.title)}</a>`).join(''):'<a href="#note-content">正文</a>';
 if(observer)observer.disconnect();if('IntersectionObserver' in window){observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){$('#toc').querySelectorAll('a').forEach(a=>a.classList.toggle('active',a.hash==='#'+entry.target.id))}},{rootMargin:'-5% 0px -65% 0px'});headings.forEach(h=>observer.observe(document.getElementById(h.id)))}
}
if(safeRead('cosmos-theme')==='dark')document.body.classList.add('dark');$('#theme').onclick=()=>{document.body.classList.toggle('dark');try{localStorage.setItem('cosmos-theme',document.body.classList.contains('dark')?'dark':'light')}catch{}};
$('#edit-note').onclick=()=>{const f=$('#edit-form');f.elements.title.value=note.title;f.elements.body.value=note.body;$('#edit-dialog').showModal()};$('.close').onclick=()=>$('#edit-dialog').close();
$('#edit-form').onsubmit=e=>{e.preventDefault();const f=e.target,title=f.elements.title.value.trim(),body=f.elements.body.value.trim();if(!title||!body)return;const updated={...note,title,body,excerpt:body.replace(/^#+\s*/gm,'').slice(0,110)};const updatedNotes=notes.map(n=>n.id===note.id?updated:n);try{localStorage.setItem(KEY,JSON.stringify(updatedNotes));notes=updatedNotes;note=updated;renderNote();$('#edit-dialog').close()}catch{$('#edit-message').textContent='存储失败，编辑内容已保留在这里，请复制备份。'}};
$('#delete-note').onclick=()=>{if(!confirm('删除当前浏览器中的这篇笔记？此操作不会修改 GitHub 上的文章。'))return;try{localStorage.setItem(KEY,JSON.stringify(notes.filter(n=>n.id!==note.id)));location.href='index.html#main'}catch{alert('本机存储不可用，未删除笔记。')}};
renderNote();
