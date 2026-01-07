import { assertEquals } from "@std/assert";
import { Hono } from "@hono/hono";
import { streamSSE } from "@hono/hono/streaming";
import {
  basic,
  component,
  html,
  Morph,
  styled,
} from "@vseplet/morph";

Deno.test("SSE: basic layout includes SSE extension when enabled", async () => {
  const page = component(() => html`<div>SSE Test</div>`);

  const app = new Morph({ layout: basic({ sse: true }) })
    .page("/", page)
    .build();

  const response = await app.fetch(new Request("http://localhost/"));
  const html_content = await response.text();

  assertEquals(html_content.includes("htmx-ext-sse"), true);
  assertEquals(html_content.includes("sse.js"), true);
});

Deno.test("SSE: basic layout excludes SSE extension when disabled", async () => {
  const page = component(() => html`<div>SSE Test</div>`);

  const app = new Morph({ layout: basic({ sse: false }) })
    .page("/", page)
    .build();

  const response = await app.fetch(new Request("http://localhost/"));
  const html_content = await response.text();

  assertEquals(html_content.includes("htmx-ext-sse"), false);
  assertEquals(html_content.includes("sse.js"), false);
});

Deno.test("SSE: component with sse-connect attribute renders correctly", async () => {
  const sseComponent = component(() =>
    html`
      <div hx-ext="sse" sse-connect="/events" sse-swap="message">
        Waiting for events...
      </div>
    `
  );

  const page = component(() => html`${sseComponent({})}`);

  const app = new Morph({ layout: basic({ sse: true }) })
    .page("/", page)
    .build();

  const response = await app.fetch(new Request("http://localhost/"));
  const html_content = await response.text();

  assertEquals(html_content.includes('hx-ext="sse"'), true);
  assertEquals(html_content.includes('sse-connect="/events"'), true);
  assertEquals(html_content.includes('sse-swap="message"'), true);
  assertEquals(html_content.includes("Waiting for events..."), true);
});

Deno.test("SSE: multiple SSE components on one page", async () => {
  const timeComponent = component(() =>
    html`
      <div hx-ext="sse" sse-connect="/time" sse-swap="time-update">
        Time: Loading...
      </div>
    `
  );

  const counterComponent = component(() =>
    html`
      <div hx-ext="sse" sse-connect="/counter" sse-swap="count-update">
        Count: 0
      </div>
    `
  );

  const page = component(() =>
    html`
      ${timeComponent({})}
      ${counterComponent({})}
    `
  );

  const app = new Morph({ layout: basic({ sse: true, htmx: true }) })
    .page("/", page)
    .build();

  const response = await app.fetch(new Request("http://localhost/"));
  const html_content = await response.text();

  assertEquals(html_content.includes('sse-connect="/time"'), true);
  assertEquals(html_content.includes('sse-connect="/counter"'), true);
  assertEquals(html_content.includes("Time: Loading..."), true);
  assertEquals(html_content.includes("Count: 0"), true);
});

Deno.test("SSE: SSE endpoint streams events correctly", async () => {
  const app = new Hono();

  app.get("/sse-test", async (c) => {
    return streamSSE(c, async (stream) => {
      // Send 3 events and then close
      for (let i = 0; i < 3; i++) {
        await stream.writeSSE({
          data: `Event ${i}`,
          event: "test-event",
          id: String(i),
        });
      }
    });
  });

  const response = await app.fetch(new Request("http://localhost/sse-test"));

  assertEquals(response.headers.get("Content-Type"), "text/event-stream");
  assertEquals(response.headers.get("Cache-Control"), "no-cache");
  assertEquals(response.headers.get("Connection"), "keep-alive");
  assertEquals(response.status, 200);

  // Read the stream
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("No reader available");
  }

  const decoder = new TextDecoder();
  let receivedData = "";

  // Read first chunk
  const { value } = await reader.read();
  if (value) {
    receivedData = decoder.decode(value);
  }

  // Check that SSE format is correct
  assertEquals(receivedData.includes("event: test-event"), true);
  assertEquals(receivedData.includes("data: Event 0"), true);
  assertEquals(receivedData.includes("id: 0"), true);

  reader.releaseLock();
});

Deno.test("SSE: component with styled CSS and SSE attributes", async () => {
  const styledSSEComponent = component(() =>
    html`
      <div
        class="${styled`
          padding: 20px;
          background: #f0f0f0;
          border-radius: 8px;
        `}"
        hx-ext="sse"
        sse-connect="/styled-events"
        sse-swap="styled-update"
      >
        Styled SSE Component
      </div>
    `
  );

  const page = component(() => html`${styledSSEComponent({})}`);

  const app = new Morph({ layout: basic({ sse: true }) })
    .page("/", page)
    .build();

  const response = await app.fetch(new Request("http://localhost/"));
  const html_content = await response.text();

  // Check SSE attributes
  assertEquals(html_content.includes('hx-ext="sse"'), true);
  assertEquals(html_content.includes('sse-connect="/styled-events"'), true);
  assertEquals(html_content.includes('sse-swap="styled-update"'), true);

  // Check styled CSS is included
  assertEquals(html_content.includes("padding: 20px"), true);
  assertEquals(html_content.includes("background: #f0f0f0"), true);

  // Check content
  assertEquals(html_content.includes("Styled SSE Component"), true);
});

Deno.test("SSE: Hono app with both Morph pages and SSE endpoints", async () => {
  const sseComponent = component(() =>
    html`
      <div hx-ext="sse" sse-connect="/api/updates" sse-swap="update">
        Updates...
      </div>
    `
  );

  const page = component(() => html`${sseComponent({})}`);

  const morphApp = new Morph({ layout: basic({ sse: true, htmx: true }) })
    .page("/", page)
    .build();

  const app = new Hono();

  // Add SSE endpoint
  app.get("/api/updates", async (c) => {
    return streamSSE(c, async (stream) => {
      await stream.writeSSE({
        data: "Test update",
        event: "update",
        id: "1",
      });
    });
  });

  // Mount Morph app
  app.all("/*", async (c) => await morphApp.fetch(c.req.raw));

  // Test page
  const pageResponse = await app.fetch(new Request("http://localhost/"));
  const pageHtml = await pageResponse.text();

  assertEquals(pageHtml.includes('sse-connect="/api/updates"'), true);
  assertEquals(pageResponse.status, 200);

  // Test SSE endpoint
  const sseResponse = await app.fetch(
    new Request("http://localhost/api/updates"),
  );

  assertEquals(sseResponse.headers.get("Content-Type"), "text/event-stream");
  assertEquals(sseResponse.status, 200);
});

Deno.test("SSE: SSE with multiple event types", async () => {
  const multiEventComponent = component(() =>
    html`
      <div hx-ext="sse" sse-connect="/multi-events">
        <div sse-swap="event-a">Event A: waiting...</div>
        <div sse-swap="event-b">Event B: waiting...</div>
        <div sse-swap="event-c">Event C: waiting...</div>
      </div>
    `
  );

  const page = component(() => html`${multiEventComponent({})}`);

  const app = new Morph({ layout: basic({ sse: true }) })
    .page("/", page)
    .build();

  const response = await app.fetch(new Request("http://localhost/"));
  const html_content = await response.text();

  assertEquals(html_content.includes('sse-connect="/multi-events"'), true);
  assertEquals(html_content.includes('sse-swap="event-a"'), true);
  assertEquals(html_content.includes('sse-swap="event-b"'), true);
  assertEquals(html_content.includes('sse-swap="event-c"'), true);
  assertEquals(html_content.includes("Event A: waiting..."), true);
  assertEquals(html_content.includes("Event B: waiting..."), true);
  assertEquals(html_content.includes("Event C: waiting..."), true);
});

Deno.test("SSE: SSE with HTMX and json-enc extensions together", async () => {
  const page = component(() =>
    html`
      <div hx-ext="sse, json-enc" sse-connect="/events" sse-swap="data">
        Combined extensions test
      </div>
    `
  );

  const app = new Morph({
    layout: basic({
      htmx: true,
      sse: true,
      jsonEnc: true,
    }),
  })
    .page("/", page)
    .build();

  const response = await app.fetch(new Request("http://localhost/"));
  const html_content = await response.text();

  // All extensions should be loaded
  assertEquals(html_content.includes("htmx.org"), true);
  assertEquals(html_content.includes("htmx-ext-sse"), true);
  assertEquals(html_content.includes("htmx-ext-json-enc"), true);

  // Component should have both extensions
  assertEquals(html_content.includes('hx-ext="sse, json-enc"'), true);
});
