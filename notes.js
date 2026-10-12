const seed=[{id:'example-1',title:'从一张图像出发：我的图像检索学习地图',category:'学习笔记',date:'示例笔记',body:'这是一篇示例笔记，用来展示你的博客效果。你可以删除它，写下自己的学习过程。\n\n图像检索要回答一个直观的问题：给定一张图片，如何找到内容相近的图片？\n\n可以从三个环节梳理学习路线：\n1. 特征表示：把图像转化为可比较的向量。\n2. 相似度度量：理解余弦相似度与距离的含义。\n3. 检索评估：结合 Recall@K 等指标判断效果。\n\n接下来，把阅读、实验与观察记录在这里。',excerpt:'从特征表示、相似度度量到检索评估，搭建一条清晰的学习路线。每个问题，都值得从最基本的概念开始。',tag:'图像检索'},{id:'example-2',title:'读论文时，先带着一个问题',category:'论文阅读',date:'示例笔记',body:'这是一篇阅读模板示例，不代表已经完成的研究成果。\n\n论文标题：\n作者与出处：\n\n一、它想解决什么问题？\n记录任务定义、使用场景与现有方法的局限。\n\n二、核心方法是什么？\n试着用自己的语言解释输入、处理过程和输出。\n\n三、证据是否充分？\n关注数据集、对比方法、消融实验与适用条件。\n\n四、我的疑问与下一步\n把不理解的部分变成下一次探索的起点。',excerpt:'问题、方法、证据，以及自己的疑问。给论文阅读留下一份可以回顾、可以继续追问的记录。',tag:'计算机视觉'},{id:'example-3',title:'给想法留一个生长的地方',category:'随想',date:'示例笔记',body:'欢迎来到 Cosmos 的个人空间。\n\n这是可以删除的示例文章。\n\n这里可以记录一个刚弄明白的概念、一次实验里的意外发现，或者还没有答案的问题。\n\n不必等想法完整了才开始写。先记录，再慢慢连接。',excerpt:'一个个人空间的开始：收集问题，记录理解，也给还没成形的想法留一点余地。',tag:'日常记录'}];
const $=s=>document.querySelector(s);const KEY='cosmos-notes-v1';let notes,filter='全部',archive=false,currentId;const safeRead=k=>{try{return localStorage.getItem(k)}catch{return null}};try{const raw=JSON.parse(safeRead(KEY));notes=Array.isArray(raw)?raw:seed}catch{notes=seed}const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const PAPER_SECTIONS=['论文基础信息','论文要解决的核心问题','核心解决方案','训练 / 推理完整流程','核心创新点','实验效果','适用场景与扩展'];
function paperBody(body=''){
 const sections=PAPER_SECTIONS.map(()=>[]),extra=[];let target=sections[0],inCode=false;
 const aliases={'它想解决什么问题？':1,'核心方法是什么？':2,'证据是否充分？':5,'我的疑问与下一步':6};
 for(const line of body.split(/\r?\n/)){
  if(line.trim().startsWith('```')){inCode=!inCode;target.push(line);continue}
  const heading=!inCode&&(line.match(/^#{1,2}\s+(.+)$/)||line.match(/^(?:[一二三四五六七八九十]+、|\d{2}\s+)(.+)$/));
  if(heading){const title=heading[1].replace(/^\d{2}\s+/,'').trim();let index=PAPER_SECTIONS.findIndex(s=>s.replace(/\s/g,'')===title.replace(/\s/g,''));if(index<0&&Object.hasOwn(aliases,title))index=aliases[title];if(index>=0){target=sections[index];continue}target=extra;}
  target.push(line);
 }
 if(!sections[0].join('').trim())sections[0]=['- **论文标题：**','- **中文标题：**','- **开源代码：**'];
 const result=sections.map((lines,i)=>`## ${String(i+1).padStart(2,'0')} ${PAPER_SECTIONS[i]}\n\n${lines.join('\n').trim()}`).join('\n\n');
 return result+(extra.length?'\n\n'+extra.join('\n').trim():'');
}
