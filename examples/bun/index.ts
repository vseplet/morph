import { Hono } from "hono";
import { component, fn, html, meta, morph, styled } from "@vseplet/morph";

const app = new Hono()
  .all("/*", async (c) =>
    await morph
      .page(
        "/",
        component(async () =>
          html`
            ${meta({ title: "Hello, World!" })}

            <h1>Hello, World!</h1>

            <pre class="${styled`color:red;`}">${(await (await fetch(
              "https://icanhazdadjoke.com/",
              {
                headers: {
                  Accept: "application/json",
                  "User-Agent": "My Fun App (https://example.com)",
                },
              },
            )).json()).joke}</pre>

            ${fn(() => alert("Hello!"))}
          `
        ),
      )
      .fetch(c.req.raw));

export default app;
