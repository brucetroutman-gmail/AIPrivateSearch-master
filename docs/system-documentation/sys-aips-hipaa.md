# AIPrivateSearch HIPAA & PII Compliance

**Version**: 20.22

---

## Important Disclaimer

> AIPrivateSearch is **not currently certified as HIPAA-compliant**. This document describes the current compliance posture, what is and isn't covered, and what would be required to achieve full HIPAA compliance. Do not represent the product as "HIPAA-compliant" without completing the steps in this document.

---

## What HIPAA Requires

HIPAA applies when your app processes **Protected Health Information (PHI)** for a **Covered Entity** (doctor, hospital, insurer) or their **Business Associate**.

Being local-only does not automatically mean HIPAA-compliant. HIPAA requires:

| Requirement | Description |
|-------------|-------------|
| Encryption at rest | PHI stored on disk must be encrypted (AES-256 or equivalent) |
| Encryption in transit | Any network communication must use TLS |
| Access controls | Role-based access, session timeouts, auto-lock |
| Audit logs | Track who viewed/edited PHI and when |
| Risk analysis | Annual security risk assessment |
| Business Associate Agreement (BAA) | Required if you are a vendor to a Covered Entity |
| Breach notification | Process for notifying affected parties if PHI is exposed |

---

## Current Compliance Posture

### What AIPrivateSearch does well

✅ **Local processing** — all AI inference runs on-device via Ollama, no document content sent to external services
✅ **No cloud AI** — Ollama models run entirely offline
✅ **Role-based access** — tier + role system controls feature access
✅ **Session authentication** — email-based sessions with server-side validation
✅ **Rate limiting** — prevents brute force on API endpoints
✅ **Input validation** — path traversal prevention, query sanitization
✅ **No telemetry** — no usage data sent externally
✅ **Fabric privacy** — only the search query is sent for prompt enhancement, never document content

### What is missing for full HIPAA compliance

❌ **Encryption at rest** — document collections and data files stored as plaintext
❌ **Audit logs** — no comprehensive log of who accessed which documents and when
❌ **Session timeout / auto-lock** — sessions last 1 hour but no idle timeout or screen lock
❌ **Encryption of local database** — MySQL data not encrypted at rest
❌ **Formal risk assessment** — no documented annual security review
❌ **BAA process** — no Business Associate Agreement template or signing process
❌ **Breach notification process** — no documented procedure

---

## PII Compliance Posture

PII (Personally Identifiable Information) is governed by CCPA (California), GDPR (EU), NY SHIELD Act, and others depending on user location.

### What AIPrivateSearch does well for PII

✅ No data leaves the device during document processing
✅ No third-party analytics or tracking
✅ Users can delete collections and documents
✅ Minimal data collection during registration (email only)

### What needs attention for PII

⚠️ **Privacy policy** — should explicitly state no data is shared or transmitted
⚠️ **Data deletion** — no formal "delete all my data" user flow
⚠️ **GDPR right to erasure** — if serving EU users, need documented deletion process
⚠️ **Email storage** — user emails stored in `data/users.json` — should be documented in privacy policy

---

## Recommended Steps for HIPAA Readiness

### Priority 1 — Technical (implement before marketing to healthcare)

1. **Encrypt document collections at rest**
   - Encrypt `sources/local-documents/` using OS-level encryption (FileVault on macOS) or application-level AES-256
   - Document the encryption method used

2. **Implement audit logging**
   - Log: user email, timestamp, action (search, view document, upload, delete), collection accessed
   - Store logs securely, retain for minimum 6 years per HIPAA

3. **Session idle timeout**
   - Auto-logout after 15 minutes of inactivity (HIPAA recommendation)
   - Add to `app.json` as configurable setting

4. **Encrypt MySQL database**
   - Enable MySQL encryption at rest
   - Or use encrypted disk volume

### Priority 2 — Process (required for selling to healthcare)

5. **Annual risk assessment**
   - Document threats, vulnerabilities, and mitigations
   - Review annually and after significant changes

6. **Business Associate Agreement (BAA)**
   - Create BAA template for healthcare customers
   - Sign before any PHI is processed

7. **Breach notification procedure**
   - Document steps to take if PHI is exposed
   - HIPAA requires notification within 60 days of discovery

8. **Privacy policy**
   - Publish clear privacy policy covering data handling, retention, deletion
   - Reference in app and on marketing website

### Priority 3 — Certification (for enterprise healthcare sales)

9. **HIPAA compliance audit**
   - Engage a HIPAA compliance consultant or auditor
   - Obtain written attestation

10. **SOC 2 Type II** (optional but valuable for enterprise)
    - Demonstrates security controls over time

---

## What to Tell Healthcare Customers Today

Until full HIPAA compliance is achieved, be accurate:

**Can say:**
- "All AI processing runs locally — no patient data leaves your machine"
- "We are building toward HIPAA compliance — here is our roadmap"
- "Local processing significantly reduces your data exposure risk"

**Do not say:**
- "HIPAA-compliant" — without completing the steps above
- "Fully secure" — without documented encryption and audit controls

---

## Fabric and PHI

Fabric (prompt enhancement) sends only the **search query** to the remote server — never document content. However:

- If a user types PHI directly into the search query (e.g. "find records for John Smith DOB 01/01/1980"), that query would be sent to Fabric
- Mitigation: add a warning when Fabric is enabled in collections that may contain PHI
- Long-term: implement query sanitization to detect and strip potential PHI before sending to Fabric

---

## Summary

| Standard | Current Status | Path to Compliance |
|----------|---------------|-------------------|
| HIPAA | Partial — local processing is strong, missing encryption at rest, audit logs, BAA | Implement Priority 1 + 2 steps above |
| PII (general) | Good in practice — no data leaves device | Add privacy policy, data deletion flow |
| GDPR | Partial — no data transmitted, but missing formal deletion process | Add right-to-erasure flow, update privacy policy |
