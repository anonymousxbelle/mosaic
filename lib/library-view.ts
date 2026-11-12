import type {Media,Ratings} from './recommendations';
export function libraryShelf(item:Media,ratings:Ratings):'later'|'experienced'|'dismissed' {
  if(item.libraryState==='dismissed')return 'dismissed';
  if(ratings[item.id] || item.libraryState==='experienced')return 'experienced';
  return 'later';
}
export function matchesShelf(item:Media,ratings:Ratings,shelf:string){return shelf==='all'||libraryShelf(item,ratings)===shelf;}
export function libraryOrder(items:Media[],ratings:Ratings){return [...items].sort((a,b)=>(libraryShelf(a,ratings)==='dismissed'?2:ratings[a.id]?0:1)-(libraryShelf(b,ratings)==='dismissed'?2:ratings[b.id]?0:1));}

