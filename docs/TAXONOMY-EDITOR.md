# Taxonomy workshop

Open `/taxonomy/` or follow the link in the main app's genre guide.

1. Search or filter the alphabetized list. Select a tag or choose **Add a tag**.
2. Edit its display name, definition, type, aliases, content class and media applicability.
3. Subgenres have **Belongs under**. Other facets have **Can apply to**, a suggestion relationship. Genre/class forms omit the duplicate hierarchy field.
4. **Save tag to draft** updates the preview and saves in this browser (`mosaic-taxonomy-draft-v1`). Unsaved form changes must be saved or discarded before switching.
5. Try known tags, a content class and medium in the preview. This shows applicable choices, not automatic assignments or predicted ranking quality.
6. Export the versioned JSON for backup/publication. Import replaces the local draft after validation.

Display names can change while stable IDs remain unchanged. Aliases canonicalize equivalent labels in the Week 8 cosine engine after publication. Archiving hides a tag from new suggestions and the glossary, preserving existing library features and scores. Active incoming relationships must be removed first; archived tags can be restored. The two content classes cannot be archived. Library data is never rewritten by the editor.

## Publishing a draft

The static GitHub Pages site cannot securely authorize shared edits itself. Browser drafts do not publish automatically. Apply a reviewed export in the repository:

```sh
node --experimental-strip-types scripts/apply-taxonomy.mjs path/to/mosaic-taxonomy-v1.json
npm test
npm run typecheck
npm run build:pages
```

Review and commit `data/taxonomy-edits.json`, then deploy through the existing GitHub workflow. Existing stable IDs must be retained (archive instead). The versioned file is bundled into `lib/taxonomy.ts`, so published definitions, applicability and suggestions actually use it. No API secrets or shared-write credentials are embedded in the editor.

New tags do not invent metadata: they still need manual assignment or provider labels. Existing synopsis extraction, provider search mappings, and the story-oriented ranking rules are separate code. Aliases currently unify Week 8 cosine features; they are not universally applied to every legacy matcher or API query. Changing a display name affects the glossary/editor; existing cards may still show stable tag labels. Authenticated one-click shared publishing and broader alias migration remain future work.

## Verification

Automated tests cover valid drafts, malformed input, conflicting aliases, missing/circular references, archive references, preserved identities and class/media/branch applicability. Browser testing added a coastal-mystery draft, saved it, observed it in the mystery preview and restored it after reload. This test draft is local only and is not shipped in the taxonomy. The editor has responsive columns, labelled fields, keyboard focus indicators and separate padded sections.
