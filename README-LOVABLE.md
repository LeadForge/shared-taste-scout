# Lovable deployment and secrets guide

CommonGround is built and hosted with **Lovable**.

## Open the project

- Lovable editor: https://lovable.dev/projects/0b8e6686-35e3-4345-bf7f-13a0675b7ce0
- Public app: https://shared-taste-scout.lovable.app

## Configure Qloo secrets

In the Lovable project:

1. Open **Settings → Secrets**.
2. Add `QLOO_API_KEY` with the API key issued for this hackathon.
3. Add `QLOO_API_BASE_URL` with the exact Qloo API server URL supplied for the hackathon. The default host in the code is `https://hackathon.api.qloo.com`; use the provider-issued value if it differs.
4. Save the secrets and redeploy/publish the project if Lovable requests it.
5. Open the deployed app and check the connection indicator. It should say **Live Qloo** only after the app's server-side health check successfully calls Qloo. If it indicates demo mode or reports an error, check the secret names and values in Lovable Settings.

Never paste API keys into Lovable chat, browser code, public GitHub files, or screenshots. Both values must remain server-side secrets.

## Edit and publish

- Make code changes in the Lovable editor or through the connected GitHub repository.
- Keep the default branch buildable. Commits to the connected repository may sync to Lovable.
- After code changes, verify the preview and publish the updated project.
- Confirm that the public demo URL opens without sign-in and that judges can use the demo flow.

## Local installation is separate

Judges who want to install the application on their own machine should follow the root [README.md](./README.md). It uses Node.js and Bun. It does not require a Lovable account. Live Qloo mode requires the judge to provide their own Qloo API credentials; demo mode works without them.
