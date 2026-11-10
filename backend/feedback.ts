import {SemanticError} from './semantic.ts';
export type FeedbackEnv={FEEDBACK_DB?:D1Database;TAGGING_REVIEW_KEY?:string;FEEDBACK_LIMITER?:{limit:(input:{key:string})=>Promise<{success:boolean}>}};
const kinds=['good-match','not-for-me','incorrect-tag','incorrect-content-rating','incorrect-details','suggest-similar'];
function text(value:unknown,max:number,required=false){if(typeof value!=='string'||value.length>max||(required&&!value.trim()))throw new SemanticError(400,'Invalid feedback fields.');return value.trim();}
export function validateFeedback(input:any){
 if(!input||typeof input!=='object'||!kinds.includes(input.kind)||!['Book','Movie','TV'].includes(input.type))throw new SemanticError(400,'Choose a valid title and feedback type.');
 const submissionId=text(input.submissionId,36,true);if(!/^[0-9a-f-]{36}$/i.test(submissionId))throw new SemanticError(400,'Invalid submission identifier.');
 return {submissionId,itemId:text(input.itemId,150,true),title:text(input.title,300,true),type:input.type,kind:input.kind,reason:text(input.reason,280),seedId:text(input.seedId||'',150),seedTitle:text(input.seedTitle||'',300)};
}
export function validateReview(input:any){
 if(!Number.isSafeInteger(input?.id)||input.id<1||!['new','reviewed','rejected'].includes(input.status)||typeof input.evaluationApproved!=='boolean')throw new SemanticError(400,'Invalid review decision.');
 if(input.evaluationApproved&&input.status!=='reviewed')throw new SemanticError(400,'Only reviewed feedback can be approved for evaluation.');
 return {id:input.id,status:input.status,evaluationApproved:input.evaluationApproved,note:text(input.note,500)};
}
async function body(request:Request){
 const reader=request.body?.getReader();if(!reader)throw new SemanticError(400,'Missing request.');let size=0,result='';const decoder=new TextDecoder();
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>5000){await reader.cancel();throw new SemanticError(413,'Feedback is too long.');}result+=decoder.decode(value,{stream:true});}
 try{return JSON.parse(result);}catch{throw new SemanticError(400,'Invalid feedback request.');}
}
export async function handleFeedback(request:Request,env:FeedbackEnv){
 const url=new URL(request.url),privateRoute=url.pathname!=='/feedback';
 if(privateRoute&&(!env.TAGGING_REVIEW_KEY||request.headers.get('Authorization')!==`Bearer ${env.TAGGING_REVIEW_KEY}`))throw new SemanticError(401,'Enter your reviewer key to open the inbox.');
 if(!env.FEEDBACK_DB)throw new SemanticError(503,'Shared feedback is not configured yet. Your feedback can still be saved in this browser.');
 if(url.pathname==='/feedback'&&request.method==='POST'){
  if(!env.FEEDBACK_LIMITER)throw new SemanticError(503,'Feedback submission is not configured yet.');
  const ip=request.headers.get('CF-Connecting-IP')||'unknown';
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(ip)))).map(x=>x.toString(16).padStart(2,'0')).join('');
  if(!(await env.FEEDBACK_LIMITER.limit({key:'feedback:'+hash})).success)throw new SemanticError(429,'Please wait a minute before sending more feedback.');
  const data=validateFeedback(await body(request));
  await env.FEEDBACK_DB.prepare('INSERT OR IGNORE INTO feedback (submission_id,item_id,title,media_type,kind,reason,seed_id,seed_title,created_at) VALUES (?,?,?,?,?,?,?,?,?)').bind(data.submissionId,data.itemId,data.title,data.type,data.kind,data.reason,data.seedId,data.seedTitle,new Date().toISOString()).run();
  return {received:true,submissionId:data.submissionId};
 }
 if(url.pathname==='/feedback/inbox'&&request.method==='GET'){
  const before=Number(url.searchParams.get('before')||Number.MAX_SAFE_INTEGER);if(!Number.isSafeInteger(before)||before<1)throw new SemanticError(400,'Invalid inbox page.');
  const result=await env.FEEDBACK_DB.prepare('SELECT * FROM feedback WHERE id < ? ORDER BY id DESC LIMIT 51').bind(before).all();
  const rows=result.results.slice(0,50);return {items:rows,next:result.results.length>50?rows.at(-1)?.id:null};
 }
 if(url.pathname==='/feedback/review'&&request.method==='POST'){
  const data=validateReview(await body(request));const now=new Date().toISOString();
  const found=await env.FEEDBACK_DB.prepare('SELECT id FROM feedback WHERE id=?').bind(data.id).first();if(!found)throw new SemanticError(404,'Feedback no longer exists.');
  await env.FEEDBACK_DB.batch([
   env.FEEDBACK_DB.prepare('UPDATE feedback SET review_status=?,evaluation_approved=?,review_note=?,reviewed_at=? WHERE id=?').bind(data.status,Number(data.evaluationApproved),data.note,now,data.id),
   env.FEEDBACK_DB.prepare('INSERT INTO feedback_reviews(feedback_id,status,evaluation_approved,note,created_at) VALUES(?,?,?,?,?)').bind(data.id,data.status,Number(data.evaluationApproved),data.note,now)
  ]);return {saved:true};
 }
 throw new SemanticError(405,'Method not allowed.');
}

