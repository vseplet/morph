import { Hono } from "@hono/hono";
import {
  basic,
  component,
  html,
  meta,
  Morph,
  styled,
} from "@vseplet/morph";

// Styles
const container = styled`
  max-width: 720px;
  margin: 0 auto;
  padding: 3rem 1.5rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
  color: #1a1a1a;
`;

const header = styled`
  margin-bottom: 3rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid #e5e5e5;
`;

const title = styled`
  font-size: 2.5rem;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 0.5rem;
  letter-spacing: -0.02em;
`;

const subtitle = styled`
  font-size: 1.125rem;
  color: #666;
  margin-bottom: 1.5rem;
`;

const links = styled`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const linkButton = styled`
  display: inline-block;
  padding: 0.5rem 1rem;
  background: #1a1a1a;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  transition: background 0.15s;

  &:hover {
    background: #333;
  }
`;

const section = styled`
  margin-bottom: 2.5rem;
`;

const sectionTitle = styled`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #1a1a1a;
`;

const sectionDesc = styled`
  color: #666;
  margin-bottom: 1rem;
  font-size: 0.9375rem;
`;

const demo = styled`
  padding: 1.25rem;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #e5e5e5;
`;

const button = styled`
  padding: 0.5rem 1rem;
  background: #1a1a1a;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: #333;
  }
`;

const card = styled`
  padding: 0.75rem 1rem;
  background: white;
  border-radius: 6px;
  border: 1px solid #e5e5e5;
  margin-bottom: 0.5rem;
`;

const input = styled`
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9375rem;
  margin-bottom: 1rem;
  background: white;

  &:focus {
    outline: none;
    border-color: #1a1a1a;
  }
`;

const counterDisplay = styled`
  font-size: 2rem;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 0.75rem;
  font-variant-numeric: tabular-nums;
`;

const toggleContent = styled`
  margin-top: 1rem;
  padding: 1rem;
  background: #f0f0f0;
  border-radius: 6px;
  font-size: 0.9375rem;
`;

const codeBlock = styled`
  font-family: 'SF Mono', Monaco, 'Courier New', monospace;
  font-size: 0.8125rem;
  background: #f5f5f5;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
`;

// Interactive Components (Partials)
const counter = component((props) => {
  const count = parseInt(props.query?.count ?? "0");
  return html`
    <div hx-get="/draw/${counter.name}?count=${count + 1}"
         hx-trigger="click"
         hx-swap="outerHTML"
         style="cursor: pointer;">
      <div class="${counterDisplay}">${count}</div>
      <button class="${button}">Click to increment</button>
    </div>
  `;
});

const timer = component((props) => {
  const time = new Date().toLocaleTimeString();
  return html`
    <div ${props.hx()} hx-trigger="every 1s" hx-swap="outerHTML">
      <div class="${counterDisplay}">${time}</div>
      <p style="color: #666; font-size: 0.875rem;">Auto-updates every second</p>
    </div>
  `;
});

const toggle = component((props) => {
  const isOpen = props.query?.open === "true";
  const nextState = isOpen ? "false" : "true";

  return html`
    <div>
      <button hx-get="/draw/${toggle.name}?open=${nextState}"
              hx-swap="outerHTML"
              hx-trigger="click"
              hx-target="closest div"
              class="${button}">
        ${isOpen ? "Hide content" : "Show content"}
      </button>
      ${
    isOpen
      ? html`<div class="${toggleContent}">
            This content is rendered on the server and sent via HTMX.
            Click the button again to hide it.
          </div>`
      : ""
  }
    </div>
  `;
});

const searchResults = component((props) => {
  const query = props.query?.q?.toLowerCase() ?? "";
  const items = [
    { name: "Counter", desc: "Click counter with URL state" },
    { name: "Timer", desc: "Real-time clock with polling" },
    { name: "Toggle", desc: "Show/hide with server state" },
    { name: "Search", desc: "Live search with debounce" },
  ];

  const results = query
    ? items.filter((item) =>
      item.name.toLowerCase().includes(query) ||
      item.desc.toLowerCase().includes(query)
    )
    : items;

  return html`
    <div id="results">
      ${
    results.length > 0
      ? results.map((item) => html`
          <div class="${card}">
            <strong>${item.name}</strong>
            <span style="color: #666;"> — ${item.desc}</span>
          </div>
        `)
      : html`<p style="color: #666;">No results found</p>`
  }
    </div>
  `;
});

// Main Page
const homePage = component(() => html`
  ${meta({ title: "Morph — SSR with HTMX & Hono" })}

  <div class="${container}">
    <header class="${header}">
      <h1 class="${title}">Morph</h1>
      <p class="${subtitle}">
        Zero-build SSR library for TypeScript. Combines tagged template literals
        with HTMX for partial page updates. No bundler required.
      </p>
      <div class="${links}">
        <a href="https://jsr.io/@vseplet/morph" class="${linkButton}">
          JSR Package
        </a>
        <a href="https://github.com/vseplet/morph" class="${linkButton}">
          GitHub
        </a>
      </div>
    </header>

    <section class="${section}">
      <h2 class="${sectionTitle}">What is Morph?</h2>
      <p>
        Morph lets you build web apps with server-rendered components that update
        dynamically via HTMX. Write components using the <code class="${codeBlock}">html</code>
        template tag, style them with <code class="${codeBlock}">styled</code>,
        and register them as partials for HTMX to fetch.
      </p>
    </section>

    <section class="${section}">
      <h2 class="${sectionTitle}">Counter</h2>
      <p class="${sectionDesc}">
        Click to increment. State is passed via query params.
      </p>
      <div class="${demo}">
        ${counter({})}
      </div>
    </section>

    <section class="${section}">
      <h2 class="${sectionTitle}">Live Timer</h2>
      <p class="${sectionDesc}">
        Updates every second using <code class="${codeBlock}">hx-trigger="every 1s"</code>.
      </p>
      <div class="${demo}">
        ${timer({})}
      </div>
    </section>

    <section class="${section}">
      <h2 class="${sectionTitle}">Toggle</h2>
      <p class="${sectionDesc}">
        Show/hide content. State managed on the server.
      </p>
      <div class="${demo}">
        ${toggle({})}
      </div>
    </section>

    <section class="${section}">
      <h2 class="${sectionTitle}">Live Search</h2>
      <p class="${sectionDesc}">
        Results update as you type with 300ms debounce.
      </p>
      <div class="${demo}">
        <input
          type="text"
          name="q"
          placeholder="Search..."
          class="${input}"
          hx-get="/draw/${searchResults.name}"
          hx-target="#results"
          hx-trigger="keyup changed delay:300ms">
        ${searchResults({})}
      </div>
    </section>

    <footer style="margin-top: 3rem; padding-top: 1.5rem; border-top: 1px solid #e5e5e5; color: #999; font-size: 0.875rem;">
      Built with Morph
    </footer>
  </div>
`);

// Create Morph app
const app = new Hono().all(
  "/*",
  (c) =>
    new Morph({
      layout: basic({
        htmx: true,
        title: "Morph",
        head: `
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { background: #fff; }
          </style>
        `,
      }),
    })
      .partial(counter)
      .partial(timer)
      .partial(toggle)
      .partial(searchResults)
      .page("/", homePage)
      .fetch(c.req.raw),
);

Deno.serve(app.fetch);
