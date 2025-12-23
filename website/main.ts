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
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  font-family: system-ui, -apple-system, sans-serif;
`;

const header = styled`
  text-align: center;
  margin-bottom: 3rem;
`;

const title = styled`
  font-size: 3rem;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 1rem;
`;

const subtitle = styled`
  font-size: 1.25rem;
  color: #666;
  margin-bottom: 2rem;
`;

const links = styled`
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
`;

const linkButton = styled`
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background: #667eea;
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }
`;

const section = styled`
  margin-bottom: 3rem;
  padding: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const sectionTitle = styled`
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #333;
`;

const demo = styled`
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px dashed #ddd;
`;

const button = styled`
  padding: 0.75rem 1.5rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #5568d3;
  }
`;

const card = styled`
  padding: 1rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 0.5rem;
`;

const input = styled`
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  margin-bottom: 1rem;

  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const counterDisplay = styled`
  font-size: 2rem;
  font-weight: 700;
  color: #667eea;
  margin: 1rem 0;
`;

const toggleContent = styled`
  margin-top: 1rem;
  padding: 1rem;
  background: #e3f2fd;
  border-radius: 6px;
  border-left: 4px solid #667eea;
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
      <button class="${button}">Increment</button>
    </div>
  `;
});

const timer = component((props) => {
  const time = new Date().toLocaleTimeString();
  return html`
    <div ${props.hx()} hx-trigger="every 1s" hx-swap="outerHTML">
      <div class="${counterDisplay}">${time}</div>
      <p style="color: #666;">Updates every second</p>
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
        ${isOpen ? "Hide Content" : "Show Content"}
      </button>
      ${
    isOpen
      ? html`<div class="${toggleContent}">
            <strong>Hidden Content Revealed!</strong><br />
            This content is only visible when toggled on.
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
    { name: "Counter", desc: "Simple click counter with state" },
    { name: "Timer", desc: "Real-time clock that updates every second" },
    { name: "Toggle", desc: "Show/hide content with smooth transition" },
    { name: "Search", desc: "Live search with instant results" },
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
            <strong>${item.name}</strong><br />
            <span style="color: #666;">${item.desc}</span>
          </div>
        `)
      : html`<p style="color: #666;">No results found</p>`
  }
    </div>
  `;
});

// Main Page
const homePage = component(() => html`
  ${meta({ title: "Morph - Zero-build SSR with HTMX & Hono" })}

  <div class="${container}">
    <header class="${header}">
      <h1 class="${title}">Morph</h1>
      <p class="${subtitle}">
        Zero-build fullstack library for creating web interfaces with HTMX and Hono
      </p>
      <div class="${links}">
        <a href="https://jsr.io/@vseplet/morph" class="${linkButton}">
          📦 JSR Package
        </a>
        <a href="https://github.com/vseplet/morph" class="${linkButton}">
          💻 GitHub
        </a>
      </div>
    </header>

    <section class="${section}">
      <h2 class="${sectionTitle}">What is Morph?</h2>
      <p style="line-height: 1.6; color: #555;">
        Morph is a <strong>server-side rendering library</strong> that combines the simplicity
        of tagged template literals with the power of HTMX for partial page updates.
        No build step required - just write TypeScript and run.
      </p>
    </section>

    <section class="${section}">
      <h2 class="${sectionTitle}">🔢 Counter</h2>
      <p style="color: #666; margin-bottom: 1rem;">
        Click to increment. State persists in URL query params.
      </p>
      <div class="${demo}">
        ${counter({})}
      </div>
    </section>

    <section class="${section}">
      <h2 class="${sectionTitle}">⏰ Live Timer</h2>
      <p style="color: #666; margin-bottom: 1rem;">
        Updates automatically every second using HTMX polling.
      </p>
      <div class="${demo}">
        ${timer({})}
      </div>
    </section>

    <section class="${section}">
      <h2 class="${sectionTitle}">🔄 Toggle Content</h2>
      <p style="color: #666; margin-bottom: 1rem;">
        Show/hide content with server-side state management.
      </p>
      <div class="${demo}">
        ${toggle({})}
      </div>
    </section>

    <section class="${section}">
      <h2 class="${sectionTitle}">🔍 Live Search</h2>
      <p style="color: #666; margin-bottom: 1rem;">
        Search updates as you type with 300ms debounce.
      </p>
      <div class="${demo}">
        <input
          type="text"
          name="q"
          placeholder="Type to search..."
          class="${input}"
          hx-get="/draw/${searchResults.name}"
          hx-target="#results"
          hx-trigger="keyup changed delay:300ms">
        ${searchResults({})}
      </div>
    </section>

    <footer style="text-align: center; margin-top: 3rem; padding-top: 2rem; border-top: 1px solid #ddd; color: #666;">
      <p>Built with Morph • Deployed on Deno Deploy</p>
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
        title: "Morph - Zero-build SSR",
        head: `
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
              padding: 2rem 0;
            }
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
