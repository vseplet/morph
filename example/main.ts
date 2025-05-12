import { Hono } from "@hono/hono";
import { morph, component, html, js } from "@vseplet/morph";

const app = new Hono();

morph.page("/", component(async () => html`
  ${await Deno.readTextFile("./deno.json")}
  <h1>Hello, World!</h1>
  ${js`
    console.log("Hello, World!")
  `}
`))

app.all('/*', async (c) => await morph.fetch(c.req.raw))
Deno.serve(app.fetch);
