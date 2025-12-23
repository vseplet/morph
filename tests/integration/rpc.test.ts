import { assertEquals } from "@std/assert";
import { html, Morph, basic, rpc, styled, meta } from "@vseplet/morph";

Deno.test("RPC: POST /rpc/{name}/{method} calls handler and returns HTML", async () => {
  const api = rpc({
    greet: async (_req, args: { name: string }) => {
      return html`<div id="greeting">Hello, ${args.name}!</div>`;
    },
  });

  const app = new Morph({ layout: basic({ htmx: true }) })
    .rpc(api)
    .build();

  const response = await app.fetch(
    new Request(`http://localhost/rpc/${api.name}/greet`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "World" }),
    })
  );

  assertEquals(response.status, 200);
  assertEquals(response.headers.get("Content-Type"), "text/html");

  const html_content = await response.text();
  assertEquals(html_content.includes('id="greeting"'), true);
  assertEquals(html_content.includes("Hello, World!"), true);
});

Deno.test("RPC: handler receives typed arguments", async () => {
  const mathApi = rpc({
    add: async (_req, args: { a: number; b: number }) => {
      const result = args.a + args.b;
      return html`<span id="result">${result}</span>`;
    },
    multiply: async (_req, args: { x: number; y: number }) => {
      return html`<span id="product">${args.x * args.y}</span>`;
    },
  });

  const app = new Morph({ layout: basic({ htmx: true }) })
    .rpc(mathApi)
    .build();

  // Test add
  const addResponse = await app.fetch(
    new Request(`http://localhost/rpc/${mathApi.name}/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ a: 5, b: 3 }),
    })
  );
  const addHtml = await addResponse.text();
  assertEquals(addHtml.includes(">8<"), true);

  // Test multiply
  const multiplyResponse = await app.fetch(
    new Request(`http://localhost/rpc/${mathApi.name}/multiply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ x: 4, y: 7 }),
    })
  );
  const multiplyHtml = await multiplyResponse.text();
  assertEquals(multiplyHtml.includes(">28<"), true);
});

Deno.test("RPC: handler can access request context", async () => {
  const contextApi = rpc({
    info: async (req, _args: {}) => {
      return html`
        <div id="info">
          <p>Route: ${req.route}</p>
          <p>Method: ${req.raw.method}</p>
        </div>
      `;
    },
  });

  const app = new Morph({ layout: basic({ htmx: true }) })
    .rpc(contextApi)
    .build();

  const response = await app.fetch(
    new Request(`http://localhost/rpc/${contextApi.name}/info`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
  );

  const html_content = await response.text();
  assertEquals(html_content.includes(`Route: /rpc/${contextApi.name}/info`), true);
  assertEquals(html_content.includes("Method: POST"), true);
});

Deno.test("RPC: response includes CSS when using styled", async () => {
  const styledApi = rpc({
    getCard: async (_req, args: { title: string }) => {
      return html`
        <div class="${styled`
          border: 1px solid #ccc;
          padding: 16px;
          border-radius: 8px;
        `}">
          <h3>${args.title}</h3>
        </div>
      `;
    },
  });

  const app = new Morph({ layout: basic({ htmx: true }) })
    .rpc(styledApi)
    .build();

  const response = await app.fetch(
    new Request(`http://localhost/rpc/${styledApi.name}/getCard`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Test Card" }),
    })
  );

  const html_content = await response.text();
  assertEquals(html_content.includes("Test Card"), true);
  assertEquals(html_content.includes("<style>"), true);
  assertEquals(html_content.includes("border: 1px solid #ccc"), true);
});

Deno.test("RPC: response can set meta headers and status", async () => {
  const statusApi = rpc({
    created: async (_req, args: { id: number }) => {
      return html`
        ${meta({
          statusCode: 201,
          statusText: "Created",
          headers: { "X-Created-Id": String(args.id) },
        })}
        <div>Created item ${args.id}</div>
      `;
    },
  });

  const app = new Morph({ layout: basic({ htmx: true }) })
    .rpc(statusApi)
    .build();

  const response = await app.fetch(
    new Request(`http://localhost/rpc/${statusApi.name}/created`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: 42 }),
    })
  );

  assertEquals(response.status, 201);
  assertEquals(response.statusText, "Created");
  assertEquals(response.headers.get("X-Created-Id"), "42");
});

Deno.test("RPC: multiple RPC handlers can coexist", async () => {
  const usersApi = rpc({
    get: async (_req, args: { id: number }) => html`<div>User ${args.id}</div>`,
  });

  const postsApi = rpc({
    get: async (_req, args: { id: number }) => html`<div>Post ${args.id}</div>`,
  });

  const app = new Morph({ layout: basic({ htmx: true }) })
    .rpc(usersApi)
    .rpc(postsApi)
    .build();

  const userResponse = await app.fetch(
    new Request(`http://localhost/rpc/${usersApi.name}/get`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: 1 }),
    })
  );

  const postResponse = await app.fetch(
    new Request(`http://localhost/rpc/${postsApi.name}/get`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: 100 }),
    })
  );

  const userHtml = await userResponse.text();
  const postHtml = await postResponse.text();

  assertEquals(userHtml.includes("User 1"), true);
  assertEquals(postHtml.includes("Post 100"), true);
});

Deno.test("RPC: rpc helper generates correct HTMX attributes", () => {
  const api = rpc({
    action: async (_req, args: { data: string }) => html`<div>${args.data}</div>`,
  });

  // Without args
  const attrsNoArgs = api.rpc.action();
  assertEquals(attrsNoArgs.includes("hx-ext='json-enc'"), true);
  assertEquals(attrsNoArgs.includes(`hx-post='/rpc/${api.name}/action'`), true);
  assertEquals(attrsNoArgs.includes("hx-vals"), false);

  // With args
  const attrsWithArgs = api.rpc.action({ data: "test" });
  assertEquals(attrsWithArgs.includes("hx-ext='json-enc'"), true);
  assertEquals(attrsWithArgs.includes(`hx-post='/rpc/${api.name}/action'`), true);
  assertEquals(attrsWithArgs.includes(`hx-vals='{"data":"test"}'`), true);
});

Deno.test("RPC: async handler with delay works correctly", async () => {
  const slowApi = rpc({
    slowOperation: async (_req, args: { delay: number }) => {
      await new Promise((resolve) => setTimeout(resolve, args.delay));
      return html`<div id="done">Completed after ${args.delay}ms</div>`;
    },
  });

  const app = new Morph({ layout: basic({ htmx: true }) })
    .rpc(slowApi)
    .build();

  const start = Date.now();
  const response = await app.fetch(
    new Request(`http://localhost/rpc/${slowApi.name}/slowOperation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ delay: 50 }),
    })
  );
  const elapsed = Date.now() - start;

  assertEquals(response.status, 200);
  assertEquals(elapsed >= 50, true);

  const html_content = await response.text();
  assertEquals(html_content.includes("Completed after 50ms"), true);
});
