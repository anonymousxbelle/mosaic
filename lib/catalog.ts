import storedCatalog from '../data/catalog.json' with {type:'json'};
import {validUnifiedRecord} from './unified-media.ts';
// Course fixture stored separately from UI; never mixed into normal discovery.
if(storedCatalog.length!==25 || !storedCatalog.every(validUnifiedRecord))throw new Error('Invalid structured course catalog');
const rows:unknown[]=storedCatalog;
export const catalog=rows.filter(validUnifiedRecord);
