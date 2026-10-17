# Switching ADIN's brain to Claude

You don't need to change the frontend. `assets/adin.js` already calls
`https://ceymer-chat-282094196661.us-east1.run.app/chat`. If you redeploy the
**same service name, region and project**, that URL stays the same.

Each command below is one line. Paste them one at a time.

---

## Step 0: Find which project the live service is in

```
gcloud projects list --filter="projectNumber=282094196661" --format="value(projectId)"
```

Use that project ID wherever you see `PROJECT` below. It will probably be
`ceymer-studios-site` or `adin-app`.

## Step 1: Get an API key

Go to https://platform.claude.com, then Settings, then API Keys, and create a
key. Name it `ceymer-chat`. Under Billing, add a few dollars of credit and set
a monthly spend limit. Portfolio traffic costs pennies, but the limit is cheap
insurance.

## Step 2: Store the key in Secret Manager

Save the key into a file called `key.txt` with no trailing newline, then run:

```
gcloud secrets create ANTHROPIC_API_KEY --project PROJECT --replication-policy automatic --data-file=key.txt
```

Delete `key.txt` afterward.

## Step 3: Let the service read it

Look up the project number in the console, or use `282094196661` if Step 0
matched it.

```
gcloud secrets add-iam-policy-binding ANTHROPIC_API_KEY --project PROJECT --member=serviceAccount:282094196661-compute@developer.gserviceaccount.com --role=roles/secretmanager.secretAccessor
```

## Step 4: Deploy (run from inside the `server` folder)

```
gcloud run deploy ceymer-chat --source . --region us-east1 --project PROJECT --allow-unauthenticated --set-secrets ANTHROPIC_API_KEY=ANTHROPIC_API_KEY:latest --set-env-vars CLAUDE_MODEL=claude-sonnet-5-5,CLAUDE_EFFORT=low
```

`--set-secrets` replaces all of the old secret mappings, so this also unmounts
`GEMINI_API_KEY`.

## Step 5: Test

```
curl -s https://ceymer-chat-282094196661.us-east1.run.app/chat -X POST -H "Content-Type: application/json" -d "{\"message\":\"what AI powers you?\"}"
```

If you get JSON in ADIN's voice that mentions Claude, it worked. Then open the
site, click ADIN, and ask something the scripted chips don't cover.

---

## Tuning without a code change

These are environment variables, so you can change them by redeploying with
`--update-env-vars`:

| Variable        | Default             | Notes                                                       |
|-----------------|---------------------|-------------------------------------------------------------|
| `CLAUDE_MODEL`  | `claude-sonnet-5-5` | Use `claude-haiku-4-5-20251001` for cheapest and fastest     |
| `CLAUDE_EFFORT` | `low`               | `medium` gives deeper answers but is slower                 |

Example:

```
gcloud run services update ceymer-chat --region us-east1 --project PROJECT --update-env-vars CLAUDE_EFFORT=medium
```

## If it returns 500

Check the logs:

```
gcloud run services logs read ceymer-chat --project PROJECT --region us-east1 --limit 30
```

- **`401`** means the secret isn't mounted, or the key is wrong.
- **`400`** usually means the model ID or a parameter is wrong.

## Cleanup

Once Claude is answering, you can delete the old `GEMINI_API_KEY` secret from
that project.
