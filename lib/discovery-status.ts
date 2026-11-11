export function discoveryStatus({loading,failed,partial,count}:{loading:boolean;failed:boolean;partial:boolean;count:number}) {
 if(loading)return 'Finding stories that fit…';
 if(failed)return 'Catalog search is temporarily unavailable. Try Find my next favorite again.';
 if(partial)return 'Some catalogs were unavailable. These results may be incomplete; try again for more matches.';
 return count ? 'Your matches are ready.' : 'No matches found with these choices.';
}

