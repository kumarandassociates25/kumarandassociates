# Kumar & Associates — Make all Pages CMS fields optional

This is a SAFE TWO-FILE PATCH for the EXISTING GitHub/Netlify site.

## What changed
- `build.js`: no longer fails when any CMS field is empty, null or missing from a JSON file.
- `.pages.yml`: sets `required: false` for all 107 text and image fields in Pages CMS.
- Empty headings, list bullets, feature labels, cards, FAQs, optional links and images are suppressed rather than leaving obvious empty placeholders.
- The contact enquiry form remains available and the submit button falls back to "Send enquiry" if its editable caption is cleared.
- The fixed FormSubmit email recipient, design, founder photograph, logo files and existing content are unchanged.

## Safest way to apply to GitHub
1. Open your EXISTING Kumar & Associates GitHub repository on the `main` branch.
2. Open the root `build.js`. Click Edit (pencil), replace its entire contents with the `build.js` from this patch, and Commit changes to `main`.
3. Open the root `.pages.yml`. Click Edit (pencil), replace its entire contents with `.pages.yml` from this patch, and Commit changes to `main`.
4. Open Netlify -> Deploys. Confirm the newest deployment is Live / Published.
5. Try removing the `feature_footer` field in Pages CMS and saving again. Netlify should deploy without an error.

IMPORTANT: Do NOT upload/overwrite `content/home.json` or any other `content/*.json` files. Those contain your most recent live edits. Do NOT create a new Netlify site.

This patch does not require uploading or changing `src/index.template.html`.

## Notes
- Clearing a field removes that text/image from the generated site. Clearing both a heading and its content can hide the surrounding block or card to avoid empty space.
- A couple of essential UI strings have accessibility/functional fallbacks: browser tab title = Kumar & Associates; form submit = Send enquiry. They do not make those CMS fields required.
- The current enquiry form uses FormSubmit (third party); email delivery still depends on its one-time activation.
