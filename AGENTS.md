# Morph — Documentation for AI Agents

This document provides structured information for LLM agents to effectively build web applications using Morph.

## Overview

Morph is a **server-side rendering library** for building web UIs with HTMX and Hono. Key characteristics:

- **Runtime:** Deno, Bun, or Node.js
- **No build step:** TypeScript runs directly
- **Server-rendered:** All components execute on the server
- **HTMX-powered:** Partial page updates without client JavaScript

## Project Setup

### File Structure (Minimal)

```
project/
├── deno.json        # or package.json for Node/Bun
└── main.ts          # entry point
```

### File Structure (Recommended)

```
project/
├── deno.json
├── main.ts
├── components/
│   ├── layout.ts    # wrapper, navigation
│   ├── pages/       # page components
│   └── partials/    # HTMX-updatable components
└── tests/
    └── *.test.ts
```

### Dependencies

```json
// deno.json
{
  "imports": {
    "@hono/hono": "jsr:@hono/hono@4",
    "@vseplet/morph": "jsr:@vseplet/morph"
  }
}
```

## Core Concepts

### 1. Components

Components are functions that return HTML templates.

```ts
import { component, html } from "@vseplet/morph";

// Basic component (no props)
const header = component(() => html`
  <header>
    <h1>My App</h1>
  </header>
`);

// Component with typed props
const userCard = component<{ name: string; email: string }>((props) => html`
  <div class="user-card">
    <h3>${props.name}</h3>
    <p>${props.email}</p>
  </div>
`);

// Async component (can fetch data)
const userList = component(async (props) => {
  const users = await fetchUsers();
  return html`
    <ul>
      ${users.map(u => userCard({ name: u.name, email: u.email }))}
    </ul>
  `;
});
```

### 2. Available Props in Components

Every component receives `MorphPageProps`:

```ts
interface MorphPageProps {
  request: Request;              // Raw HTTP request
  route: string;                 // Current route path
  params: Record<string, string>; // URL params (:id -> params.id)
  query: Record<string, string>;  // Query string (?foo=bar -> query.foo)
  headers: Record<string, string>; // Request headers
  hx: () => string;              // Returns hx-get attribute for self-refresh
}
```

Example usage:

```ts
const page = component((props) => html`
  <div>
    <p>URL: ${props.request.url}</p>
    <p>User ID: ${props.params.id}</p>
    <p>Search: ${props.query.q ?? "none"}</p>
    <p>Auth: ${props.headers.authorization ?? "none"}</p>
  </div>
`);
```

### 3. Templates and Interpolation

```ts
// Strings and numbers
html`<p>Count: ${42}</p>`                    // -> <p>Count: 42</p>

// Nested templates
html`<div>${html`<span>nested</span>`}</div>`

// Arrays (auto-joined)
html`<ul>${items.map(i => html`<li>${i}</li>`)}</ul>`

// Conditionals
html`<div>${isAdmin ? html`<button>Delete</button>` : ""}</div>`

// Components
html`<div>${userCard({ name: "Alice", email: "a@b.com" })}</div>`

// Falsy values: null, undefined, false render as empty string
// IMPORTANT: 0 renders as "0" (not empty)
html`<p>${0}</p>`  // -> <p>0</p>
html`<p>${null}</p>` // -> <p></p>
```

### 4. Styling with `styled`

```ts
import { styled } from "@vseplet/morph";

// Creates unique class name, CSS collected in <head>
const buttonClass = styled`
  padding: 8px 16px;
  background: blue;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background: darkblue;
  }
`;

const button = component<{ label: string }>((props) => html`
  <button class="${buttonClass}">${props.label}</button>
`);
```

### 5. Meta (Title, Headers, Status)

```ts
import { meta } from "@vseplet/morph";

const page = component(() => html`
  ${meta({
    title: "Page Title",           // <title> tag
    statusCode: 200,               // HTTP status
    statusText: "OK",              // HTTP status text
    headers: {                     // Response headers
      "X-Custom": "value",
      "Cache-Control": "no-cache"
    },
    head: `<link rel="icon" href="/favicon.ico">`,  // Inject into <head>
    bodyStart: `<div id="top"></div>`,              // Start of <body>
    bodyEnd: `<script src="/analytics.js"></script>` // End of <body>
  })}
  <h1>Content</h1>
`);
```

### 6. Client-Side JavaScript

```ts
import { js, fn, onclick, script } from "@vseplet/morph";

const page = component(() => html`
  <div>
    <!-- Inline JS block (added to end of body) -->
    ${js`console.log("Page loaded");`}

    <!-- Function converted to script -->
    ${fn(() => {
      document.querySelector("#btn").addEventListener("click", () => {
        alert("Clicked!");
      });
    })}

    <!-- Inline onclick attribute -->
    <button ${onclick(() => alert("Hello"))}>Click me</button>

    <!-- Script tag in HTML -->
    ${script(() => console.log("Inline script"))}
  </div>
`);
```

## Application Setup

### Minimal App

```ts
import { Hono } from "@hono/hono";
import { component, html, morph } from "@vseplet/morph";

const homePage = component(() => html`<h1>Hello!</h1>`);

const app = new Hono().all("/*", (c) =>
  morph.page("/", homePage).fetch(c.req.raw)
);

Deno.serve(app.fetch);
```

### App with Layout

```ts
import { Hono } from "@hono/hono";
import { component, html, morph, Morph, basic, meta, styled } from "@vseplet/morph";

// Define wrapper (applied to all pages)
const wrapper = component<{ child?: any }>((props) => html`
  <div class="${styled`max-width: 1200px; margin: 0 auto;`}">
    <nav>
      <a href="/">Home</a>
      <a href="/about">About</a>
    </nav>
    <main>${props.child}</main>
    <footer>© 2024</footer>
  </div>
`);

// Pages
const homePage = component(() => html`
  ${meta({ title: "Home" })}
  <h1>Welcome</h1>
`);

const aboutPage = component(() => html`
  ${meta({ title: "About" })}
  <h1>About Us</h1>
`);

// Create app with layout
const app = new Hono().all("/*", (c) =>
  new Morph({
    layout: basic({
      htmx: true,
      wrapper,
      title: "My App",
    }),
  })
    .page("/", homePage)
    .page("/about", aboutPage)
    .fetch(c.req.raw)
);

Deno.serve(app.fetch);
```

### App with Dynamic Routes

```ts
const userPage = component((props) => html`
  ${meta({ title: `User ${props.params.id}` })}
  <h1>User Profile</h1>
  <p>User ID: ${props.params.id}</p>
`);

const app = new Hono().all("/*", (c) =>
  morph
    .page("/", homePage)
    .page("/users/:id", userPage)
    .fetch(c.req.raw)
);
```

## HTMX Integration (Partial Updates)

### Self-Refreshing Component

```ts
const clock = component((props) => html`
  <div ${props.hx()} hx-trigger="every 1s" hx-swap="outerHTML">
    Time: ${new Date().toLocaleTimeString()}
  </div>
`);

// IMPORTANT: Register as partial
const app = new Hono().all("/*", (c) =>
  morph
    .partial(clock)  // Creates /draw/{componentName} endpoint
    .page("/", homePage)
    .fetch(c.req.raw)
);
```

### Click to Load Content

```ts
const details = component((props) => {
  const id = props.query?.id;
  if (!id) return html`<p>Select an item</p>`;

  // Fetch data based on id
  return html`<div>Details for ${id}</div>`;
});

const listPage = component(() => html`
  <ul>
    <li><button hx-get="/draw/${details.name}?id=1"
                hx-target="#details">Item 1</button></li>
    <li><button hx-get="/draw/${details.name}?id=2"
                hx-target="#details">Item 2</button></li>
  </ul>
  <div id="details">${details({})}</div>
`);

morph.partial(details).page("/", listPage);
```

### Form with Live Search

```ts
const searchResults = component(async (props) => {
  const q = props.query?.q ?? "";
  if (!q) return html`<p>Type to search...</p>`;

  const results = await search(q);
  return html`
    <ul>
      ${results.map(r => html`<li>${r.title}</li>`)}
    </ul>
  `;
});

const searchPage = component(() => html`
  <input type="text"
         name="q"
         placeholder="Search..."
         hx-get="/draw/${searchResults.name}"
         hx-target="#results"
         hx-trigger="keyup changed delay:300ms">
  <div id="results">${searchResults({})}</div>
`);
```

### Toggle State Pattern

```ts
const toggle = component((props) => {
  const isOpen = props.query?.open === "true";
  const nextState = isOpen ? "false" : "true";

  return html`
    <div>
      <button ${props.hx()}?open=${nextState}
              hx-swap="outerHTML"
              hx-trigger="click">
        ${isOpen ? "Close" : "Open"}
      </button>
      ${isOpen ? html`<div>Hidden content</div>` : ""}
    </div>
  `;
});
```

## RPC (Remote Procedure Calls)

For typed server calls with JSON arguments:

```ts
import { rpc, html, morph } from "@vseplet/morph";

// Define RPC handlers
const api = rpc({
  createUser: async (req, args: { name: string; email: string }) => {
    const user = await db.users.create(args);
    return html`<div>Created user: ${user.name}</div>`;
  },

  deleteUser: async (req, args: { id: number }) => {
    await db.users.delete(args.id);
    return html`<div>User deleted</div>`;
  },
});

// Use in component
const form = component(() => html`
  <form>
    <input name="name" placeholder="Name">
    <input name="email" placeholder="Email">
    <button ${api.rpc.createUser({ name: "", email: "" })}
            hx-include="closest form"
            hx-target="#result">
      Create
    </button>
  </form>
  <div id="result"></div>
`);

// Register RPC
morph.rpc(api).page("/", form);
```

## Testing

### Test Setup

```ts
// tests/helpers.ts
import { render, type MorphPageProps } from "@vseplet/morph";

export const emptyProps: MorphPageProps = {
  request: new Request("http://localhost/"),
  route: "/",
  params: {},
  query: {},
  headers: {},
  hx: () => "hx-get='/draw/test'",
};

export async function renderComponent(cmp: any) {
  return render(cmp(emptyProps), emptyProps);
}
```

### Unit Test Example

```ts
import { assertEquals } from "@std/assert";
import { component, html } from "@vseplet/morph";
import { renderComponent } from "./helpers.ts";

Deno.test("renders greeting", async () => {
  const greeting = component<{ name: string }>((props) =>
    html`<h1>Hello, ${props.name}!</h1>`
  );

  const result = await renderComponent(() => greeting({ name: "World" }));

  assertEquals(result.html.includes("Hello, World!"), true);
});
```

### Integration Test Example

```ts
import { assertEquals } from "@std/assert";
import { Morph, basic, component, html } from "@vseplet/morph";

Deno.test("page returns HTML", async () => {
  const page = component(() => html`<h1>Test</h1>`);

  const app = new Morph({ layout: basic({ htmx: true }) })
    .page("/", page)
    .build();

  const response = await app.fetch(new Request("http://localhost/"));
  const text = await response.text();

  assertEquals(response.status, 200);
  assertEquals(text.includes("<h1>Test</h1>"), true);
  assertEquals(text.includes("htmx.org"), true);
});
```

### Running Tests

```bash
deno test                    # Run all tests
deno test tests/unit/        # Run specific folder
deno test --watch            # Watch mode
```

## Common Patterns

### Authentication Check

```ts
const protectedPage = component((props) => {
  const token = props.headers.authorization;

  if (!token) {
    return html`
      ${meta({ statusCode: 401 })}
      <h1>Unauthorized</h1>
      <a href="/login">Login</a>
    `;
  }

  return html`<h1>Protected Content</h1>`;
});
```

### Error Handling

```ts
const userPage = component(async (props) => {
  try {
    const user = await fetchUser(props.params.id);
    return html`<div>${user.name}</div>`;
  } catch (error) {
    return html`
      ${meta({ statusCode: 404 })}
      <h1>User not found</h1>
    `;
  }
});
```

### Loading States with HTMX

```ts
const slowContent = component(async (props) => {
  await new Promise(r => setTimeout(r, 2000));
  return html`<div>Loaded!</div>`;
});

const page = component(() => html`
  <button hx-get="/draw/${slowContent.name}"
          hx-target="#content"
          hx-indicator="#spinner">
    Load
  </button>
  <span id="spinner" class="htmx-indicator">Loading...</span>
  <div id="content"></div>
`);
```

### Redirect

```ts
const redirectPage = component(() => html`
  ${meta({
    statusCode: 302,
    headers: { "Location": "/new-page" }
  })}
`);
```

## Quick Reference

### Imports

```ts
import {
  // Core
  component,      // Create component
  html,           // HTML template tag
  morph,          // Default Morph instance
  Morph,          // Morph class for custom instances

  // Styling
  styled,         // CSS-in-JS (returns class name)

  // Meta
  meta,           // Set title, status, headers

  // Client JS
  js,             // Inline JS block
  fn,             // Function to JS
  onclick,        // onclick attribute
  script,         // <script> tag

  // Layout
  basic,          // Pre-built layout with options
  layout,         // Custom layout helper

  // RPC
  rpc,            // RPC handler creator

  // Types
  type MorphPageProps,
  type MorphTemplate,
  type Layout,
} from "@vseplet/morph";
```

### HTMX Attributes Cheatsheet

| Attribute | Description | Example |
|-----------|-------------|---------|
| `hx-get` | GET request | `${props.hx()}` or `hx-get="/path"` |
| `hx-post` | POST request | `hx-post="/api/submit"` |
| `hx-trigger` | Event trigger | `click`, `every 1s`, `keyup changed delay:300ms` |
| `hx-target` | Update target | `#id`, `this`, `closest div` |
| `hx-swap` | Swap method | `outerHTML`, `innerHTML`, `beforeend` |
| `hx-indicator` | Loading indicator | `#spinner` |
| `hx-include` | Include inputs | `closest form`, `#other-form` |
| `hx-vals` | JSON values | `hx-vals='{"key": "value"}'` |

### Layout Options (`basic()`)

```ts
basic({
  htmx: true,           // Include HTMX
  alpine: true,         // Include Alpine.js
  bootstrap: true,      // Include Bootstrap CSS
  bootstrapIcons: true, // Include Bootstrap Icons
  hyperscript: true,    // Include Hyperscript
  jsonEnc: true,        // Include HTMX json-enc extension
  bluma: true,          // Include Bulma CSS
  title: "Default",     // Default page title
  head: "",             // Extra <head> content
  bodyStart: "",        // Content at <body> start
  bodyEnd: "",          // Content at <body> end
  wrapper: component,   // Wrapper component
})
```

## Troubleshooting

### Component not updating with HTMX

1. Check component is registered with `.partial()`
2. Verify `props.hx()` is in the element
3. Ensure `hx-swap="outerHTML"` is set

### CSS not appearing

1. Use `styled` inside `class="${styled`...`}"`
2. Check component is rendered through `morph.page()` (not just `render()`)

### Props undefined

1. Components receive props through `component<T>((props) => ...)`
2. When calling: `myComponent({ prop: value })`
3. Page props (request, params, etc.) are auto-injected

### TypeScript errors with component

```ts
// If type inference fails, explicitly type the component:
const myComponent = component<{ name: string }>((props) =>
  html`<div>${props.name}</div>`
);
```
