# Mosaic taxonomy revisions — November 6, 2026

Source: `mosaic-taxonomy-v1 (2).json`. Reviewed all 158 records; changed 76. No stable IDs were added, renamed or deleted. The source export and published taxonomy are unchanged. This is a revised, importable draft, not a deployment.

## Classification policy

- Genre describes the kind of narrative or nonfiction work; subgenre is a narrower branch.
- Subject describes what a work is about. A subject does not automatically determine fiction/nonfiction.
- Theme describes an explored idea; trope describes a recurring situation or plot structure.
- Setting describes where/when depicted events occur, not simply a topic mentioned in the work.
- Tone describes emotional presentation; audience describes intended consumers, never safety or verified age.
- Format remains the existing practical umbrella for animation, publishing forms and program structures. A future schema can separate these facets more precisely.

## Important implementation choice: relationships

The existing `parents` property is used for both ancestry and Can apply to hints, and suggestion code follows it transitively. I removed restrictive parent hints from subjects, themes, tropes and settings while retaining true subgenre/subtype links. This avoids converting teamwork into sports ancestry or a historical setting into fantasy ancestry. It also prevents historical-fiction-only records from losing historical-setting suggestions.

Tradeoff: the manual suggestion list becomes broader. These are available labels, not automatic assignments, mandatory candidate filters or proof that a title contains a facet. The editor continues to support the same version-1 schema; no unimplemented fields were invented. A future schema should separate broader concepts from related/applicable concepts, with migration and runtime tests.

## Exact per-tag changes

### history

- Separate a concrete topic from narrative genre; a topic alone must not imply nonfiction.
- Historical is ambiguous provider wording, not an exact equivalence to history as a subject.

| Field | Before | After |
|---|---|---|
| aliases | ["historical"] | Unrestricted / absent |
| classes | ["fiction", "non-fiction"] | Unrestricted / absent |
| description | "Works concerned with past events; may be fiction or nonfiction." | "Past events, societies or historical inquiry are central subjects. This does not establish whether a work is fiction or nonfiction, or identify a particular period." |
| kind | "genre" | "subject" |
| label | Unrestricted / absent | "History" |

### biography

- Media applicability describes semantic validity, not which providers are currently enabled.

| Field | Before | After |
|---|---|---|
| media | ["Book", "Movie", "TV"] | ["Book", "Movie", "TV", "Game"] |

### popular-science

- Avoid an orphan subgenre without inventing a parent genre.

| Field | Before | After |
|---|---|---|
| kind | "subgenre" | "genre" |

### true-crime

- A factual branch of the existing crime genre.

| Field | Before | After |
|---|---|---|
| parents | Unrestricted / absent | ["crime"] |

### nature

- Separate a concrete topic from narrative genre; a topic alone must not imply nonfiction.

| Field | Before | After |
|---|---|---|
| classes | ["non-fiction"] | Unrestricted / absent |
| description | "Factual works about wildlife, ecosystems and the natural world." | "Wildlife, ecosystems or the natural world are central subjects, in fiction or nonfiction." |
| kind | "genre" | "subject" |
| label | Unrestricted / absent | "Nature" |

### travel

- Separate a concrete topic from narrative genre; a topic alone must not imply nonfiction.

| Field | Before | After |
|---|---|---|
| classes | ["non-fiction"] | Unrestricted / absent |
| description | "Factual accounts or guidance about places and journeys." | "Travel, journeys or experiences of places are central subjects, in factual accounts or fiction." |
| kind | "genre" | "subject" |
| label | Unrestricted / absent | "Travel" |

### politics

- Separate a concrete topic from narrative genre; a topic alone must not imply nonfiction.

| Field | Before | After |
|---|---|---|
| classes | ["non-fiction"] | Unrestricted / absent |
| description | "Factual works about government, public policy and political power." | "Government, political institutions, public policy or political power are central subjects." |
| kind | "genre" | "subject" |
| label | Unrestricted / absent | "Politics" |

### philosophy

- Separate a concrete topic from narrative genre; a topic alone must not imply nonfiction.

| Field | Before | After |
|---|---|---|
| classes | ["non-fiction"] | Unrestricted / absent |
| description | "Works examining knowledge, ethics, existence and reasoning." | "Questions of knowledge, ethics, existence or reasoning are central subjects." |
| kind | "genre" | "subject" |
| label | Unrestricted / absent | "Philosophy" |

### arts

- Separate a concrete topic from narrative genre; a topic alone must not imply nonfiction.
- Fine arts is narrower than all arts, so it is not an exact alias.

| Field | Before | After |
|---|---|---|
| aliases | ["fine-arts", "art"] | ["art"] |
| classes | ["non-fiction"] | Unrestricted / absent |
| description | "Factual study or criticism of artistic practices and works." | "Art, artists and creative practices are central subjects, whether presented factually or through fiction." |
| label | "art" | "Art" |
| media | ["Movie", "TV", "Book"] | Unrestricted / absent |

### technology

- Separate a concrete topic from narrative genre; a topic alone must not imply nonfiction.

| Field | Before | After |
|---|---|---|
| classes | ["non-fiction"] | Unrestricted / absent |
| description | "Factual works about technological systems, inventions and their effects." | "Technological systems, inventions or their effects on society are central subjects." |
| kind | "genre" | "subject" |
| label | Unrestricted / absent | "Technology" |

### dark-fantasy

- Media applicability describes semantic validity, not which providers are currently enabled.

| Field | Before | After |
|---|---|---|
| media | ["Movie", "TV", "Book"] | ["Book", "Movie", "TV", "Game"] |

### detective-fiction

- Include professional and amateur investigators without requiring every mystery to be criminal.

| Field | Before | After |
|---|---|---|
| description | "A detective investigates and solves a mystery." | "Fiction centered on investigators who use clues, observation, evidence or deduction to solve mysteries, with the investigative process central to the narrative." |

### crime-thriller

- Remove an unusual alias without demonstrated equivalence.

| Field | Before | After |
|---|---|---|
| aliases | ["criminal-thriller"] | Unrestricted / absent |

### cosmic-horror

- Cosmic dread is an emotional response, not an exact genre synonym.

| Field | Before | After |
|---|---|---|
| aliases | ["lovecraftian-horror", "cosmic-dread"] | ["lovecraftian-horror"] |

### romantic-comedy

- Represent its overlapping romance and humor genre families.

| Field | Before | After |
|---|---|---|
| parents | ["romance"] | ["romance", "humor"] |

### sports-drama

- Represent both the existing sports genre and drama.

| Field | Before | After |
|---|---|---|
| parents | ["drama"] | ["drama", "sports"] |

### astronomy

- Separate a concrete topic from narrative genre; a topic alone must not imply nonfiction.

| Field | Before | After |
|---|---|---|
| classes | ["non-fiction", "fiction"] | Unrestricted / absent |
| description | "Factual study of celestial bodies and the universe." | "Celestial bodies, astronomical observation or the study of the universe are central subjects; a space setting alone is insufficient." |
| label | Unrestricted / absent | "Astronomy" |
| media | ["Movie", "Book", "TV"] | Unrestricted / absent |

### psychology

- Separate a concrete topic from narrative genre; a topic alone must not imply nonfiction.

| Field | Before | After |
|---|---|---|
| classes | ["non-fiction"] | Unrestricted / absent |
| description | "Factual study of mind, behavior and mental processes." | "Mind, behavior or mental processes are central subjects; this does not by itself imply psychological thriller." |
| kind | "subgenre" | "subject" |
| label | Unrestricted / absent | "Psychology" |
| parents | ["popular-science"] | Unrestricted / absent |

### natural-history

- Separate a concrete topic from narrative genre; a topic alone must not imply nonfiction.

| Field | Before | After |
|---|---|---|
| classes | ["non-fiction"] | Unrestricted / absent |
| description | "Factual observation of organisms and the natural world." | "Organisms, ecosystems and the development of the natural world are central subjects." |
| kind | "subgenre" | "subject" |
| label | Unrestricted / absent | "Natural history" |
| parents | ["popular-science"] | Unrestricted / absent |

### book-series

- Clarify membership while retaining the existing compatibility format.

| Field | Before | After |
|---|---|---|
| description | "Books published as part of a collection of related volumes" | "A book belongs to a named collection of related volumes. This compatibility label does not establish volume order; series identity and position should be stored separately." |

### magic

- Treat supernatural powers as a subject rather than an abstract theme; retain the fiction restriction.
- Remove the restrictive applicability hint from the overloaded parents field. This facet may be suggested across genres, but still needs explicit evidence before assignment.

| Field | Before | After |
|---|---|---|
| description | "Supernatural powers, spells or enchantment are present." | "Supernatural powers, spells or enchantment are central to the fictional work. Stage illusion or factual study of magical beliefs does not by itself qualify." |
| kind | "theme" | "subject" |
| parents | ["fantasy"] | Unrestricted / absent |

### hidden-world

- A secret world alongside ordinary life is a recurring premise.
- Remove the restrictive applicability hint from the overloaded parents field. This facet may be suggested across genres, but still needs explicit evidence before assignment.

| Field | Before | After |
|---|---|---|
| kind | "theme" | "trope" |
| parents | ["fantasy"] | Unrestricted / absent |

### good-versus-evil

- Remove the restrictive applicability hint from the overloaded parents field. This facet may be suggested across genres, but still needs explicit evidence before assignment.

| Field | Before | After |
|---|---|---|
| parents | ["fantasy"] | Unrestricted / absent |

### basketball

- Separate a concrete topic from narrative genre; a topic alone must not imply nonfiction.

| Field | Before | After |
|---|---|---|
| classes | ["fiction", "non-fiction"] | Unrestricted / absent |
| description | "Basketball competition, players or teams are central." | "Basketball players, teams, training or competition are central subjects." |
| kind | "theme" | "subject" |
| label | Unrestricted / absent | "Basketball" |
| media | ["Book", "Movie", "TV", "Game"] | Unrestricted / absent |
| parents | ["sports"] | Unrestricted / absent |

### football

- Separate a concrete topic from narrative genre; a topic alone must not imply nonfiction.

| Field | Before | After |
|---|---|---|
| description | "Football or soccer is a central sport." | "A football code is central, but the available metadata does not distinguish association football, American football or another code. Do not assume which code is meant." |
| kind | "theme" | "subject" |
| label | Unrestricted / absent | "Football (unspecified code)" |
| parents | ["sports"] | Unrestricted / absent |

### baseball

- Separate a concrete topic from narrative genre; a topic alone must not imply nonfiction.

| Field | Before | After |
|---|---|---|
| classes | ["non-fiction", "fiction"] | Unrestricted / absent |
| description | "Baseball competition, players or teams are central." | "Baseball players, teams, training or competition are central subjects." |
| kind | "theme" | "subject" |
| label | Unrestricted / absent | "Baseball" |
| media | ["Book", "Movie", "TV", "Game"] | Unrestricted / absent |
| parents | ["sports"] | Unrestricted / absent |

### teamwork

- Remove the restrictive applicability hint from the overloaded parents field. This facet may be suggested across genres, but still needs explicit evidence before assignment.

| Field | Before | After |
|---|---|---|
| parents | ["sports"] | Unrestricted / absent |

### political-intrigue

- Remove the restrictive applicability hint from the overloaded parents field. This facet may be suggested across genres, but still needs explicit evidence before assignment.

| Field | Before | After |
|---|---|---|
| parents | ["history", "fantasy", "thriller", "politics", "biography"] | Unrestricted / absent |

### power-and-corruption

- Remove the restrictive applicability hint from the overloaded parents field. This facet may be suggested across genres, but still needs explicit evidence before assignment.

| Field | Before | After |
|---|---|---|
| parents | ["history", "fantasy", "thriller", "politics", "biography"] | Unrestricted / absent |

### survival

- Remove the restrictive applicability hint from the overloaded parents field. This facet may be suggested across genres, but still needs explicit evidence before assignment.

| Field | Before | After |
|---|---|---|
| parents | ["adventure", "science-fiction", "fantasy", "travel", "nature"] | Unrestricted / absent |

### exploration

- Remove the restrictive applicability hint from the overloaded parents field. This facet may be suggested across genres, but still needs explicit evidence before assignment.

| Field | Before | After |
|---|---|---|
| parents | ["adventure", "science-fiction", "fantasy", "travel", "nature"] | Unrestricted / absent |

### quest

- A goal-directed journey is a recurring narrative structure.
- Remove the restrictive applicability hint from the overloaded parents field. This facet may be suggested across genres, but still needs explicit evidence before assignment.

| Field | Before | After |
|---|---|---|
| kind | "theme" | "trope" |
| parents | ["adventure", "science-fiction", "fantasy", "travel", "nature"] | Unrestricted / absent |

### superheroes

- Characters with extraordinary heroic roles are a concrete subject.
- Remove the restrictive applicability hint from the overloaded parents field. This facet may be suggested across genres, but still needs explicit evidence before assignment.

| Field | Before | After |
|---|---|---|
| kind | "theme" | "subject" |
| parents | ["action"] | Unrestricted / absent |

### martial-arts

- Separate a concrete topic from narrative genre; a topic alone must not imply nonfiction.

| Field | Before | After |
|---|---|---|
| classes | ["fiction"] | Unrestricted / absent |
| description | "Formal combat disciplines are central." | "Martial disciplines, training, practice or their history are central subjects, in fiction or nonfiction." |
| kind | "theme" | "subject" |
| label | Unrestricted / absent | "Martial arts" |
| parents | ["action"] | Unrestricted / absent |

### trust-and-betrayal

- Remove the restrictive applicability hint from the overloaded parents field. This facet may be suggested across genres, but still needs explicit evidence before assignment.

| Field | Before | After |
|---|---|---|
| parents | ["mystery", "thriller", "romance", "history", "true-crime"] | Unrestricted / absent |

### discovery-and-innovation

- Remove the restrictive applicability hint from the overloaded parents field. This facet may be suggested across genres, but still needs explicit evidence before assignment.

| Field | Before | After |
|---|---|---|
| parents | ["science-fiction", "popular-science", "technology", "biography"] | Unrestricted / absent |

### learning-magic

- Remove the restrictive applicability hint from the overloaded parents field. This facet may be suggested across genres, but still needs explicit evidence before assignment.

| Field | Before | After |
|---|---|---|
| parents | ["fantasy"] | Unrestricted / absent |

### marriage-of-convenience

- Remove the restrictive applicability hint from the overloaded parents field. This facet may be suggested across genres, but still needs explicit evidence before assignment.

| Field | Before | After |
|---|---|---|
| parents | ["romance"] | Unrestricted / absent |

### forbidden-love

- Remove the restrictive applicability hint from the overloaded parents field. This facet may be suggested across genres, but still needs explicit evidence before assignment.

| Field | Before | After |
|---|---|---|
| parents | ["romance"] | Unrestricted / absent |

### second-chance-romance

- Remove the restrictive applicability hint from the overloaded parents field. This facet may be suggested across genres, but still needs explicit evidence before assignment.

| Field | Before | After |
|---|---|---|
| parents | ["romance"] | Unrestricted / absent |

### enemies-to-lovers

- Remove the restrictive applicability hint from the overloaded parents field. This facet may be suggested across genres, but still needs explicit evidence before assignment.

| Field | Before | After |
|---|---|---|
| parents | ["romance"] | Unrestricted / absent |

### friends-to-lovers

- Remove the restrictive applicability hint from the overloaded parents field. This facet may be suggested across genres, but still needs explicit evidence before assignment.

| Field | Before | After |
|---|---|---|
| parents | ["romance"] | Unrestricted / absent |

### fake-relationship

- Remove the restrictive applicability hint from the overloaded parents field. This facet may be suggested across genres, but still needs explicit evidence before assignment.

| Field | Before | After |
|---|---|---|
| parents | ["romance"] | Unrestricted / absent |

### slow-burn

- Remove the restrictive applicability hint from the overloaded parents field. This facet may be suggested across genres, but still needs explicit evidence before assignment.

| Field | Before | After |
|---|---|---|
| parents | ["romance"] | Unrestricted / absent |

### solving-a-mystery

- Remove the restrictive applicability hint from the overloaded parents field. This facet may be suggested across genres, but still needs explicit evidence before assignment.

| Field | Before | After |
|---|---|---|
| parents | ["mystery"] | Unrestricted / absent |

### locked-room-mystery

- Remove the restrictive applicability hint from the overloaded parents field. This facet may be suggested across genres, but still needs explicit evidence before assignment.

| Field | Before | After |
|---|---|---|
| parents | ["mystery"] | Unrestricted / absent |

### amateur-sleuth

- Media applicability describes semantic validity, not which providers are currently enabled.

| Field | Before | After |
|---|---|---|
| media | ["TV", "Movie", "Book", "Game"] | ["Book", "Movie", "TV", "Game"] |

### heist

- Remove the restrictive applicability hint from the overloaded parents field. This facet may be suggested across genres, but still needs explicit evidence before assignment.

| Field | Before | After |
|---|---|---|
| parents | ["thriller", "mystery", "action"] | Unrestricted / absent |

### unreliable-narrator

- Remove the restrictive applicability hint from the overloaded parents field. This facet may be suggested across genres, but still needs explicit evidence before assignment.

| Field | Before | After |
|---|---|---|
| parents | ["thriller", "mystery", "action"] | Unrestricted / absent |

### race-against-time

- Remove the restrictive applicability hint from the overloaded parents field. This facet may be suggested across genres, but still needs explicit evidence before assignment.

| Field | Before | After |
|---|---|---|
| parents | ["thriller", "mystery", "action"] | Unrestricted / absent |

### family-secrets

- Remove the restrictive applicability hint from the overloaded parents field. This facet may be suggested across genres, but still needs explicit evidence before assignment.

| Field | Before | After |
|---|---|---|
| parents | ["drama", "mystery", "romance", "memoir", "biography"] | Unrestricted / absent |

### magical-school

- Remove the restrictive applicability hint from the overloaded parents field. This facet may be suggested across genres, but still needs explicit evidence before assignment.

| Field | Before | After |
|---|---|---|
| parents | ["fantasy"] | Unrestricted / absent |

### space

- Separate where events occur from astronomy as a subject.
- Remove the restrictive applicability hint from the overloaded parents field. This facet may be suggested across genres, but still needs explicit evidence before assignment.

| Field | Before | After |
|---|---|---|
| description | "Outer space or a spacecraft forms a significant setting or subject." | "A substantial part of the depicted events takes place in outer space or aboard a spacecraft. Discussing astronomy alone does not establish this setting." |
| parents | ["science-fiction", "popular-science"] | Unrestricted / absent |

### royal-court

- Remove the restrictive applicability hint from the overloaded parents field. This facet may be suggested across genres, but still needs explicit evidence before assignment.

| Field | Before | After |
|---|---|---|
| parents | ["history", "fantasy", "romance", "mystery", "biography", "politics"] | Unrestricted / absent |

### imperial-court

- Remove the restrictive applicability hint from the overloaded parents field. This facet may be suggested across genres, but still needs explicit evidence before assignment.

| Field | Before | After |
|---|---|---|
| parents | ["history", "fantasy", "romance", "mystery", "biography", "politics"] | Unrestricted / absent |

### regency-britain

- Remove the restrictive applicability hint from the overloaded parents field. This facet may be suggested across genres, but still needs explicit evidence before assignment.

| Field | Before | After |
|---|---|---|
| parents | ["history", "fantasy", "romance", "mystery", "biography", "politics"] | Unrestricted / absent |

### victorian-britain

- Remove the restrictive applicability hint from the overloaded parents field. This facet may be suggested across genres, but still needs explicit evidence before assignment.

| Field | Before | After |
|---|---|---|
| parents | ["history", "fantasy", "romance", "mystery", "biography", "politics"] | Unrestricted / absent |

### medieval

- Remove the restrictive applicability hint from the overloaded parents field. This facet may be suggested across genres, but still needs explicit evidence before assignment.

| Field | Before | After |
|---|---|---|
| parents | ["history", "fantasy", "romance", "mystery", "biography", "politics"] | Unrestricted / absent |

### second-world-war

- Remove the restrictive applicability hint from the overloaded parents field. This facet may be suggested across genres, but still needs explicit evidence before assignment.

| Field | Before | After |
|---|---|---|
| parents | ["history", "fantasy", "romance", "mystery", "biography", "politics"] | Unrestricted / absent |

### hope

- Make the tone meaning explicit without changing its stable ID.

| Field | Before | After |
|---|---|---|
| description | "Possibility of a better future is emphasized." | "An emotional atmosphere emphasizing the possibility of a better future; distinct from merely discussing hope as an idea." |
| label | Unrestricted / absent | "Hopeful" |

### children

- Include children’s movies and separate intended audience from safety guarantees.

| Field | Before | After |
|---|---|---|
| description | "Works created primarily for children, featuring age-appropriate language, presentation, subjects, and storytelling suited to younger audiences." | "Works primarily intended for children according to source or editorial audience information. This is not a content-safety rating or age-verification result." |
| media | ["Book", "TV", "Game", "Music"] | ["Book", "Movie", "TV", "Game", "Music"] |

### adult-audience

- Audience intent can apply to music too; integration availability is a separate concern.

| Field | Before | After |
|---|---|---|
| media | ["Book", "Movie", "TV", "Game"] | ["Book", "Movie", "TV", "Game", "Music"] |

### all-ages

- Audience intent can apply to music too; integration availability is a separate concern.
- Retain a clear boundary between broad audience intent and certification.

| Field | Before | After |
|---|---|---|
| description | "A source identifies the work as intended for a broad age range." | "Works intended for a broad range of ages according to source or editorial information; not a guarantee of suitability for every child." |
| media | ["Game", "TV", "Movie", "Book"] | ["Book", "Movie", "TV", "Game", "Music"] |

### comedy-humor

- Retain the archived duplicate for historical records; do not reintroduce a competing active concept.

| Field | Before | After |
|---|---|---|
| description | "b" | "Archived duplicate of the active humor tag, whose display name is comedy/humor. Retained for compatibility with older saved records." |

### crime

- Media applicability describes semantic validity, not which providers are currently enabled.

| Field | Before | After |
|---|---|---|
| media | ["Book", "Movie", "TV"] | ["Book", "Movie", "TV", "Game"] |

### war

- Military life can occur outside war; retain the war genre and remove the broader alias.

| Field | Before | After |
|---|---|---|
| aliases | ["military"] | Unrestricted / absent |
| description | "r" | "Armed conflict and its effects on people, communities or societies are central to the work." |

### western

- Replace placeholder; genre conventions matter, not compass direction.

| Field | Before | After |
|---|---|---|
| description | "c" | "Stories drawing on frontier life and Western genre conventions, commonly involving settlement, law, conflict or life on a frontier." |

### religious

- Religious and inspirational are distinct. Retain the stable ID for religious subject matter.

| Field | Before | After |
|---|---|---|
| aliases | ["inspirational"] | Unrestricted / absent |
| classes | ["fiction", "non-fiction"] | Unrestricted / absent |
| description | "e" | "Religious beliefs, practices, institutions or spiritual traditions are central subjects. This does not imply an inspirational tone." |
| kind | "genre" | "subject" |
| label | "religious/inspirational" | "Religion" |
| media | ["Book", "Movie", "TV"] | Unrestricted / absent |

### documentary

- Replace the placeholder and specify this tag’s screen-program scope. Fictional depictions of these formats do not make the containing work that format.

| Field | Before | After |
|---|---|---|
| description | "y" | "A screen work presented primarily as a factual account of real people, events or subjects; the label does not independently verify every claim." |

### family

- Separate a concrete topic from narrative genre; a topic alone must not imply nonfiction.

| Field | Before | After |
|---|---|---|
| description | "d" | "Family relationships, kinship or family life are central subjects; this does not mean family-friendly content." |
| kind | "genre" | "subject" |
| label | "family" | "Family" |

### musical

- Replace the placeholder and specify this tag’s screen-program scope. Fictional depictions of these formats do not make the containing work that format.

| Field | Before | After |
|---|---|---|
| description | "d" | "A narrative work in which songs and musical performances are integral to the storytelling, rather than merely background music." |
| media | Unrestricted / absent | ["Movie", "TV"] |

### reality-tv

- Replace the placeholder and specify this tag’s screen-program scope. Fictional depictions of these formats do not make the containing work that format.

| Field | Before | After |
|---|---|---|
| classes | Unrestricted / absent | ["non-fiction"] |
| description | "f" | "Television structured around real participants and ostensibly unscripted events, which may be edited, staged or produced." |
| media | Unrestricted / absent | ["TV"] |

### game-show

- Replace the placeholder and specify this tag’s screen-program scope. Fictional depictions of these formats do not make the containing work that format.

| Field | Before | After |
|---|---|---|
| classes | Unrestricted / absent | ["non-fiction"] |
| description | "f" | "A program structured around participants playing games or completing competitive challenges." |
| media | Unrestricted / absent | ["TV"] |

### talk-show

- Replace the placeholder and specify this tag’s screen-program scope. Fictional depictions of these formats do not make the containing work that format.

| Field | Before | After |
|---|---|---|
| classes | Unrestricted / absent | ["non-fiction"] |
| description | "a" | "A program structured around interviews, discussion or conversation with hosts and guests." |
| media | Unrestricted / absent | ["TV"] |

### soap-opera

- Replace the placeholder and specify this tag’s screen-program scope. Fictional depictions of these formats do not make the containing work that format.

| Field | Before | After |
|---|---|---|
| classes | Unrestricted / absent | ["fiction"] |
| description | "d" | "An ongoing serialized drama emphasizing interconnected personal relationships and continuing conflicts." |
| media | Unrestricted / absent | ["TV"] |

### sitcom

- Replace the placeholder and specify this tag’s screen-program scope. Fictional depictions of these formats do not make the containing work that format.

| Field | Before | After |
|---|---|---|
| classes | Unrestricted / absent | ["fiction"] |
| description | "a" | "An episodic comedy built around recurring characters and a familiar social or domestic situation." |
| media | Unrestricted / absent | ["TV"] |

## Deliberate choices and remaining limitations

- Kept sports as a genre for compatibility with current provider/genre matching; individual sports are subjects. A full sports-to-subject migration needs retrieval changes.
- Kept detective-fiction under mystery only: many detective stories involve crime, but not every investigation must. Crime-thriller has both genre parents.
- Kept historical-fiction as a standalone fiction genre, matching your edit. History is now a cross-class subject.
- Kept memoir as format and travel-memoir/family-memoir as its subtypes, consistent with the existing anime-under-animation convention. The term Subgenre is broader than ideal here.
- Kept anime and donghua separate and under animation. Their labels do not follow automatically from adaptation mentions or a character’s nationality.
- Kept time-travel, dystopian and post-apocalyptic in the existing science-fiction branch for compatibility; these concepts can also occur in fantasy. Parents must not become exclusive genre gates.
- Football remains an explicitly unspecified-code umbrella. No invented sport identity or provider mapping was added; code-specific subjects can be introduced with verified data later.
- Religious is now a religion subject. Removed inspirational as an alias without inventing an automatically assigned replacement tone.
- Kept related tones such as tense/suspenseful and broad emotional; ranking should avoid overweighting correlated generic evidence.
- Archived comedy-humor remains archived. Archive does not migrate its old saved features to humor; a redirect system still needs implementation.
- Program formats above describe complete programs, not fictional shows depicted within a story. Hybrid/documentary claims require evidence.
- Media restrictions now distinguish semantic applicability from product rollout. Adding Game applicability does not enable live game discovery.
- Existing story extraction, API mappings, saved library records and recommendation weights have not been changed. Merely importing new categories cannot prove improved retrieval.

## Unchanged records

fiction, non-fiction, fantasy, science-fiction, mystery, thriller, horror, romance, drama, action, adventure, humor, sports, memoir, self-help, epic-fantasy, urban-fantasy, mythic-fantasy, fairy-tales, magical-realism, space-opera, cyberpunk, time-travel, dystopian, post-apocalyptic, first-contact, cozy-mystery, police-procedural, psychological-thriller, spy-thriller, gothic-horror, supernatural-horror, historical-romance, contemporary-romance, paranormal-romance, historical-fiction, family-drama, satire, political-biography, scientific-biography, artist-biography, travel-memoir, family-memoir, personal-growth, productivity, investigative-true-crime, animation, anime, donghua, manga, light-novel, sports-anime, short-film, limited-series, novella, friendship, found-family, identity, self-discovery, grief, revenge, connection, rebellion, competition, coming-of-age, chosen-one, school, small-town, workplace, lighthearted, heartwarming, suspenseful, emotional, reflective, dark, bittersweet, whimsical, melancholic, tense, uplifting, middle-grade, young-adult

These records were reviewed and left as submitted because no necessary edit was identified. This is an editorial judgment, not a universal genre standard.

## Validation and publication

The draft must pass the existing version-1 validator, retain the source ID set, retain active fiction/non-fiction classes and contain no short placeholder definitions. It is intended for import into the taxonomy editor. Publishing requires explicitly applying this draft and running project checks; nothing has been published during this revision.

## References and context

- Previous local review: taxonomy-review-2026-11-06.md.
- Recent, partially available Mosaic Tagging Help excerpts informed the detective-fiction and dark-fantasy review; the complete conversation was not available in that review.
- W3C SKOS distinguishes hierarchy, relatedness and equivalence: https://www.w3.org/TR/skos-reference/
- BISG usage notes illustrate the distinction between category membership and works about a subject: https://www.bisg.org/bisac-usage-notes

### Verification result
Passed the existing validator with zero errors. Confirmed all 158 original IDs remain, every description exceeds 15 characters, art/family/nature are suggested across both content classes, children includes Movie, historical-fiction can receive imperial-court suggestions, and comedy-humor remains archived. These checks validate the draft, not live recommendation quality.

## Publication follow-up
The user subsequently authorized publication. The reviewed draft is now the input for data/taxonomy-edits.json. Regression expectations were updated for quest as trope, politics as a class-neutral subject, and broader available facets; a negative extraction assertion still checks that availability does not assign magical-school to historical romance. All 116 local tests and typecheck passed. Earlier statements above describe the draft-review stage.

