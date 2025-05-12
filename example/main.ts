import { Hono } from "@hono/hono";
import { component, fn, html, meta, morph, styled } from "@vseplet/morph";

Deno.serve(
  new Hono()
    .all("/*", async (c) =>
      // deno-fmt-ignore
      await morph.page("/", component(async () => html`
        ${meta({
          title: "Hello, World!"
        })}

        <h1>Hello, World!</h1>

        <div class="${styled`
          color: red;
        `}">
          ${await Deno.readTextFile("./deno.json")}
        <div>

        ${fn(() => {
          console.log('Hello!')
        })}
      `)).fetch(c.req.raw)
    ).fetch,
);
