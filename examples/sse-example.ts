/**
 * Server-Sent Events (SSE) Example with Morph and Hono
 *
 * This example demonstrates:
 * 1. Creating an SSE endpoint using Hono's streamSSE helper
 * 2. Connecting to SSE from the client using HTMX SSE extension
 * 3. Real-time updates without WebSockets
 *
 * To run:
 * deno run -A examples/sse-example.ts
 *
 * Then open http://localhost:8000 in your browser
 */

import { Hono } from "@hono/hono";
import { streamSSE } from "@hono/hono/streaming";
import { basic, component, html, meta, Morph, styled } from "../source/mod.ts";

// Live updates component that connects to SSE
const liveUpdates = component(() =>
  html`
    <div class="${styled`
      padding: 20px;
      border: 2px solid #4CAF50;
      border-radius: 8px;
      background: #f9f9f9;
      margin: 20px 0;
    `}">
      <h2>Live Server Time</h2>
      <div
        hx-ext="sse"
        sse-connect="/events/time"
        sse-swap="time-update"
        class="${styled`
          font-size: 2em;
          font-family: monospace;
          color: #2196F3;
          padding: 15px;
          background: white;
          border-radius: 4px;
          margin-top: 10px;
        `}"
      >
        Connecting to server...
      </div>
    </div>
  `
);

// Random number component with SSE
const randomNumbers = component(() =>
  html`
    <div class="${styled`
      padding: 20px;
      border: 2px solid #FF9800;
      border-radius: 8px;
      background: #f9f9f9;
      margin: 20px 0;
    `}">
      <h2>Random Numbers Stream</h2>
      <div
        hx-ext="sse"
        sse-connect="/events/random"
        sse-swap="random-update"
        class="${styled`
          font-size: 1.5em;
          font-family: monospace;
          color: #9C27B0;
          padding: 15px;
          background: white;
          border-radius: 4px;
          margin-top: 10px;
        `}"
      >
        Waiting for random numbers...
      </div>
    </div>
  `
);

// Counter component with SSE
const counter = component(() =>
  html`
    <div class="${styled`
      padding: 20px;
      border: 2px solid #E91E63;
      border-radius: 8px;
      background: #f9f9f9;
      margin: 20px 0;
    `}">
      <h2>Auto Counter</h2>
      <div
        hx-ext="sse"
        sse-connect="/events/counter"
        sse-swap="counter-update"
        class="${styled`
          font-size: 1.8em;
          font-family: monospace;
          color: #F44336;
          padding: 15px;
          background: white;
          border-radius: 4px;
          margin-top: 10px;
        `}"
      >
        Counter: 0
      </div>
    </div>
  `
);

// Main page
const homePage = component(() =>
  html`
    ${meta({
      title: "SSE Example with Morph",
    })}

    <div class="${styled`
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `}">
      <h1 class="${styled`
        color: #333;
        border-bottom: 3px solid #4CAF50;
        padding-bottom: 10px;
      `}">
        Server-Sent Events Demo
      </h1>

      <p class="${styled`
        color: #666;
        font-size: 1.1em;
        line-height: 1.6;
      `}">
        This page demonstrates real-time updates using Server-Sent Events (SSE). All
        components below update automatically without polling or WebSockets!
      </p>

      ${liveUpdates({})} ${randomNumbers({})} ${counter({})}

      <div class="${styled`
        margin-top: 40px;
        padding: 15px;
        background: #FFF3E0;
        border-radius: 4px;
        border-left: 4px solid #FF9800;
      `}">
        <strong>How it works:</strong>
        <ul>
          <li>Each component uses the <code>hx-ext="sse"</code> attribute</li>
          <li><code>sse-connect</code> specifies the SSE endpoint URL</li>
          <li><code>sse-swap</code> specifies which event to listen for</li>
          <li>
            The server streams events using Hono's <code>streamSSE</code> helper
          </li>
        </ul>
      </div>
    </div>
  `
);

// Create Morph app with SSE enabled
const morphApp = new Morph({
  layout: basic({
    htmx: true,
    sse: true, // Enable SSE extension
    title: "SSE Example",
  }),
})
  .page("/", homePage)
  .build();

// Create Hono app with SSE endpoints
const app = new Hono();

// SSE endpoint for live time updates
app.get("/events/time", async (c) => {
  return streamSSE(c, async (stream) => {
    let id = 0;
    while (true) {
      const message = new Date().toLocaleTimeString();
      await stream.writeSSE({
        data: message,
        event: "time-update",
        id: String(id++),
      });
      await stream.sleep(1000); // Update every second
    }
  });
});

// SSE endpoint for random numbers
app.get("/events/random", async (c) => {
  return streamSSE(c, async (stream) => {
    let id = 0;
    while (true) {
      const randomNum = Math.floor(Math.random() * 1000);
      const message = `Random: ${randomNum}`;
      await stream.writeSSE({
        data: message,
        event: "random-update",
        id: String(id++),
      });
      await stream.sleep(2000); // Update every 2 seconds
    }
  });
});

// SSE endpoint for counter
app.get("/events/counter", async (c) => {
  return streamSSE(c, async (stream) => {
    let count = 0;
    while (true) {
      const message = `Counter: ${count++}`;
      await stream.writeSSE({
        data: message,
        event: "counter-update",
        id: String(count),
      });
      await stream.sleep(500); // Update every 0.5 seconds
    }
  });
});

// Mount Morph app for all other routes
app.all("/*", async (c) => await morphApp.fetch(c.req.raw));

// Start server
console.log("SSE Example server starting...");
console.log("Open http://localhost:8000 to see live updates!");
console.log("\nSSE endpoints:");
console.log("  - /events/time    - Live server time");
console.log("  - /events/random  - Random numbers");
console.log("  - /events/counter - Auto-incrementing counter");

Deno.serve({ port: 8000 }, app.fetch);
