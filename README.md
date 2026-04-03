# L'Oréal Smart Beauty Advisor

An AI-powered beauty chatbot built for the Glo Career Accelerator — Project 8.

## Live Demo
[View on GitHub Pages](https://YOUR_USERNAME.github.io/loreal-chatbot)

## Cloudflare Worker Setup

1. Log in to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Go to **Workers & Pages** → **Create** → **Worker**
3. Name: `loreal-chatbot-worker` → Click **Deploy**
4. Click **Edit Code**, replace everything with contents of `RESOURCE_cloudflare-worker.js`
5. Click **Save and Deploy**
6. Go to **Settings** → **Variables and Secrets**
7. Under **Secrets**: Add `OPENAI_API_KEY` → paste your OpenAI key → Save
8. Copy your Worker URL

## Frontend Setup

1. Open `script.js`
2. Replace `WORKER_URL` value with your Cloudflare Worker URL
3. Commit and push to GitHub
4. Enable GitHub Pages: Settings → Pages → Branch: main → Save

## Tech Stack
- **Frontend:** HTML, CSS, Vanilla JavaScript
- **Backend Proxy:** Cloudflare Workers
- **AI:** OpenAI GPT-4o / GPT-4o-mini via Chat Completions API
- **Deployment:** GitHub Pages + Cloudflare Workers
