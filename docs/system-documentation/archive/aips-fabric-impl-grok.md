**Overall Assessment: Excellent, well-structured plan.** 

This is one of the most thoughtful and security-conscious integration plans I've seen for a privacy-focused app like AIPrivateSearch. You clearly understand the trade-offs and have designed around your core principle (keep documents and answers 100% local). The plan is pragmatic, phased, and leverages what you already built. 

### What’s Strong

- **Privacy-First Design**: The PII risk table, sanitized domain templates, and explicit "what is NEVER sent" section are outstanding. Using generic domain vocabulary for sensitive collections (Medical, Law, HR, Family) is the right call. This keeps Fabric as a true "enhancement layer" rather than a data exfiltration risk.

- **Optional + User-Controlled Flow**: Requiring explicit "Enhance" click + preview/edit step is perfect for a private search app. Users stay in control.

- **Minimal Disruption**: Not touching `SearchOrchestrator`, `OllamaService`, scoring, etc., is smart. Low regression risk.

- **Pattern Strategy**: Tying generation to existing triggers (index card creation especially) and making it fire-and-forget is efficient. Using `meta-prompts.json` as the source (but sanitized) reuses your best asset.

- **Cost & Architecture Realism**: Sub-$1/month estimates are accurate for Haiku. The Ubuntu + systemd + Caddy setup matches Fabric’s strengths (it’s a Go binary with a nice REST API).

- **Fallbacks**: Keeping `addMetaPrompt` as local backup is crucial for reliability.

### Potential Improvements & Suggestions

**1. Pattern Generation & Sanitization (Highest Priority Feedback)**
- Your "hardcoded domain template per collection type" approach is safer than dynamic metadata. Implement it strictly — perhaps with a `safeDomainContext.json` or similar file that lives alongside `meta-prompts.json`.
- Consider versioning patterns (e.g., `enhance_USA-History_v2`). Fabric supports updates, and this lets you evolve without breaking existing references.
- Add a lightweight local cache of pattern existence + last-generated timestamp to reduce unnecessary calls to the Fabric server.

**2. UI/UX Polish (Phase 3 ideas are good — expand slightly)**
- Show a subtle "Enhancing with Claude Haiku..." with spinner + cancel option during the remote call (latency ~0.5-2s typically).
- Highlight changes in the preview (diff view) — users love seeing *why* it got better.
- Add a small "Enhance Level" selector (Concise / Balanced / Thorough) that maps to different Fabric pattern variants or parameters. This gives power users more control.

**3. Error Handling & Resilience**
- In `FabricService.mjs`: Implement timeout (e.g., 8-10 seconds), retries (1-2), and clear user messaging.
- Circuit breaker pattern for when Fabric is down (temporarily disable Enhance button after X failures).
- Graceful degradation: If enhancement fails, auto-fall back to `addMetaPrompt` + toast notification ("Remote enhancement unavailable — using local context").

**4. Security/Operational Details**
- **API Key**: Rotate the Fabric secret key periodically. Store it securely (`.env` is fine if gitignored).
- **Rate Limiting**: Yes — implement it. Even 10 enhancements/minute per user should be more than enough.
- **Logging**: Never log full user queries or enhanced prompts if they might contain sensitive info (though queries are user-typed, so lower risk).
- **Input Validation**: Good call on collection name validation. Sanitize the raw query before sending too (basic length + character checks).
- Consider allowing self-hosted Fabric on the same machine/network as a zero-cost, zero-remote option for ultra-sensitive users (Fabric supports local models too).

**5. Testing & Rollout**
- **Phase 1 Test Cases**: 
  - Simple collection (USA-History)
  - High-sensitivity collection (Medical/Law)
  - Offline mode
  - Malformed collection name
- Monitor token usage on the Anthropic side initially.
- Add analytics (opt-in) for how often Enhance is used vs. direct submit — will help you iterate.

**6. Future Extensions (Nice-to-Haves)**
- Auto-enhance toggle per collection (with warning for sensitive ones).
- Use Fabric for other things later (e.g., answer critique, follow-up suggestion patterns) while keeping core search local.
- Generate user-prompts.json entries via Fabric for new collections.

### Minor Risks / Gotchas
- Network dependency: Some users (especially in restricted environments) may have issues reaching `fabric.formr.net`. Document the self-host option clearly.
- Pattern quality: You'll likely need 1-2 iterations per collection type to get the domain templates dialed in. Test with real user-like queries.
- Go/Fabric updates: Fabric evolves quickly (new Claude models); pin versions or have a simple upgrade path documented.

### Final Verdict
**Implement this.** It's production-ready with the phases you've outlined. This upgrade will meaningfully improve query quality (especially for complex or domain-specific collections) while staying true to AIPrivateSearch's private/local ethos.

The plan is already better than 90% of AI feature integrations I see. With the tweaks above (mainly stricter sanitization + resilience), it will be excellent. 

If you want, share the `FabricService.mjs` skeleton or a sample pattern template and I can give more targeted code feedback. Great work!