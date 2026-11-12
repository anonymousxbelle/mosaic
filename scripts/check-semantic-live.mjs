const input={seed:{id:'test-volleyball',text:'A high school volleyball team trains for a championship, learning teamwork and overcoming rivalry through competitive matches.'},items:[{id:'test-team-sport',text:'Teenage basketball players learn to trust their teammates as they train hard and compete in a school tournament.'},{id:'test-unrelated',text:'A historian investigates royal succession and court intrigue in a medieval kingdom, uncovering a conspiracy against the queen.'}]};
const response=await fetch('https://mosaic-catalog-api.toyosi-abike.workers.dev/semantic',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)});
const result=await response.json();
const evidence={checkedAt:new Date().toISOString(),purpose:'Synthetic operational smoke test, not a Haikyuu recommendation-quality evaluation',status:response.status,input,result};
await (await import('node:fs/promises')).writeFile('evidence/semantic-live-smoke.json',JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence));

