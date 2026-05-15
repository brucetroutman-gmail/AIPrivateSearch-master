# Prompt: Create sys- Documentation for [APP NAME]

Use this prompt in a new Amazon Q chat session when working in the `aiprivatesearchcustmgr` or `aiprivatesearchweb` repo.

---

## Prompt to paste into Amazon Q

```
I need to create a suite of sys- documentation files for this repo, following the same pattern used in the aiprivatesearch repo.

## Context

The aiprivatesearch repo has a complete set of sys-aips-*.md files in docs/system-documentation/:
- sys-aips-executive-summary.md
- sys-aips-architecture.md
- sys-aips-api.md
- sys-aips-deployment.md
- sys-aips-user-guide.md
- sys-aips-security.md
- sys-aips-contributing.md
- sys-aips-changelog.md
- sys-aips-roadmap.md
- sys-aips-todo.md
- sys-aips-troubleshooting.md

## Naming Convention

For aiprivatesearchcustmgr: prefix = sys-custmgr-
For aiprivatesearchweb: prefix = sys-web-

All filenames lowercase, kebab-case. Example: sys-custmgr-architecture.md

## What to create

Please read the following files first to understand this app:
- README.md
- package.json
- Any existing docs in docs/system-documentation/
- server/s01_server-first-app/server.mjs (routes registered)
- client/c01_client-first-app/shared/header.html (pages/nav)

Then create these files in docs/system-documentation/ in priority order:

1. sys-[prefix]-executive-summary.md
   - What the app is, what problem it solves
   - Key features and capabilities
   - How it fits in the multi-app suite (aiprivatesearch + custmgr + web)
   - Current version and status

2. sys-[prefix]-architecture.md
   - System diagram (ASCII)
   - Directory structure
   - Key components and their roles
   - How it connects to other apps in the suite
   - Ports and environment

3. sys-[prefix]-api.md
   - All API endpoints with method, path, purpose
   - Request/response formats for key endpoints
   - Auth requirements
   - Rate limits if any

4. sys-[prefix]-deployment.md
   - How to start locally
   - Environment variables (.env file location and fields)
   - Release process (version bump files)
   - Any remote deployment steps

5. sys-[prefix]-changelog.md
   - Version history from README or CHANGELOG.md if it exists
   - Format: vX.XX: description

6. sys-[prefix]-todo.md
   - Any known issues or pending tasks
   - Near-term improvements

## Standards

- Concise and accurate — no padding
- Use tables where comparisons are needed
- Use ASCII diagrams for architecture
- Match the style and depth of the aiprivatesearch sys-aips-* docs
- Do not create files that don't have enough content to be useful — skip and note why

## Release process note

Each app has a release command. The version bump must include:
- README.md
- package.json (root)
- server/package.json (if exists)
- client/shared/footer.html (version span)

Please confirm which files need version bumps for this app before creating the changelog.
```

---

## Notes for custmgr

Key things to cover that are unique to custmgr:
- Customer registration and account lifecycle
- License issuance and device registration
- PayPal payment integration
- Trial notifications and email service
- Settings.json configuration system
- How it serves as the licensing backend for aiprivatesearch

## Notes for web

Key things to cover that are unique to web:
- Marketing site — no search functionality
- Lead generation and contact forms
- Pricing page and plan comparison
- How it links to custmgr for registration
- Installer/DMG distribution (installer/ folder)
