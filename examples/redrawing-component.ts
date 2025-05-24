import { Hono } from "@hono/hono";
import { component, html, meta, morph } from "@vseplet/morph";

let counter = 0;

const cmp = component(async (props) => html`
  <div ${props.hx()} hx-swap="outerHTML" hx-trigger="every 1s">
  <h1>draw: ${(counter++).toString()}</h1>

  <p>${(await (await fetch(
    "https://icanhazdadjoke.com/",
    {
      headers: {
        Accept: "application/json",
        "User-Agent": "My Fun App (https://example.com)",
      },
    },
  )).json()).joke}</p>
  </div>
`);

const website = morph
  .partial(cmp)
  .page(
    "/",
    component(() => html`
      ${meta({
        title: `Redrawing Component`,
      })}

      <p> Not redrawing ${counter}</p>
      ${cmp}
      <p> Not redrawing ${counter}</p>
    `),
  );

const app = new Hono()
  .all("/*", async (c) => await website.fetch(c.req.raw))
  .fetch;

Deno.serve(app);
