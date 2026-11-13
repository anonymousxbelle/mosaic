'use client';
import type {Media} from '@/lib/recommendations';
import {taxonomy} from '@/lib/taxonomy';
import {specificity} from '@/lib/features';
export function TitleTags({item}:{item:Media}) {
  const tags=[...new Set(item.tags)];
  const priority=(tag:string)=>taxonomy[tag]?.kind==='genre'?3:taxonomy[tag]?.kind==='subgenre'?2:taxonomy[tag]?.kind==='class'?0:1;
  const top=[...tags].sort((a,b)=>priority(b)-priority(a)||specificity(b)-specificity(a)||a.localeCompare(b)).slice(0,3);
  if(!tags.length)return <p className="muted">No tags available yet.</p>;
  return <div className="title-tags"><div className="title-tag-preview" aria-label="Title tags">{top.map(tag=><span key={tag}>{taxonomy[tag]?.label || tag.replaceAll('-',' ')}</span>)}</div><details><summary>See all {tags.length} Mosaic tags</summary><p>These are the title’s current tags available to Mosaic’s matcher, including your edits. They are not limited to shared tags.</p><div className="title-tag-preview">{tags.map(tag=><span key={tag}>{taxonomy[tag]?.label || tag.replaceAll('-',' ')}</span>)}</div></details></div>;
}
