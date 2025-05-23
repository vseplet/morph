# Morph

<p align="center">
  <img src="./morph.png" alt="Morph mascot" width="256" />
</p>

[![JSR](https://jsr.io/badges/@vseplet/morph)](https://jsr.io/@vseplet/morph)
[![GitHub commit activity](https://img.shields.io/github/commit-activity/m/vseplet/morph)](https://github.com/vseplet/morph/pulse)
[![GitHub last commit](https://img.shields.io/github/last-commit/vseplet/morph)](https://github.com/vseplet/morph/commits/main)

## 👋 👋 ATTENTION!
> This package is under development and will be frequently updated. The author
> would appreciate any help, advice, and pull requests! Thank you for your
> understanding 😊

---

**Morph** is an embeddable fullstack library
for building [Hypermedia-Driven Applications](https://htmx.org/essays/hypermedia-driven-applications/)
without a build step, based on [HTMX](https://htmx.org/).
- [Morph](#morph)
  - [👋 👋 ATTENTION!](#--attention)
    - [Core principles:](#core-principles)
  - [Get started](#get-started)
    - [Add packages](#add-packages)
    - [Make main.ts and add imports](#make-maints-and-add-imports)
    - [Create simple page (for all runtimes)](#create-simple-page-for-all-runtimes)
    - [Setup server](#setup-server)
    - [And run](#and-run)
  - [Documentation](#documentation)
    - [Templates](#templates)
    - [Components](#components)
    - [Client-Side JavaScript](#client-side-javascript)
    - [Styles](#styles)
    - [Routing, pages and Hono](#routing-pages-and-hono)
    - [RPC and HTMX](#rpc-and-htmx)
    - [Layouts](#layouts)
    - [Meta](#meta)
  - [Conclusion](#conclusion)
  - [License](#license)

Morph combines the best of SSR, SPA, and islands architecture,
while sticking to plain HTML, CSS, and JS.

I created Morph while optimizing the development of Telegram Web Apps
using Deno and Deno Deploy.
Traditional stacks that separate frontend and backend with complex APIs
and use React or Vue felt overly heavy, complex, and expensive for small projects.

Currently, Morph runs on [Hono](https://hono.dev/) and [HTMX](https://htmx.org/),
but support for other backends may be added in the future.

### Core principles:
- Each component can call its own API that returns hypertext (other components)
- All components are rendered on the server and have access to server-side context
- Components can be rendered and re-rendered independently
- Components form a hierarchy, can be nested in one another, and returned from APIs
- Minimal or no client-side JavaScript
- No build step\
- No need to design API data structures upfront
- The library can be embedded into any Deno/Node/Bun project

Morph is ideal when there's no need to split frontend and backend into separate services.
It works especially well for small Telegram bots,
desktop apps, or internal tools that don't justify a full frontend stack
but still need a clean and dynamic UI.


## Get started
[(see full examples)](./examples/)

### Add packages
***Deno***\
```deno add jsr:@vseplet/morph jsr:@hono/hono```

***Bun***\
```bunx jsr add @vseplet/morph```\
```bun add hono```

***Node***\
```npx jsr add @vseplet/morph```\
```npm i --save hono @hono/node-server```

### Make main.ts and add imports

First, import Hono based on your runtime:

***Deno***
```ts
import { Hono } from "@hono/hono";
```

***Bun***
```ts
import { Hono } from "hono";
```

***Node***
```ts
import { serve } from '@hono/node-server'
import { Hono } from "hono";
```

Then, add Morph imports (same for all runtimes):

```ts
import { component, fn, js, html, meta, morph, styled } from "@vseplet/morph";
```

### Create simple page (for all runtimes)

```ts
const app = new Hono()
  .all("/*", async (c) =>
    await morph
      .page("/", component(async () => html`
          ${meta({ title: "Hello, World!" })}

          <h1>Hello, World!</h1>

          <pre class="${styled`color:red;`}">${
            (await (await fetch("https://icanhazdadjoke.com/", {
              headers: {
                Accept: "application/json",
                "User-Agent": "My Fun App (https://example.com)",
              },
            })).json()).joke
          }</pre>

          ${fn(() => alert("Hello!"))}
        `),
      )
    .fetch(c.req.raw));
```

### Setup server

***Deno***
```ts
Deno.serve(app.fetch)
```
***Bun***
```ts
export default app;
```
***Node***
```ts
serve(app)
```

### And run
***Deno***\
```deno -A main.ts```

***Bun***\
```bun main.ts```

***Node***\
```node --experimental-strip-types main.ts```

## Documentation

Key points to understand:

Morph uses Hono under the hood for routing, middleware functions, and more. All routes are described using Hono's routing syntax.

In Morph, everything consists of components that return template literals. The templates are described using the `html` tagged template literal: html`some html here`.

All components, templates, and other elements are rendered on the server upon request. In the future, the rendering results of pages and individual components may be cacheable.

### Templates

All components in Morph are functions that return template literals. Here's a simple example:

```ts
html`
  <h1>Hello World<h1>
`
```

Template literals are flexible and support all JavaScript template literal features, including nested templates:

```ts
const buttonName = "Click Me"

html`
  <h1>Hello World<h1>
  ${html`
    <button>${buttonName}</button>
  `}
`
```

They can also include functions (including asynchronous ones) that return templates:

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

Components are the building blocks of Morph applications. They are functions (possibly asynchronous) that accept props and return template literals. Pages themselves are also components.

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

Besides user-defined props, components have access to default props defined in the MorphPageProps type, including:
```request: Request``` and ```headers: Record<string, string>```. This provides immediate access to request headers, parameters, and other request details during component rendering.

Components can be composed together:

```ts
const h1 = component<{title: string}>((props) => html`<h1>${props.title}</h1>`);

const page = component(() => html`
  <page>
    ${h1({title: "Hello, World"})}
  </page>
`);
```

And they support array operations for dynamic rendering:

```ts
const h1 = component<{title: string}>((props) => html`<h1>${props.title}</h1>`);

const page = component(() => html`
  <page>
    ${["title 1", "title 2"].map(title => h1({title}))}
  </page>
`);
```

### Client-Side JavaScript

You can embed JavaScript code that will run on the client side directly in your templates. Here's a simple example:

```ts
html`
  <div>
    <p id="title">Hello, World</p>
    ${js`document.querySelector('#title').innerHTML = 'LoL';`}
  </div>
`
```

This code will be wrapped in an anonymous function and added to the page's `<body>` right after the main HTML content.

Additionally, you can define a function that will be transpiled to a string and inserted into the page code in a similar way:

```ts
html`
  <div>
    <p id="title">Hello, World</p>
    ${fn(() => document.querySelector('#title').innerHTML = 'LoL')}
  </div>
`
```

### Styles

Not everything is convenient to describe in separate .css files or (especially) inline through style=...
In some cases, it might be more convenient to generate an entire class at once, and for this purpose, we have the following approach:

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

The entry point is the `morph` object, which provides methods for creating pages and handling their rendering on request:

```ts
const website = morph
  .page("/a", cmpA)
  .page("/b", cmpB)
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

### RPC and HTMX

[Coming soon]

### Layouts

[Coming soon]

### Meta

[Coming soon]


## Conclusion

This project is currently in the prototyping stage. Many things may change, be added, or removed as we work towards the main project goals. I welcome any help and contributions:

- Test the library and report issues
- Study the documentation and suggest improvements
- Submit pull requests with your changes
- Share your ideas and feedback
- Use Morph in your pet projects

Feel free to reach out to me on Telegram for any questions or discussions: [@vseplet](https://t.me/vseplet)

## License

[MIT](./LICENSE)
