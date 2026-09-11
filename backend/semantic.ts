export type SemanticEnv={
 AI?:{run:(model:string,input:{text:string[]})=>Promise<unknown>};
 AI_LIMITER?:{limit:(input:{key:string})=>Promise<{success:boolean}>};
};
export class SemanticError extends Error {
 status:number;
 constructor(status:number,message:string){super(message);this.status=status;}
}
const model='@cf/baai/bge-small-en-v1.5';
const cache=new Map<string,{vector:number[];expires:number}>();
async function readBounded(request:Request){
 const reader=request.body?.getReader();if(!reader)throw new SemanticError(400,'Missing comparison.');
 let size=0;const chunks:Uint8Array[]=[];
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;
  if(size>40000){await reader.cancel();throw new SemanticError(413,'Comparison too large.');}chunks.push(value);}
 const bytes=new Uint8Array(size);let at=0;for(const chunk of chunks){bytes.set(chunk,at);at+=chunk.length;}
 try{return JSON.parse(new TextDecoder().decode(bytes));}catch{throw new SemanticError(400,'Invalid comparison.');}
}
const valid=(x:any)=>x && typeof x.id==='string' && x.id.length>0 && x.id.length<=150 &&
 typeof x.text==='string' && x.text.trim().length>=32 && x.text.length<=1200;
function similarity(a:number[],b:number[]){
 const dot=a.reduce((sum,x,i)=>sum+x*b[i],0);
 const norm=Math.sqrt(a.reduce((s,x)=>s+x*x,0)*b.reduce((s,x)=>s+x*x,0));
 return norm?Math.max(-1,Math.min(1,dot/norm)):0;
}
export async function semanticComparison(request:Request,env:SemanticEnv){
 const input=await readBounded(request);
 if(!valid(input?.seed) || !Array.isArray(input?.items) || input.items.length<1 || input.items.length>24 ||
  !input.items.every(valid) || new Set(input.items.map((x:any)=>x.id)).size!==input.items.length)
  throw new SemanticError(400,'Use one synopsis and 1–24 unique candidates.');
 if(!env.AI || !env.AI_LIMITER)throw new SemanticError(503,'AI comparison is not configured.');
 const rows=[input.seed,...input.items] as Array<{id:string;text:string}>;
 const hashes=await Promise.all(rows.map(async row=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(model+'|mean|v1|'+row.text)))).map(x=>x.toString(16).padStart(2,'0')).join('')));
 for(const [key,value] of cache)if(value.expires<=Date.now())cache.delete(key);
 const missing=[...new Set(hashes.filter(key=>!cache.has(key)))];
 if(missing.length){
  if(!(await env.AI_LIMITER.limit({key:'semantic-global'})).success)
   throw new SemanticError(429,'AI comparison is busy.');
  let timer:ReturnType<typeof setTimeout>|undefined;
  try{
   const result:any=await Promise.race([env.AI.run(model,{text:missing.map(key=>rows[hashes.indexOf(key)].text)}),
    new Promise((_,reject)=>{timer=setTimeout(()=>reject(new SemanticError(503,'AI comparison timed out.')),8000);})]);
   if(!Array.isArray(result?.data) || result.data.length!==missing.length || !result.data.every((v:any)=>Array.isArray(v)&&v.length===384&&v.every((x:any)=>typeof x==='number'&&Number.isFinite(x))&&v.some((x:number)=>x!==0)))
    throw new SemanticError(502,'Invalid AI response.');
   missing.forEach((key,index)=>cache.set(key,{vector:result.data[index],expires:Date.now()+3600000}));
  }finally{if(timer)clearTimeout(timer);}
 }
 const vectors=hashes.map(key=>cache.get(key)!.vector);
 while(cache.size>500)cache.delete(cache.keys().next().value!);
 return {model,scores:Object.fromEntries(input.items.map((row:any,index:number)=>[row.id,similarity(vectors[0],vectors[index+1])]))};
}
