import { assertEquals } from "@std/assert";
import { Hono } from "@hono/hono";
import { component, html, morph, Morph, basic, styled } from "@vseplet/morph";

Deno.test("Partial: GET /draw/{name} returns component HTML", async () => {
  const counter = component<{ count?: number }>((props) => html`
    <div id="counter">
      <span>Count: ${props.count ?? 0}</span>
    </div>
  `);

  const app = new Morph({ layout: basic({ htmx: true }) })
    .partial(counter)
    .build();

  const response = await app.fetch(
    new Request(`http://localhost/draw/${counter.name}`)
  );

  assertEquals(response.status, 200);
  assertEquals(response.headers.get("Content-Type"), "text/html");

  const html_content = await response.text();
  assertEquals(html_content.includes('id="counter"'), true);
  assertEquals(html_content.includes("Count: 0"), true);
});

Deno.test("Partial: component can access query params", async () => {
  const greeting = component((props) => html`
    <div id="greeting">
      Hello, ${props.query?.name ?? "Guest"}!
    </div>
  `);

  const app = new Morph({ layout: basic({ htmx: true }) })
    .partial(greeting)
    .build();

  const response = await app.fetch(
    new Request(`http://localhost/draw/${greeting.name}?name=World`)
  );

  assertEquals(response.status, 200);
  const html_content = await response.text();
  assertEquals(html_content.includes("Hello, World!"), true);
});

Deno.test("Partial: component with styled CSS", async () => {
  const styledBox = component(() => html`
    <div class="${styled`
      background: blue;
      padding: 10px;
    `}">
      Styled Box
    </div>
  `);

  const app = new Morph({ layout: basic({ htmx: true }) })
    .partial(styledBox)
    .build();

  const response = await app.fetch(
    new Request(`http://localhost/draw/${styledBox.name}`)
  );

  assertEquals(response.status, 200);
  const html_content = await response.text();
  // Partial returns only HTML without CSS collection (by design)
  assertEquals(html_content.includes("Styled Box"), true);
});

Deno.test("Partial: async component renders correctly", async () => {
  const asyncData = component(async (props) => {
    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 10));
    return html`
      <div id="async-data">
        Data loaded at ${Date.now()}
      </div>
    `;
  });

  const app = new Morph({ layout: basic({ htmx: true }) })
    .partial(asyncData)
    .build();

  const response = await app.fetch(
    new Request(`http://localhost/draw/${asyncData.name}`)
  );

  assertEquals(response.status, 200);
  const html_content = await response.text();
  assertEquals(html_content.includes('id="async-data"'), true);
  assertEquals(html_content.includes("Data loaded at"), true);
});

Deno.test("Partial: multiple partials can coexist", async () => {
  const partialA = component(() => html`<div id="a">Partial A</div>`);
  const partialB = component(() => html`<div id="b">Partial B</div>`);

  const app = new Morph({ layout: basic({ htmx: true }) })
    .partial(partialA)
    .partial(partialB)
    .build();

  const responseA = await app.fetch(
    new Request(`http://localhost/draw/${partialA.name}`)
  );
  const responseB = await app.fetch(
    new Request(`http://localhost/draw/${partialB.name}`)
  );

  assertEquals(responseA.status, 200);
  assertEquals(responseB.status, 200);

  const htmlA = await responseA.text();
  const htmlB = await responseB.text();

  assertEquals(htmlA.includes("Partial A"), true);
  assertEquals(htmlB.includes("Partial B"), true);
});

Deno.test("Partial: props.hx() returns correct hx-get attribute", async () => {
  const selfUpdating = component((props) => html`
    <div ${props.hx()} hx-trigger="click" hx-swap="outerHTML">
      Click to refresh: ${Math.random()}
    </div>
  `);

  const app = new Morph({ layout: basic({ htmx: true }) })
    .partial(selfUpdating)
    .build();

  const response = await app.fetch(
    new Request(`http://localhost/draw/${selfUpdating.name}`)
  );

  const html_content = await response.text();
  assertEquals(html_content.includes(`hx-get='/draw/${selfUpdating.name}'`), true);
});
