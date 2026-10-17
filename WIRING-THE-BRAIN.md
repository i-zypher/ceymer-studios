# Wiring ADIN's smart brain (Hosting rewrite method)

The site now calls `/api/chat` — a path on your own domain. Firebase Hosting
proxies that path to the `ceymer-chat` Cloud Run service. No CORS, no
hostname that can go stale, no domain verification.

**All commands below are single lines.** Paste them one at a time.

---

## The one requirement

A Hosting rewrite can only point at a Cloud Run service **in the same project
as the Hosting site**. Your site is `ceymer-studios-site`; the service you
deployed is in `adin-app`. So the service gets deployed once more, into
`ceymer-studios-site`.

---

## Step 1 — Put the API key in the site's project

Create the secret (it will prompt you to paste the key, then press Ctrl+Z then Enter on Windows):

```
gcloud secrets create GEMINI_API_KEY --project ceymer-studios-site --replication-policy automatic --data-file=-
```

If that errors with "already exists," you're fine — skip to step 2.

*Alternative if pasting is awkward:* save the key into a file named `key.txt`
(no trailing newline), then:

```
gcloud secrets create GEMINI_API_KEY --project ceymer-studios-site --replication-policy automatic --data-file=key.txt
```

Delete `key.txt` afterward.

## Step 2 — Deploy the service into that project

From inside the `server` folder:

```
gcloud run deploy ceymer-chat --source . --region us-east1 --project ceymer-studios-site --allow-unauthenticated --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest
```

If it finishes but the secret can't be read at runtime, grant access once:

```
gcloud secrets add-iam-policy-binding GEMINI_API_KEY --project ceymer-studios-site --member=serviceAccount:$(gcloud projects describe ceymer-studios-site --format="value(projectNumber)")-compute@developer.gserviceaccount.com --role=roles/secretmanager.secretAccessor
```

(On Windows CMD that `$(...)` won't expand — just look up the project number
in the console and paste it in place of the whole `$(...)` chunk.)

## Step 3 — Add the rewrite to firebase.json

Open your existing `firebase.json` and add the `rewrites` array inside
`"hosting"`. **Keep your existing `"public"` value** — don't copy mine if
yours differs. See `firebase.json.example` for the full shape.

```json
"rewrites": [
  { "source": "/api/chat", "run": { "serviceId": "ceymer-chat", "region": "us-east1" } }
]
```

## Step 4 — Deploy the site

```
firebase deploy --only hosting --project ceymer-studios-site
```

## Step 5 — Test

```
curl -s https://ceymer-studios.com/api/chat -X POST -H "Content-Type: application/json" -d "{\"message\":\"who is corey?\"}"
```

ADIN-voiced JSON = done. Then open the site, click ADIN, and type a question.

---

## If it returns 404

The rewrite didn't take effect — check that the `rewrites` block is inside
`"hosting"` in the file you actually deployed, and that the deploy output
mentioned your rewrite.

## If it returns 500

The container is running but Gemini failed — almost always the secret. Check:

```
gcloud run services logs read ceymer-chat --project ceymer-studios-site --region us-east1 --limit 30
```

## Cleaning up the old one

Once this works, the stray service in `adin-app` can go:

```
gcloud run services delete ceymer-chat --project adin-app --region us-east1
```

---

## Note on the server routes

`server/index.js` answers on both `/chat` and `/api/chat`, because Firebase
Hosting forwards the full request path to Cloud Run. That means the service
works whether it's called directly or through the rewrite.
