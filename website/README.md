# Morph Website

Demo website showcasing Morph library features with interactive HTMX examples.

## 🚀 Local Development

```bash
cd website
deno task dev
```

The site will be available at `http://localhost:8000`

## 📦 Features

- **Counter**: Interactive click counter with state in URL
- **Live Timer**: Real-time clock updating every second
- **Toggle**: Show/hide content with server-side state
- **Live Search**: Instant search results with debounce

## 🌐 Deployment

The website is automatically deployed to Deno Deploy on every push to `main` branch that modifies files in `website/` directory.

### Setup Deno Deploy

1. Go to [deno.com/deploy](https://deno.com/deploy)
2. Create a new project named `morph-website`
3. Link your GitHub repository
4. The GitHub Action will handle deployments automatically

## 🛠️ Tech Stack

- **Morph** - SSR library
- **HTMX** - Partial page updates
- **Hono** - Web framework
- **Deno Deploy** - Hosting platform
