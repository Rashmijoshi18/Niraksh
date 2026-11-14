# Security Policy

Niraksh-Guardian handles health-related workflows, so security and privacy issues should be reported responsibly.

## Reporting a vulnerability

Please do not disclose vulnerabilities, credentials, personal data, or exploit details in a public issue.

Use GitHub's private vulnerability reporting for this repository when available. Include:

- A clear description of the impact
- Steps to reproduce using synthetic data
- Affected components, routes, or commits
- A suggested mitigation, if known

If private vulnerability reporting is unavailable, contact the repository maintainers privately through GitHub before making a public disclosure.

## Secrets and sensitive data

- Never commit `.env` files, API keys, access tokens, database credentials, or private certificates.
- Use the checked-in `.env.example` files as templates.
- Do not use real patient records, medical images, reports, or personally identifiable information in issues, pull requests, logs, fixtures, or screenshots.
- If a secret is exposed, revoke or rotate it immediately and then remove it from the complete Git history.

## Scope

This policy covers the Niraksh-Guardian source repository and its documented local development workflows. It does not provide medical advice or guarantee the safety of deployments configured by third parties.
