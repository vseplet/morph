import { Hono } from "@hono/hono";
import { component, fn, html, meta, morph, styled } from "@vseplet/morph";

// deno-fmt-ignore
export const homePage = component((props) => html`
  ${meta({
    title: "Hello, World!",
    statusCode: 303,
  })}

  <h1>Hello, World!</h1>

  <div class="${styled`
    color: red;
  `}">
    ${props.request.url}
  <div>

  ${fn(() => {
    console.log("Hello!");
  })}
`);

Deno.serve(
  new Hono()
    .all("/*", async (c) =>
      await morph
        .page("/*", homePage)
        .fetch(c.req.raw)).fetch,
);
