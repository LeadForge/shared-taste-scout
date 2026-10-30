# Laravel integration note

This repository is **not a Laravel application**. The main CommonGround product is implemented in TypeScript using TanStack Start, React, and Vite. A judge or developer can install and run the submitted application by following the root [README.md](./README.md); PHP, Composer, Laravel, and a Laravel database are not required.

## Optional Laravel usage

If a separate Laravel application is later used as a portal, API gateway, or hosting component, treat it as an optional integration layer only. It is not part of the installation path for this repository and must not be required to reproduce the hackathon demo.

If integrating Laravel with CommonGround:

- Keep Qloo API credentials in Laravel's server-side environment/configuration.
- Never expose Qloo credentials in Blade templates, JavaScript bundles, public routes, or browser network responses.
- Have Laravel call Qloo from backend code using the Qloo-issued server URL and the `X-Api-Key` header.
- Do not make a second copy of the credentials part of the repository.
- Document any additional Laravel service in its own repository or clearly named subdirectory, with a separate setup guide, only if that service is actually implemented.

No Laravel-specific code or dependency is required or included in the current project. This file exists only to clarify the boundary between the core app and a possible optional Laravel layer.
