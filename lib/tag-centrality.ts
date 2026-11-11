export type Centrality='central'|'substantial'|'incidental';
// Conservative synopsis heuristic; provider labels remain explicit evidence, not ground truth.
export function sportsCentrality(description:string,subjects:string[]):Centrality {
 if(subjects.some(s=>/^(?:sports?(?: fiction| drama| anime)?|basketball fiction|football fiction|baseball fiction)$/i.test(s.trim().replace(/-/g,' '))))return 'central';
 const sentences=description.split(/[.!?\n]+/);
 const sports=/\b(?:sports?|basketball|football|baseball|volleyball|soccer|athlet(?:e|es|ics))\b/i;
 const central=/\b(?:team|tournament|championship|league|coach|training|competition|compete|competes|competing|season|win|winning)\b/i;
 const focus=/\b(?:follows|centers on|centres on|about|chronicles|explores)\b/i;
 const incidental=/\b(?:briefly|brief|passing|occasionally|once|background|single scene)\b/i;
 if(sentences.some(s=>sports.test(s)&&!incidental.test(s)&&central.test(s)))return 'central';
 if(subjects.some(s=>/^(?:basketball|football|baseball|volleyball|soccer|athletics)$/i.test(s.trim())) || sentences.some(s=>sports.test(s)&&!incidental.test(s)&&focus.test(s)))return 'substantial';
 return 'incidental';
}

