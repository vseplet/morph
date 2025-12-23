# Morph

<p align="center">
  <img src="./morph.png" alt="Morph mascot" width="200" />
</p>

[![JSR](https://jsr.io/badges/@vseplet/morph)](https://jsr.io/@vseplet/morph)
[![GitHub commit activity](https://img.shields.io/github/commit-activity/m/vseplet/morph)](https://github.com/vseplet/morph/pulse)
[![GitHub last commit](https://img.shields.io/github/last-commit/vseplet/morph)](https://github.com/vseplet/morph/commits/main)

> **Note:** This package is under active development. Contributions, feedback, and pull requests are welcome!

## What is Morph?

**Morph** is a zero-build fullstack library for creating web interfaces with server-side rendering. Built on [HTMX](https://htmx.org/) and [Hono](https://hono.dev/), it works with Deno, Bun, and Node.js.

**Perfect for:** Admin panels, dashboards, Telegram Web Apps, internal tools, and small projects where you don't want to maintain a separate frontend.

### Why Morph?

- **No build step** — just write TypeScript and run
- **Server-side rendering** — components render on the server with full access to your backend
- **HTMX-powered** — update parts of the page without writing JavaScript
- **Embed anywhere** — add a web UI to any existing Deno/Bun/Node project
- **Minimal footprint** — no project structure requirements, no config files

## Quick Start

### 1. Install

```bash
# Deno
deno add jsr:@vseplet/morph jsr:@hono/hono

# Bun
bunx jsr add @vseplet/morph && bun add hono

# Node
npx jsr add @vseplet/morph && npm i hono @hono/node-server
```

### 2. Create `main.ts`

```ts
import { Hono } from "@hono/hono";  // Bun/Node: import { Hono } from "hono";
import { component, html, morph } from "@vseplet/morph";

// Define a page component
const homePage = component(() => html`
  <h1>Hello, Morph!</h1>
  <p>This is rendered on the server.</p>
`);

// Create the app
const app = new Hono().all("/*", (c) =>
  morph
    .page("/", homePage)
    .fetch(c.req.raw)
);

// Start the server
Deno.serve(app.fetch);           // Deno
// export default app;           // Bun
// serve(app);                   // Node (import { serve } from "@hono/node-server")
```

### 3. Run

```bash
deno -A main.ts    # Deno
bun main.ts        # Bun
npx tsx main.ts    # Node
```

Open http://localhost:8000 — done!

### 4. Add Interactivity

Let's add a component that re-renders itself every second:

```ts
import { component, html, morph, meta, styled } from "@vseplet/morph";

// Self-updating component
const clock = component((props) => html`
  <div ${props.hx()} hx-trigger="every 1s" hx-swap="outerHTML">
    <span class="${styled`font-size: 2rem; font-family: monospace;`}">
      ${new Date().toLocaleTimeString()}
    </span>
  </div>
`);

// Page with the clock
const homePage = component(() => html`
  ${meta({ title: "Morph Clock" })}
  <h1>Current Time</h1>
  ${clock({})}
`);

// Register partial for HTMX updates, then add page
const app = new Hono().all("/*", (c) =>
  morph
    .partial(clock)
    .page("/", homePage)
    .fetch(c.req.raw)
);
```

The `props.hx()` returns an `hx-get` attribute pointing to this component. HTMX will fetch fresh HTML from the server every second.

---

## Table of Contents

- [Documentation](#documentation)
  - [Templates](#templates)
  - [Components](#components)
  - [Client-Side JavaScript](#client-side-javascript)
  - [Styles](#styles)
  - [Routing, Pages and Hono](#routing-pages-and-hono)
  - [Layout](#layout)
  - [Wrapper](#wrapper)
  - [Meta](#meta)
  - [Partial and HTMX](#partial-and-htmx)
  - [RPC](#rpc)
- [Examples](./examples/)
- [Conclusion](#conclusion)
- [License](#license)

## Documentation

Key points to understand:

Morph uses Hono under the hood for routing, middleware functions, and more. All
routes are described using Hono's routing syntax.

In Morph, everything consists of components that return template literals. The
templates are described using the `html` tagged template literal:
html`some html here`.

All components, templates, and other elements are rendered on the server upon
request. In the future, the rendering results of pages and individual components
may be cacheable.

### Templates

All components in Morph are functions that return template literals. Here's a
simple example:

```ts
html`
  <h1>Hello World<h1>
`
```

Template literals are flexible and support all JavaScript template literal
features, including nested templates:

```ts
const buttonName = "Click Me"

html`
  <h1>Hello World<h1>
  ${html`
    <button>${buttonName}</button>
  `}
`
```

They can also include functions (including asynchronous ones) that return
templates:

```ts
const buttonName = "Click Me"

html`
  <h1>Hello World<h1>
  ${async () => {
    // some async code here
    return html`
      <p>And here's some data</p>
    `
  }}
`
```

### Components

Components are the building blocks of Morph applications. They are functions
(possibly asynchronous) that accept props and return template literals. Pages
themselves are also components.

Here's a simple component example:

```ts
const cmp = component(
  async () =>
    html`
      <div>
        <p>Hello, World</p>
      </div>
    `,
);
```

Components can accept typed props that are defined using TypeScript generics:

```ts
component<{ title: string }>(
  async (props) =>
    html`
      <h1>${props.title}</h1>
    `,
);
```

Besides user-defined props, components have access to default props defined in
the MorphPageProps type, including: `request: Request` and
`headers: Record<string, string>`. This provides immediate access to request
headers, parameters, and other request details during component rendering.

Components can be composed together:

```ts
const h1 = component<{ title: string }>((props) =>
  html`
    <h1>${props.title}</h1>
  `
);

const page = component(() =>
  html`
    <page>
      ${h1({ title: "Hello, World" })}
    </page>
  `
);
```

And they support array operations for dynamic rendering:

```ts
const h1 = component<{ title: string }>((props) =>
  html`
    <h1>${props.title}</h1>
  `
);

const page = component(() =>
  html`
    <page>
      ${["title 1", "title 2"].map((title) => h1({ title }))}
    </page>
  `
);
```

### Client-Side JavaScript

You can embed JavaScript code that will run on the client side directly in your
templates. Here's a simple example:

```ts
html`
  <div>
    <p id="title">Hello, World</p>
    ${js`document.querySelector('#title').innerHTML = 'LoL';`}
  </div>
`;
```

This code will be wrapped in an anonymous function and added to the page's
`<body>` right after the main HTML content.

Additionally, you can define a function that will be transpiled to a string and
inserted into the page code in a similar way:

```ts
html`
  <div>
    <p id="title">Hello, World</p>
    ${fn(() => document.querySelector("#title").innerHTML = "LoL")}
  </div>
`;
```

### Styles

Not everything is convenient to describe in separate .css files or (especially)
inline through style=... In some cases, it might be more convenient to generate
an entire class at once, and for this purpose, we have the following approach:

```ts
const color = "#0056b3";

const buttonStyle = styled`
  border-radius: 15px;
  border: 1px solid black;
  cursor: pointer;
  font-size: 16px;

  &:hover {
    background-color: ${color};
  }
`;

html`
  <div>
    <button class="${buttonStyle}">Click Me</button>
  </div>
`;
```

### Routing, pages and Hono

The entry point is the `morph` object, which provides methods for creating pages
and handling their rendering on request:

```ts
const website = morph
  .page("/a", cmpA)
  .page("/b", cmpB);
```

Then, using Hono, you can create an application and start serving it:

```ts
const app = new Hono()
  .all("/*", async (c) => website.fetch(c.req.raw));

// Start the server (implementation varies by runtime)
Deno.serve(app.fetch); // for Deno
// export default app; // for Bun
// serve(app); // for Node.js
```

### Layout

Layouts define how pages are wrapped in the final HTML document. A layout is responsible for adding the `<html>`, `<head>`, and `<body>` tags, as well as including necessary scripts (like HTMX) and styles.

Morph provides a `basic` layout helper with common library integrations:

```ts
import { basic, morph, component, html } from "@vseplet/morph";

const page = component(() => html`<h1>Hello!</h1>`);

const website = morph
  .layout(basic({
    htmx: true,           // Include HTMX
    alpine: true,         // Include Alpine.js
    bootstrap: true,      // Include Bootstrap CSS
    bootstrapIcons: true, // Include Bootstrap Icons
    hyperscript: true,    // Include Hyperscript
    jsonEnc: true,        // Include HTMX JSON encoding extension
    bluma: true,          // Include Bulma CSS
    title: "My App",      // Default page title
    head: `<link rel="icon" href="/favicon.ico">`, // Extra head content
    bodyStart: `<nav>...</nav>`,  // Content at body start
    bodyEnd: `<footer>...</footer>`, // Content at body end
  }))
  .page("/", page);
```

You can also create custom layouts using the `layout` helper:

```ts
import { layout, type LayoutOptions } from "@vseplet/morph";

const customLayout = layout<{ customOption?: boolean }>((options) => ({
  layout: (page, css, js, meta) => ({
    text: `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>${meta.title || "Default"}</title>
          <style>${css}</style>
        </head>
        <body>
          ${page}
          <script>${js}</script>
        </body>
      </html>
    `,
    meta,
  }),
}));
```

### Wrapper

Wrappers allow you to wrap all page components with a common layout component. This is useful for adding navigation, sidebars, or other persistent UI elements.

```ts
import { basic, morph, component, html } from "@vseplet/morph";

// Create a wrapper component that receives child content
const appWrapper = component<{ child: MorphTemplate }>((props) => html`
  <div class="app-container">
    <nav>
      <a href="/">Home</a>
      <a href="/about">About</a>
    </nav>
    <main>
      ${props.child}
    </main>
    <footer>© 2024</footer>
  </div>
`);

// Use wrapper in layout
const website = morph
  .layout(basic({
    htmx: true,
    wrapper: appWrapper,
  }))
  .page("/", homePage)
  .page("/about", aboutPage);
```

The wrapper component receives a `child` prop containing the rendered page content. All pages will be wrapped with this component automatically.

### Meta

A simple mechanism that allows you to set template values from any component. For example, to set the page title:

```ts
const cmp = component(
  async () =>
    html`
      ${meta({
        title: "Hello, World!"
      })}
      <div>
        <p>Hello, World</p>
      </div>
    `
);
```

You can also add content to the head or body sections:

```ts
meta({
  head: `<link rel="stylesheet" href="styles.css">` // add CSS
  bodyEnd: `<script>alert("Hi!")</script>`
})
```

Additionally, it allows you to set HTTP headers, status codes, and other response metadata.

### Partial and HTMX

HTMX is a powerful library that enables moving data handling and page/component updates from JavaScript to HTML, seamlessly integrating with HTML syntax. In Morph, you can re-render individual components without reloading the entire page (the component is rendered on the server).

#### Basic Example: Auto-refreshing Component

```ts
const randomNumber = component((props) => html`
  <div ${props.hx()} hx-swap="outerHTML" hx-trigger="every 1s">
    Random: ${Math.random()}
  </div>
`);
```

The `props.hx()` function returns `hx-get='/draw/{componentName}'` attribute that tells HTMX where to fetch the updated component.

#### Registering Partials

To enable component re-rendering, register it with `.partial()`:

```ts
const website = morph
  .partial(randomNumber)
  .page("/", homePage);
```

This creates a route at `/draw/{componentName}` that returns the rendered component HTML.

#### Example: Click to Refresh

```ts
const counter = component((props) => {
  const count = parseInt(props.query?.count ?? "0");
  return html`
    <div ${props.hx()}?count=${count + 1}
         hx-swap="outerHTML"
         hx-trigger="click">
      <button>Clicked ${count} times (click to increment)</button>
    </div>
  `;
});
```

#### Example: Load Content on Demand

```ts
const userCard = component(async (props) => {
  const userId = props.query?.id;
  if (!userId) {
    return html`<div>No user selected</div>`;
  }
  const user = await fetchUser(userId);
  return html`
    <div class="${styled`padding: 16px; border: 1px solid #ccc;`}">
      <h3>${user.name}</h3>
      <p>${user.email}</p>
    </div>
  `;
});

const page = component(() => html`
  <div>
    <button hx-get="/draw/${userCard.name}?id=1"
            hx-target="#user-container"
            hx-swap="innerHTML">
      Load User 1
    </button>
    <button hx-get="/draw/${userCard.name}?id=2"
            hx-target="#user-container"
            hx-swap="innerHTML">
      Load User 2
    </button>
    <div id="user-container">Select a user</div>
  </div>
`);

morph
  .partial(userCard)
  .page("/", page);
```

#### Example: Form Submission

```ts
const searchResults = component(async (props) => {
  const query = props.query?.q ?? "";
  if (!query) {
    return html`<p>Enter a search term</p>`;
  }
  const results = await search(query);
  return html`
    <ul>
      ${results.map(item => html`<li>${item.title}</li>`)}
    </ul>
  `;
});

const searchPage = component(() => html`
  <div>
    <input type="text"
           name="q"
           placeholder="Search..."
           hx-get="/draw/${searchResults.name}"
           hx-target="#results"
           hx-trigger="keyup changed delay:300ms">
    <div id="results">
      ${searchResults({})}
    </div>
  </div>
`);
```

#### Common HTMX Attributes

| Attribute | Description | Example |
|-----------|-------------|---------|
| `hx-get` | GET request URL | `${props.hx()}` or `hx-get="/draw/cmp"` |
| `hx-post` | POST request URL | `hx-post="/api/submit"` |
| `hx-trigger` | Event that triggers request | `click`, `every 1s`, `keyup changed delay:300ms` |
| `hx-target` | Element to update | `#result`, `this`, `closest div` |
| `hx-swap` | How to swap content | `outerHTML`, `innerHTML`, `beforeend` |
| `hx-indicator` | Loading indicator | `#spinner` |

For more information about HTMX attributes, refer to the [official HTMX documentation](https://htmx.org/docs/).

### RPC

RPC (Remote Procedure Call) provides a type-safe way to call server-side functions from HTMX attributes. This is useful when you need to pass arguments to the server.

```ts
import { rpc, morph, component, html, styled } from "@vseplet/morph";

// Define RPC handlers with typed arguments
const userApi = rpc({
  // Handler receives request context and typed arguments
  getUser: async (req, args: { userId: number }) => {
    const user = await fetchUser(args.userId);
    return html`
      <div class="${styled`border: 1px solid #ccc; padding: 10px;`}">
        <h3>${user.name}</h3>
        <p>${user.email}</p>
      </div>
    `;
  },

  updateName: async (req, args: { userId: number; name: string }) => {
    await updateUser(args.userId, { name: args.name });
    return html`<span>Name updated to ${args.name}</span>`;
  },
});

// Use RPC in components
const page = component(() => html`
  <div>
    <!-- Call RPC with arguments using hx-vals -->
    <button ${userApi.rpc.getUser({ userId: 123 })} hx-target="#result">
      Load User
    </button>

    <div id="result"></div>
  </div>
`);

// Register RPC handlers with morph
const website = morph
  .rpc(userApi)
  .page("/", page);
```

The `rpc()` function returns an object with:
- `rpc` - Object with methods that generate HTMX attributes (`hx-ext`, `hx-post`, `hx-vals`)
- `handlers` - The handler functions
- `name` - Auto-generated unique name for routing

RPC endpoints are automatically created at `/rpc/{name}/{method}` and use JSON encoding for arguments.

## Conclusion

This project is currently in the prototyping stage. Many things may change, be
added, or removed as we work towards the main project goals. I welcome any help
and contributions:

- Test the library and report issues
- Study the documentation and suggest improvements
- Submit pull requests with your changes
- Share your ideas and feedback
- Use Morph in your pet projects

Feel free to reach out to me on Telegram for any questions or discussions:
[@vseplet](https://t.me/vseplet)

## License

[MIT](./LICENSE)
