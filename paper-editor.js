/* Both editors retain the same Markdown storage format. */
function splitPaperEditor(body){
 const blocks=Array(7).fill('');let index=0,inCode=false;
 for(const line of paperBody(body).split('\n')){
  if(line.trim().startsWith('```'))inCode=!inCode;
  const match=!inCode&&line.match(/^## (0[1-7]) /);
  if(match){index=Number(match[1])-1;continue}blocks[index]+=line+'\n';
 }
 return blocks.map(s=>s.trim());
}
function mountPaperEditor(form,isPaper){
 const body=form.elements.body,label=body.closest('label');form.querySelector('.paper-fields')?.remove();label.hidden=isPaper;body.required=!isPaper;
 const help=form.querySelector('p.tiny');if(help)help.hidden=isPaper;
 if(!isPaper)return;
 form.closest('dialog').classList.add('structured-editor');
 const blocks=splitPaperEditor(body.value),fields=['论文标题','中文标题','开源代码'],values=['','',''],rest=[];
 for(const line of blocks[0].split('\n')){const match=line.match(/^\s*(?:[-*]\s+)?(?:\*\*)?(论文标题|中文标题|开源代码)[：:]\s*(?:\*\*)?\s*(.*)$/);if(match&&values[fields.indexOf(match[1])]==='')values[fields.indexOf(match[1])]=match[2];else rest.push(line)}
 const hints=['','这篇论文要解决什么问题？现有方法的局限是什么？','核心思路、模型结构或关键方法。','从数据准备到训练，再到推理的完整过程。','相对已有工作，哪些地方有新的贡献？','数据集、评价指标、对比结果与消融实验。','适合哪些任务？还有什么局限与后续想法？'];
 const panel=document.createElement('div');panel.className='paper-fields';
 panel.innerHTML='<div class="paper-editor-intro"><span>论文阅读工作台</span><small>按模块记录 · 所有模块均可留空</small></div>'+blocks.map((b,i)=>`<details class="paper-block" ${i===0?'open':''}><summary><span class="block-number">${String(i+1).padStart(2,'0')}</span><span>${esc(PAPER_SECTIONS[i])}</span><small class="block-state"></small></summary><div class="block-content">${i===0?`<div class="paper-basics">${fields.map((name,j)=>`<label>${name}<input data-basic="${j}" value="${esc(values[j])}" placeholder="${j===2?'代码仓库地址（选填）':'选填'}"></label>`).join('')}</div><label>其他基础信息<textarea data-section="0" rows="3" placeholder="作者、会议、年份，或其他补充信息">${esc(rest.join('\n').trim())}</textarea></label>`:`<label><span class="field-hint">${hints[i]}</span><textarea data-section="${i}" rows="5" placeholder="写下你的理解，也可以暂时留空…">${esc(b)}</textarea></label>`}</div></details>`).join('');
 label.after(panel);
 const sync=()=>{const content=Array.from(panel.querySelectorAll('[data-section]')).map(t=>t.value);const basic=Array.from(panel.querySelectorAll('[data-basic]')).map((input,i)=>`- **${fields[i]}：** ${input.value}`);content[0]=basic.join('\n')+'\n\n'+content[0];body.value=content.map((s,i)=>`## ${String(i+1).padStart(2,'0')} ${PAPER_SECTIONS[i]}\n\n${s.trim()}`).join('\n\n');panel.querySelectorAll('.paper-block').forEach((block,i)=>{const filled=Array.from(block.querySelectorAll('input,textarea')).some(t=>t.value.trim());block.querySelector('.block-state').textContent=filled?'已填写':'可留空';});};
 panel.addEventListener('input',sync);panel._sync=sync;sync();
}
for(const [formId,openId] of [['note-form','write'],['edit-form','edit-note']]){
 const editorForm=document.getElementById(formId);if(!editorForm)continue;
 const isPaper=()=>formId==='edit-form'?note?.category==='论文阅读':editorForm.elements.category.value==='论文阅读';
 const mount=()=>mountPaperEditor(editorForm,isPaper());
 document.getElementById(openId).addEventListener('click',mount);
 editorForm.elements.category?.addEventListener('change',mount);
 // Capture runs before existing autosave and submit handlers.
 editorForm.addEventListener('input',()=>editorForm.querySelector('.paper-fields')?._sync(),true);
 editorForm.addEventListener('submit',()=>editorForm.querySelector('.paper-fields')?._sync(),true);
 editorForm.addEventListener('reset',()=>editorForm.querySelector('.paper-fields')?.remove());
 if(editorForm.closest('dialog').open)mount();
}
