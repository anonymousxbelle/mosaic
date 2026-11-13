'use client';
import type {Media} from '@/lib/recommendations';
import {taxonomy} from '@/lib/taxonomy';
import {specificity} from '@/lib/features';
import {Dialog,DialogTrigger,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog';
const groups=[['class','Fiction / nonfiction'],['genre','Genre'],['subgenre','Subgenre'],['subject','Subject'],['theme','Theme'],['trope','Trope'],['setting','Setting'],['tone','Tone'],['audience','Audience'],['format','Format'],['custom','Personal / other tags']];
export function TitleTags({item}:{item:Media}) {
  const tags=[...new Set(item.tags)];
  const priority=(tag:string)=>taxonomy[tag]?.kind==='genre'?3:taxonomy[tag]?.kind==='subgenre'?2:taxonomy[tag]?.kind==='class'?0:1;
  const top=[...tags].sort((a,b)=>priority(b)-priority(a)||specificity(b)-specificity(a)||a.localeCompare(b)).slice(0,3);
  if(!tags.length)return <p className="muted">No tags available yet.</p>;
  return <div className="title-tags"><div className="title-tag-preview" aria-label="Title tags">{top.map(tag=><span key={tag}>{taxonomy[tag]?.label || tag.replaceAll('-',' ')}</span>)}</div><Dialog><DialogTrigger className="all-tags-button">See all {tags.length} Mosaic tags</DialogTrigger><DialogContent className="add-media-dialog title-tags-dialog"><DialogTitle>Tags for {item.title}</DialogTitle><DialogDescription>All current tags available to Mosaic’s matcher, including your edits—not just the tags shared with a recommendation.</DialogDescription><dl className="grouped-title-tags">{groups.map(([kind,label])=>{
    const values=tags.filter(tag=>(taxonomy[tag]?.kind || 'custom')===kind);
    return values.length ? <div key={kind}><dt>{label}:</dt><dd>{values.map(tag=>taxonomy[tag]?.label || tag.replaceAll('-',' ')).join(', ')}</dd></div> : null;
  })}</dl></DialogContent></Dialog></div>;
}
