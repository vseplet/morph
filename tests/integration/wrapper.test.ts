import { assertEquals } from "@std/assert";
import { component, html, Morph, basic, styled, meta, MorphTemplate } from "@vseplet/morph";

Deno.test("Wrapper: wraps page content with wrapper component", async () => {
  const wrapper = component<{ child?: MorphTemplate }>((props) => html`
    <div id="wrapper">
      <header>Header</header>
      <main>${props.child}</main>
      <footer>Footer</footer>
    </div>
  `);

  const page = component(() => html`<p>Page Content</p>`);

  const app = new Morph({ layout: basic({ wrapper }) })
    .page("/", page)
    .build();

  const response = await app.fetch(new Request("http://localhost/"));
  const html_content = await response.text();

  assertEquals(html_content.includes('<div id="wrapper">'), true);
  assertEquals(html_content.includes("<header>Header</header>"), true);
  assertEquals(html_content.includes("<main>"), true);
  assertEquals(html_content.includes("Page Content"), true);
  assertEquals(html_content.includes("<footer>Footer</footer>"), true);
});

Deno.test("Wrapper: wrapper receives page content as child prop", async () => {
  const wrapper = component<{ child?: MorphTemplate }>((props) => html`
    <div class="container">
      ${props.child}
    </div>
  `);

  const page = component(() => html`
    <h1>Hello World</h1>
    <p>Some paragraph</p>
  `);

  const app = new Morph({ layout: basic({ wrapper }) })
    .page("/", page)
    .build();

  const response = await app.fetch(new Request("http://localhost/"));
  const html_content = await response.text();

  assertEquals(html_content.includes('<div class="container">'), true);
  assertEquals(html_content.includes("<h1>Hello World</h1>"), true);
  assertEquals(html_content.includes("<p>Some paragraph</p>"), true);
});

Deno.test("Wrapper: wrapper applies to all pages", async () => {
  const wrapper = component<{ child?: MorphTemplate }>((props) => html`
    <div id="app-shell">
      <nav>Navigation</nav>
      ${props.child}
    </div>
  `);

  const homePage = component(() => html`<h1>Home</h1>`);
  const aboutPage = component(() => html`<h1>About</h1>`);
  const contactPage = component(() => html`<h1>Contact</h1>`);

  const app = new Morph({ layout: basic({ wrapper }) })
    .page("/", homePage)
    .page("/about", aboutPage)
    .page("/contact", contactPage)
    .build();

  const homeRes = await app.fetch(new Request("http://localhost/"));
  const aboutRes = await app.fetch(new Request("http://localhost/about"));
  const contactRes = await app.fetch(new Request("http://localhost/contact"));

  const homeHtml = await homeRes.text();
  const aboutHtml = await aboutRes.text();
  const contactHtml = await contactRes.text();

  // All pages should have the wrapper
  assertEquals(homeHtml.includes('<div id="app-shell">'), true);
  assertEquals(aboutHtml.includes('<div id="app-shell">'), true);
  assertEquals(contactHtml.includes('<div id="app-shell">'), true);

  // Each page should have its own content
  assertEquals(homeHtml.includes("<h1>Home</h1>"), true);
  assertEquals(aboutHtml.includes("<h1>About</h1>"), true);
  assertEquals(contactHtml.includes("<h1>Contact</h1>"), true);
});

Deno.test("Wrapper: wrapper can use styled CSS", async () => {
  const wrapper = component<{ child?: MorphTemplate }>((props) => html`
    <div class="${styled`
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    `}">
      ${props.child}
    </div>
  `);

  const page = component(() => html`<p>Content</p>`);

  const app = new Morph({ layout: basic({ wrapper }) })
    .page("/", page)
    .build();

  const response = await app.fetch(new Request("http://localhost/"));
  const html_content = await response.text();

  assertEquals(html_content.includes("max-width: 1200px"), true);
  assertEquals(html_content.includes("margin: 0 auto"), true);
  assertEquals(html_content.includes("padding: 20px"), true);
});

Deno.test("Wrapper: wrapper can access request props", async () => {
  const wrapper = component<{ child?: MorphTemplate }>((props) => html`
    <div>
      <span id="current-route">${props.route}</span>
      ${props.child}
    </div>
  `);

  const page = component(() => html`<p>Page</p>`);

  const app = new Morph({ layout: basic({ wrapper }) })
    .page("/test-route", page)
    .build();

  const response = await app.fetch(new Request("http://localhost/test-route"));
  const html_content = await response.text();

  assertEquals(html_content.includes('<span id="current-route">/test-route</span>'), true);
});

Deno.test("Wrapper: wrapper with navigation highlighting current route", async () => {
  const wrapper = component<{ child?: MorphTemplate }>((props) => {
    const isActive = (path: string) => props.route === path ? "active" : "";
    return html`
      <nav>
        <a href="/" class="${isActive("/")}">Home</a>
        <a href="/about" class="${isActive("/about")}">About</a>
      </nav>
      <main>${props.child}</main>
    `;
  });

  const homePage = component(() => html`<h1>Home</h1>`);
  const aboutPage = component(() => html`<h1>About</h1>`);

  const app = new Morph({ layout: basic({ wrapper }) })
    .page("/", homePage)
    .page("/about", aboutPage)
    .build();

  const homeRes = await app.fetch(new Request("http://localhost/"));
  const aboutRes = await app.fetch(new Request("http://localhost/about"));

  const homeHtml = await homeRes.text();
  const aboutHtml = await aboutRes.text();

  // Home page should have active class on home link
  assertEquals(homeHtml.includes('href="/" class="active"'), true);
  assertEquals(homeHtml.includes('href="/about" class=""'), true);

  // About page should have active class on about link
  assertEquals(aboutHtml.includes('href="/" class=""'), true);
  assertEquals(aboutHtml.includes('href="/about" class="active"'), true);
});

Deno.test("Wrapper: page meta works with wrapper", async () => {
  const wrapper = component<{ child?: MorphTemplate }>((props) => html`
    <div id="wrapper">${props.child}</div>
  `);

  const page = component(() => html`
    ${meta({
      title: "Custom Title",
      statusCode: 201,
      headers: { "X-Custom": "value" },
    })}
    <p>Content</p>
  `);

  const app = new Morph({ layout: basic({ wrapper }) })
    .page("/", page)
    .build();

  const response = await app.fetch(new Request("http://localhost/"));

  assertEquals(response.status, 201);
  assertEquals(response.headers.get("X-Custom"), "value");

  const html_content = await response.text();
  assertEquals(html_content.includes("<title>Custom Title</title>"), true);
});

Deno.test("Wrapper: async wrapper component", async () => {
  const wrapper = component<{ child?: MorphTemplate }>(async (props) => {
    await new Promise((resolve) => setTimeout(resolve, 10));
    return html`
      <div id="async-wrapper">
        <p>Loaded at ${Date.now()}</p>
        ${props.child}
      </div>
    `;
  });

  const page = component(() => html`<p>Page Content</p>`);

  const app = new Morph({ layout: basic({ wrapper }) })
    .page("/", page)
    .build();

  const response = await app.fetch(new Request("http://localhost/"));
  const html_content = await response.text();

  assertEquals(html_content.includes('<div id="async-wrapper">'), true);
  assertEquals(html_content.includes("Loaded at"), true);
  assertEquals(html_content.includes("Page Content"), true);
});

Deno.test("Wrapper: wrapper with nested styled components", async () => {
  const sidebar = component(() => html`
    <aside class="${styled`
      width: 250px;
      background: #f0f0f0;
    `}">
      Sidebar
    </aside>
  `);

  const wrapper = component<{ child?: MorphTemplate }>((props) => html`
    <div class="${styled`display: flex;`}">
      ${sidebar({})}
      <main class="${styled`flex: 1;`}">
        ${props.child}
      </main>
    </div>
  `);

  const page = component(() => html`
    <article class="${styled`padding: 16px;`}">
      Article content
    </article>
  `);

  const app = new Morph({ layout: basic({ wrapper }) })
    .page("/", page)
    .build();

  const response = await app.fetch(new Request("http://localhost/"));
  const html_content = await response.text();

  // All CSS should be collected
  assertEquals(html_content.includes("display: flex"), true);
  assertEquals(html_content.includes("width: 250px"), true);
  assertEquals(html_content.includes("flex: 1"), true);
  assertEquals(html_content.includes("padding: 16px"), true);
});

Deno.test("Wrapper: wrapper with conditional rendering", async () => {
  const wrapper = component<{ child?: MorphTemplate }>((props) => {
    const showBanner = props.query?.banner === "true";
    return html`
      <div>
        ${showBanner ? html`<div id="banner">Special Offer!</div>` : ""}
        ${props.child}
      </div>
    `;
  });

  const page = component(() => html`<p>Page</p>`);

  const app = new Morph({ layout: basic({ wrapper }) })
    .page("/", page)
    .build();

  // Without banner
  const noBannerRes = await app.fetch(new Request("http://localhost/"));
  const noBannerHtml = await noBannerRes.text();
  assertEquals(noBannerHtml.includes('<div id="banner">'), false);

  // With banner
  const bannerRes = await app.fetch(new Request("http://localhost/?banner=true"));
  const bannerHtml = await bannerRes.text();
  assertEquals(bannerHtml.includes('<div id="banner">Special Offer!</div>'), true);
});

Deno.test("Wrapper: no wrapper when not specified", async () => {
  const page = component(() => html`<p id="no-wrapper-content">Direct content</p>`);

  const app = new Morph({ layout: basic({}) })
    .page("/", page)
    .build();

  const response = await app.fetch(new Request("http://localhost/"));
  const html_content = await response.text();

  assertEquals(html_content.includes('<p id="no-wrapper-content">Direct content</p>'), true);
});

Deno.test("Wrapper: wrapper with layout bodyStart/bodyEnd", async () => {
  const wrapper = component<{ child?: MorphTemplate }>((props) => html`
    <div id="wrapper-content">${props.child}</div>
  `);

  const page = component(() => html`<p>Page</p>`);

  const app = new Morph({
    layout: basic({
      wrapper,
      bodyStart: `<div id="body-start">Start</div>`,
      bodyEnd: `<div id="body-end">End</div>`,
    }),
  })
    .page("/", page)
    .build();

  const response = await app.fetch(new Request("http://localhost/"));
  const html_content = await response.text();

  // Check order: bodyStart -> wrapper -> bodyEnd
  const bodyStartIndex = html_content.indexOf("body-start");
  const wrapperIndex = html_content.indexOf("wrapper-content");
  const bodyEndIndex = html_content.indexOf("body-end");

  assertEquals(bodyStartIndex < wrapperIndex, true);
  assertEquals(wrapperIndex < bodyEndIndex, true);
});
