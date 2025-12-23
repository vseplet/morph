import { assertEquals } from "@std/assert";
import { component, html, Morph, basic, styled, meta, js, fn } from "@vseplet/morph";

Deno.test("Page: GET / returns full HTML document", async () => {
  const homePage = component(() => html`
    <h1>Welcome Home</h1>
    <p>This is the home page</p>
  `);

  const app = new Morph({ layout: basic({ htmx: true }) })
    .page("/", homePage)
    .build();

  const response = await app.fetch(new Request("http://localhost/"));

  assertEquals(response.status, 200);
  assertEquals(response.headers.get("Content-Type"), "text/html");

  const html_content = await response.text();

  // Check full HTML structure
  assertEquals(html_content.includes("<html>"), true);
  assertEquals(html_content.includes("<head>"), true);
  assertEquals(html_content.includes("<body>"), true);
  assertEquals(html_content.includes("</html>"), true);

  // Check content
  assertEquals(html_content.includes("Welcome Home"), true);
  assertEquals(html_content.includes("This is the home page"), true);

  // Check HTMX is included
  assertEquals(html_content.includes("htmx.org"), true);
});

Deno.test("Page: meta sets title correctly", async () => {
  const page = component(() => html`
    ${meta({ title: "My Custom Title" })}
    <div>Content</div>
  `);

  const app = new Morph({ layout: basic({ htmx: true }) })
    .page("/", page)
    .build();

  const response = await app.fetch(new Request("http://localhost/"));
  const html_content = await response.text();

  assertEquals(html_content.includes("<title>My Custom Title</title>"), true);
});

Deno.test("Page: meta sets status code and headers", async () => {
  const page = component(() => html`
    ${meta({
      statusCode: 404,
      statusText: "Not Found",
      headers: { "X-Custom": "test-value" },
    })}
    <div>Page not found</div>
  `);

  const app = new Morph({ layout: basic({ htmx: true }) })
    .page("/missing", page)
    .build();

  const response = await app.fetch(new Request("http://localhost/missing"));

  assertEquals(response.status, 404);
  assertEquals(response.statusText, "Not Found");
  assertEquals(response.headers.get("X-Custom"), "test-value");
});

Deno.test("Page: styled CSS is collected in head", async () => {
  const page = component(() => html`
    <div class="${styled`
      background: red;
      color: white;
    `}">
      Styled content
    </div>
  `);

  const app = new Morph({ layout: basic({ htmx: true }) })
    .page("/", page)
    .build();

  const response = await app.fetch(new Request("http://localhost/"));
  const html_content = await response.text();

  // CSS should be in <style> tag in head
  assertEquals(html_content.includes("<style>"), true);
  assertEquals(html_content.includes("background: red"), true);
  assertEquals(html_content.includes("color: white"), true);
});

Deno.test("Page: js() and fn() add scripts to body", async () => {
  const page = component(() => html`
    <div>Content</div>
    ${js`console.log("inline js");`}
    ${fn(() => console.log("function js"))}
  `);

  const app = new Morph({ layout: basic({ htmx: true }) })
    .page("/", page)
    .build();

  const response = await app.fetch(new Request("http://localhost/"));
  const html_content = await response.text();

  assertEquals(html_content.includes('console.log("inline js")'), true);
  assertEquals(html_content.includes('console.log("function js")'), true);
});

Deno.test("Page: component receives request props", async () => {
  const page = component((props) => html`
    <div>
      <p>URL: ${props.request.url}</p>
      <p>Route: ${props.route}</p>
    </div>
  `);

  const app = new Morph({ layout: basic({ htmx: true }) })
    .page("/test", page)
    .build();

  const response = await app.fetch(new Request("http://localhost/test"));
  const html_content = await response.text();

  assertEquals(html_content.includes("URL: http://localhost/test"), true);
  assertEquals(html_content.includes("Route: /test"), true);
});

Deno.test("Page: route params are accessible", async () => {
  const page = component((props) => html`
    <div>
      <p>User ID: ${props.params.id}</p>
    </div>
  `);

  const app = new Morph({ layout: basic({ htmx: true }) })
    .page("/users/:id", page)
    .build();

  const response = await app.fetch(new Request("http://localhost/users/42"));
  const html_content = await response.text();

  assertEquals(html_content.includes("User ID: 42"), true);
});

Deno.test("Page: query params are accessible", async () => {
  const page = component((props) => html`
    <div>
      <p>Search: ${props.query.q ?? "none"}</p>
      <p>Page: ${props.query.page ?? "1"}</p>
    </div>
  `);

  const app = new Morph({ layout: basic({ htmx: true }) })
    .page("/search", page)
    .build();

  const response = await app.fetch(
    new Request("http://localhost/search?q=hello&page=5")
  );
  const html_content = await response.text();

  assertEquals(html_content.includes("Search: hello"), true);
  assertEquals(html_content.includes("Page: 5"), true);
});

Deno.test("Page: multiple pages with different routes", async () => {
  const home = component(() => html`<h1>Home</h1>`);
  const about = component(() => html`<h1>About</h1>`);
  const contact = component(() => html`<h1>Contact</h1>`);

  const app = new Morph({ layout: basic({ htmx: true }) })
    .page("/", home)
    .page("/about", about)
    .page("/contact", contact)
    .build();

  const homeRes = await app.fetch(new Request("http://localhost/"));
  const aboutRes = await app.fetch(new Request("http://localhost/about"));
  const contactRes = await app.fetch(new Request("http://localhost/contact"));

  assertEquals((await homeRes.text()).includes("<h1>Home</h1>"), true);
  assertEquals((await aboutRes.text()).includes("<h1>About</h1>"), true);
  assertEquals((await contactRes.text()).includes("<h1>Contact</h1>"), true);
});

Deno.test("Page: basic layout with all options", async () => {
  const page = component(() => html`<div>Content</div>`);

  const app = new Morph({
    layout: basic({
      htmx: true,
      alpine: true,
      bootstrap: true,
      bootstrapIcons: true,
      title: "Default Title",
      head: `<link rel="icon" href="/favicon.ico">`,
      bodyStart: `<header>Header</header>`,
      bodyEnd: `<footer>Footer</footer>`,
    }),
  })
    .page("/", page)
    .build();

  const response = await app.fetch(new Request("http://localhost/"));
  const html_content = await response.text();

  // Check all layout options are applied
  assertEquals(html_content.includes("htmx.org"), true);
  assertEquals(html_content.includes("alpinejs"), true);
  assertEquals(html_content.includes("bootstrap"), true);
  assertEquals(html_content.includes("bootstrap-icons"), true);
  assertEquals(html_content.includes("<title>Default Title</title>"), true);
  assertEquals(html_content.includes('rel="icon"'), true);
  assertEquals(html_content.includes("<header>Header</header>"), true);
  assertEquals(html_content.includes("<footer>Footer</footer>"), true);
});

Deno.test("Page: async component renders correctly", async () => {
  const page = component(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
    return html`<div>Async content loaded</div>`;
  });

  const app = new Morph({ layout: basic({ htmx: true }) })
    .page("/", page)
    .build();

  const response = await app.fetch(new Request("http://localhost/"));
  const html_content = await response.text();

  assertEquals(html_content.includes("Async content loaded"), true);
});

Deno.test("Page: nested components render correctly", async () => {
  const button = component<{ label: string }>((props) => html`
    <button class="${styled`padding: 8px 16px;`}">${props.label}</button>
  `);

  const page = component(() => html`
    <div>
      ${button({ label: "Click me" })}
      ${button({ label: "Submit" })}
    </div>
  `);

  const app = new Morph({ layout: basic({ htmx: true }) })
    .page("/", page)
    .build();

  const response = await app.fetch(new Request("http://localhost/"));
  const html_content = await response.text();

  assertEquals(html_content.includes("Click me"), true);
  assertEquals(html_content.includes("Submit"), true);
  assertEquals(html_content.includes("padding: 8px 16px"), true);
});
