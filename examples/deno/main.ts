import { Hono } from "@hono/hono";
import { basic, component, fn, html, meta, morph, rpc, styled } from "../../source/mod.ts";

// deno-fmt-ignore
export const homePage = component((props) => html`
  ${meta({
    title: `Hello, World! ${Math.random()}`,
    statusCode: 303,
  })}
  <a ${user.rpc.test({x: 1, y: "2"})} hx-trigger="every 1s">Загрузить юзера</a>

  <h1>Hello, World!</h1>
  <div class="${styled`
    color: red;
  `}">
    ${props.request.url}
  <div>
  ${fn(() => alert("Hello!"))} // client-side code
`);

const user = rpc({
  test: async (req, args: { x: number; y: string }) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // deno-fmt-ignore
    return html`
      <div class="${styled`
        border: 1px solid red;
      `}">
        ${meta({ statusCode: 333 })}
        <div>User: ${Math.random()} | ${Math.random()}</div>
        <h2>${req.route}</h2>
        <span>${args.x} ${args.y}</span>
      </div>
    `;
  },
});

const fetch = new Hono()
  .all("/*", async (c) =>
    await morph
      .rpc(user)
      .page("/*", homePage)
      .fetch(c.req.raw))
  .fetch;

Deno.serve(fetch);
