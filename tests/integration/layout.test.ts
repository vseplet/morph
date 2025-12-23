import { assertEquals } from "@std/assert";
import { component, html, Morph, basic, layout, meta, styled } from "@vseplet/morph";

Deno.test("Layout: basic layout includes HTMX when enabled", async () => {
  const page = component(() => html`<div>Content</div>`);

  const app = new Morph({ layout: basic({ htmx: true }) })
    .page("/", page)
    .build();

  const response = await app.fetch(new Request("http://localhost/"));
  const html_content = await response.text();

  assertEquals(html_content.includes("htmx.org"), true);
});

Deno.test("Layout: basic layout excludes HTMX when disabled", async () => {
  const page = component(() => html`<div>Content</div>`);

  const app = new Morph({ layout: basic({ htmx: false }) })
    .page("/", page)
    .build();

  const response = await app.fetch(new Request("http://localhost/"));
  const html_content = await response.text();

  assertEquals(html_content.includes("htmx.org"), false);
});

Deno.test("Layout: basic layout includes Alpine.js when enabled", async () => {
  const page = component(() => html`<div>Content</div>`);

  const app = new Morph({ layout: basic({ alpine: true }) })
    .page("/", page)
    .build();

  const response = await app.fetch(new Request("http://localhost/"));
  const html_content = await response.text();

  assertEquals(html_content.includes("alpinejs"), true);
});

Deno.test("Layout: basic layout includes Bootstrap when enabled", async () => {
  const page = component(() => html`<div>Content</div>`);

  const app = new Morph({ layout: basic({ bootstrap: true }) })
    .page("/", page)
    .build();

  const response = await app.fetch(new Request("http://localhost/"));
  const html_content = await response.text();

  assertEquals(html_content.includes("bootstrap"), true);
});

Deno.test("Layout: basic layout includes Bootstrap Icons when enabled", async () => {
  const page = component(() => html`<div>Content</div>`);

  const app = new Morph({ layout: basic({ bootstrapIcons: true }) })
    .page("/", page)
    .build();

  const response = await app.fetch(new Request("http://localhost/"));
  const html_content = await response.text();

  assertEquals(html_content.includes("bootstrap-icons"), true);
});

Deno.test("Layout: basic layout includes Hyperscript when enabled", async () => {
  const page = component(() => html`<div>Content</div>`);

  const app = new Morph({ layout: basic({ hyperscript: true }) })
    .page("/", page)
    .build();

  const response = await app.fetch(new Request("http://localhost/"));
  const html_content = await response.text();

  assertEquals(html_content.includes("hyperscript.org"), true);
});

Deno.test("Layout: basic layout includes json-enc extension when enabled", async () => {
  const page = component(() => html`<div>Content</div>`);

  const app = new Morph({ layout: basic({ jsonEnc: true }) })
    .page("/", page)
    .build();

  const response = await app.fetch(new Request("http://localhost/"));
  const html_content = await response.text();

  assertEquals(html_content.includes("json-enc"), true);
});

Deno.test("Layout: basic layout includes Bulma when enabled", async () => {
  const page = component(() => html`<div>Content</div>`);

  const app = new Morph({ layout: basic({ bluma: true }) })
    .page("/", page)
    .build();

  const response = await app.fetch(new Request("http://localhost/"));
  const html_content = await response.text();

  assertEquals(html_content.includes("bulma"), true);
});

Deno.test("Layout: basic layout sets default title", async () => {
  const page = component(() => html`<div>Content</div>`);

  const app = new Morph({ layout: basic({ title: "My Default Title" }) })
    .page("/", page)
    .build();

  const response = await app.fetch(new Request("http://localhost/"));
  const html_content = await response.text();

  assertEquals(html_content.includes("<title>My Default Title</title>"), true);
});

Deno.test("Layout: page meta title overrides layout default title", async () => {
  const page = component(() => html`
    ${meta({ title: "Page Title" })}
    <div>Content</div>
  `);

  const app = new Morph({ layout: basic({ title: "Default Title" }) })
    .page("/", page)
    .build();

  const response = await app.fetch(new Request("http://localhost/"));
  const html_content = await response.text();

  assertEquals(html_content.includes("<title>Page Title</title>"), true);
  assertEquals(html_content.includes("<title>Default Title</title>"), false);
});

Deno.test("Layout: basic layout adds head content", async () => {
  const page = component(() => html`<div>Content</div>`);

  const app = new Morph({
    layout: basic({
      head: `<link rel="icon" href="/favicon.ico"><meta name="author" content="Test">`,
    }),
  })
    .page("/", page)
    .build();

  const response = await app.fetch(new Request("http://localhost/"));
  const html_content = await response.text();

  assertEquals(html_content.includes('rel="icon"'), true);
  assertEquals(html_content.includes('name="author"'), true);
});

Deno.test("Layout: basic layout adds bodyStart content", async () => {
  const page = component(() => html`<main>Main Content</main>`);

  const app = new Morph({
    layout: basic({
      bodyStart: `<header id="top-header">Header</header>`,
    }),
  })
    .page("/", page)
    .build();

  const response = await app.fetch(new Request("http://localhost/"));
  const html_content = await response.text();

  assertEquals(html_content.includes('<header id="top-header">Header</header>'), true);
  // bodyStart should come before main content
  const headerIndex = html_content.indexOf("top-header");
  const mainIndex = html_content.indexOf("Main Content");
  assertEquals(headerIndex < mainIndex, true);
});

Deno.test("Layout: basic layout adds bodyEnd content", async () => {
  const page = component(() => html`<main>Main Content</main>`);

  const app = new Morph({
    layout: basic({
      bodyEnd: `<footer id="bottom-footer">Footer</footer>`,
    }),
  })
    .page("/", page)
    .build();

  const response = await app.fetch(new Request("http://localhost/"));
  const html_content = await response.text();

  assertEquals(html_content.includes('<footer id="bottom-footer">Footer</footer>'), true);
  // bodyEnd should come after main content
  const mainIndex = html_content.indexOf("Main Content");
  const footerIndex = html_content.indexOf("bottom-footer");
  assertEquals(mainIndex < footerIndex, true);
});

Deno.test("Layout: custom layout using layout helper", async () => {
  const customLayout = layout<{ siteName?: string }>((options) => ({
    layout: (page, css, js, pageMeta) => ({
      text: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>${pageMeta.title || options.siteName || "Default"}</title>
            <style>${css}</style>
          </head>
          <body>
            <div id="custom-layout">
              ${page}
            </div>
            <script>${js}</script>
          </body>
        </html>
      `,
      meta: pageMeta,
    }),
  }));

  const page = component(() => html`<p>Custom layout content</p>`);

  const app = new Morph({ layout: customLayout({ siteName: "My Site" }) })
    .page("/", page)
    .build();

  const response = await app.fetch(new Request("http://localhost/"));
  const html_content = await response.text();

  assertEquals(html_content.includes("<!DOCTYPE html>"), true);
  assertEquals(html_content.includes('<div id="custom-layout">'), true);
  assertEquals(html_content.includes("Custom layout content"), true);
  assertEquals(html_content.includes("<title>My Site</title>"), true);
});

Deno.test("Layout: custom layout with page meta override", async () => {
  const customLayout = layout<{}>((options) => ({
    layout: (page, css, js, pageMeta) => ({
      text: `
        <html>
          <head><title>${pageMeta.title || "Fallback"}</title></head>
          <body>${page}</body>
        </html>
      `,
      meta: pageMeta,
    }),
  }));

  const page = component(() => html`
    ${meta({ title: "Page Specific Title" })}
    <div>Content</div>
  `);

  const app = new Morph({ layout: customLayout({}) })
    .page("/", page)
    .build();

  const response = await app.fetch(new Request("http://localhost/"));
  const html_content = await response.text();

  assertEquals(html_content.includes("<title>Page Specific Title</title>"), true);
});

Deno.test("Layout: CSS is collected and placed in style tag", async () => {
  const page = component(() => html`
    <div class="${styled`background: red;`}">
      <span class="${styled`color: blue;`}">Text</span>
    </div>
  `);

  const app = new Morph({ layout: basic({}) })
    .page("/", page)
    .build();

  const response = await app.fetch(new Request("http://localhost/"));
  const html_content = await response.text();

  // Both CSS rules should be in the style tag
  assertEquals(html_content.includes("<style>"), true);
  assertEquals(html_content.includes("background: red"), true);
  assertEquals(html_content.includes("color: blue"), true);
});

Deno.test("Layout: morph.layout() changes layout dynamically", async () => {
  const minimalLayout = layout<{}>(() => ({
    layout: (page, css, js, pageMeta) => ({
      text: `<html><body id="minimal">${page}</body></html>`,
      meta: pageMeta,
    }),
  }));

  const page = component(() => html`<p>Content</p>`);

  // Start with basic layout
  const morph = new Morph({ layout: basic({ htmx: true }) });

  // Change to minimal layout
  const app = morph
    .layout(minimalLayout({}))
    .page("/", page)
    .build();

  const response = await app.fetch(new Request("http://localhost/"));
  const html_content = await response.text();

  assertEquals(html_content.includes('id="minimal"'), true);
  assertEquals(html_content.includes("htmx.org"), false);
});

Deno.test("Layout: all basic options combined", async () => {
  const page = component(() => html`
    ${meta({ title: "Combined Test" })}
    <div class="${styled`padding: 20px;`}">Combined content</div>
  `);

  const app = new Morph({
    layout: basic({
      htmx: true,
      alpine: true,
      bootstrap: true,
      bootstrapIcons: true,
      hyperscript: true,
      jsonEnc: true,
      bluma: true,
      title: "Default",
      head: `<meta name="test" content="value">`,
      bodyStart: `<nav>Nav</nav>`,
      bodyEnd: `<footer>Foot</footer>`,
    }),
  })
    .page("/", page)
    .build();

  const response = await app.fetch(new Request("http://localhost/"));
  const html_content = await response.text();

  // All libraries included
  assertEquals(html_content.includes("htmx.org"), true);
  assertEquals(html_content.includes("alpinejs"), true);
  assertEquals(html_content.includes("bootstrap"), true);
  assertEquals(html_content.includes("bootstrap-icons"), true);
  assertEquals(html_content.includes("hyperscript.org"), true);
  assertEquals(html_content.includes("json-enc"), true);
  assertEquals(html_content.includes("bulma"), true);

  // Custom content
  assertEquals(html_content.includes("<title>Combined Test</title>"), true);
  assertEquals(html_content.includes('name="test"'), true);
  assertEquals(html_content.includes("<nav>Nav</nav>"), true);
  assertEquals(html_content.includes("<footer>Foot</footer>"), true);
  assertEquals(html_content.includes("padding: 20px"), true);
});
