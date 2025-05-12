import { Hono } from "@hono/hono";
import { component, fn, html, meta, morph, styled } from "@vseplet/morph";

export const homePage = component(async (props) =>
  html`
  ${
    meta({
      title: "Hello, World!",
      statusCode: 303,
    })
  }

  <h1>Hello, World!</h1>

  <div class="${styled`
    color: red;
  `}">
    ${props.request.url}
  <div>

  ${
    fn(() => {
      console.log("Hello!");
    })
  }
`
);

Deno.serve(
  new Hono()
    .all("/*", async (c) =>
      // deno-fmt-ignore
      await morph
        .page("/*", homePage)
        .fetch(c.req.raw)).fetch,
);
