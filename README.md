# Morph

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
  - [License](#license)

Morph combines the best of SSR, SPA, and islands architecture,
while sticking to plain HTML, CSS, and JS.

I created Morph while optimizing the development of Telegram Web Apps
using Deno and Deno Deploy.
Traditional stacks that separate frontend and backend with complex APIs
and use React or Vue felt overly heavy, complex, and expensive for small projects.

Currently, Morph runs on [Hono](https://hono.dev/),
but support for other backends may be added in the future.

### Core principles:
- Each component can call its own API that returns hypertext (other components)\
- All components are rendered on the server and have access to server-side context\
- Components can be rendered and re-rendered independently\
- Components form a hierarchy, can be nested in one another, and returned from APIs\
- Minimal or no client-side JavaScript\
- No build step\
- No need to design API data structures upfront\
- The library can be embedded into any Deno/Node/Bun project\

Morph is ideal when there’s no need to split frontend and backend into separate services.
It works especially well for small Telegram bots,
desktop apps, or internal tools that don’t justify a full frontend stack
but still need a clean and dynamic UI.


## Get started
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

***Deno***
```ts
import { Hono } from "@hono/hono";
import { component, fn, html, meta, morph, styled } from "@vseplet/morph";
```

***Bun***
```ts
import { Hono } from "hono";
import { component, fn, html, meta, morph, styled } from "@vseplet/morph";
```

***Node***
```ts
import { serve } from '@hono/node-server'
import { Hono } from "hono";
import { component, fn, html, meta, morph, styled } from "@vseplet/morph";
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

## License

[MIT](./LICENSE)
