# Kumar & Associates — editable website (Pages CMS + Netlify)

This package preserves the existing Kumar & Associates website design, its founder photograph and official logo, and its FormSubmit enquiry form. Text is editable in Pages CMS after the one-time GitHub/Netlify connection.

## What is editable?

- Homepage hero, benefits and trust statements
- Our approach and key differentiators
- Insolvency and accounting service descriptions and bullets
- Flexible engagement models
- About the founder and working philosophy quote
- Five FAQ questions and answers
- Contact information, CTA wording and basic SEO metadata

The logo, hero layout, CSS and founder image are retained as website assets. The form posts to FormSubmit and remains unchanged by CMS edits. If you change the public contact email field, update and confirm the separate FormSubmit recipient too.

## Publishing setup (one time)

1. Create or sign into a GitHub account at https://github.com.
2. Create a NEW GitHub repository (for example `kumar-associates-website`). Keep it private if you prefer; ensure you permit Pages CMS access to that repository.
3. Upload **the whole contents of this folder** to the repository root, including the hidden `.pages.yml` file, `src/`, `content/`, `build.js` and `netlify.toml`. Do not upload only the ZIP file.
4. In Netlify open your EXISTING `kumarandassociates.netlify.app` project, navigate to Project configuration > Build & deploy > Continuous deployment > Repository, and connect your new GitHub repository. Do NOT create a second Netlify website.
5. The included `netlify.toml` tells Netlify to run `node build.js` and publish the `dist` folder. Trigger the first deploy and verify it is Published.
6. Visit https://app.pagescms.org, sign in with GitHub, install/authorize the Pages CMS GitHub App for the repository, and open the project. The fields in `.pages.yml` become your editing dashboard.
7. To edit copy: select Homepage, Services, About, Contact, etc.; update wording; Save. Pages CMS writes your change to GitHub, and Netlify's linked build should publish it automatically.

## Test locally (optional)

With Node.js installed, run `node build.js` from this folder, then open `dist/index.html` in a browser. This produces a deploy-ready static site without dependencies.

## If you only want to review before connecting GitHub

Upload the `dist/` folder to your existing Netlify site via Deploys. The website will look the same, but the CMS will not publish edits automatically until the GitHub repository is connected.

## Form behaviour

- Enquiry form POST target: https://formsubmit.co/Kumarandassociates25@gmail.com
- Test the live form independently; FormSubmit activation may be required.
- The form submits visitor data to a third party. Provide an appropriate privacy notice before processing personal information.

## Limitations

- The Pages CMS editor is accessed at https://app.pagescms.org, not at a public `/admin` route on your site.
- Hosting remains on Netlify and your `netlify.app` URL stays the same if you connect your existing project rather than creating a new one.
- This CMS edits content; CSS/layout and logo file editing still require updates to the source.
