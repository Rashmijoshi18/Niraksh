# Contributing to Niraksh-Guardian

Thank you for helping improve Niraksh-Guardian. Contributions are welcome across the web app, backend, AI services, documentation, testing, accessibility, and developer experience.

## Before you start

- Read the [README](./README.md) and the service-specific setup guides.
- Search existing issues before opening a new one.
- For large changes, open an issue first so the approach can be discussed.
- Never commit secrets, API keys, credentials, or real patient/health data. Use synthetic data only.
- Read [SECURITY.md](./SECURITY.md) before reporting a security concern.

## Local development

The project is split into frontend, backend, and optional AI services. Use the relevant service README for prerequisites and environment variables.

```bash
# Backend
cd backend
cp .env.example .env
pnpm install
pnpm dev

# Frontend, in a separate terminal
cd frontend
pnpm install
pnpm dev
```

Useful checks before opening a pull request:

```bash
cd backend && pnpm lint && pnpm build
cd frontend && pnpm lint && pnpm build
```

## Workflow

1. Fork the repository and create a focused branch from `main`.
2. Make the smallest coherent change that solves the issue.
3. Add or update tests and documentation when behavior changes.
4. Run the relevant lint, build, and test checks locally.
5. Open a pull request using the pull request template and link the related issue.

## Pull request expectations

- Explain what changed and why.
- Call out migrations, environment changes, API changes, and known limitations.
- Include screenshots or recordings for meaningful UI changes.
- Keep health guidance safe: Niraksh-Guardian is informational and must not present AI output as a diagnosis or a substitute for professional care.
- Avoid logging personal health information or sensitive credentials.

## Questions

If you are unsure where to begin, look for issues labelled `good first issue` or `help wanted`, or open a discussion in an issue describing the problem you want to solve.
