import { assertEquals } from "@std/assert";
import { component, html, meta } from "@vseplet/morph";
import { renderWithEmptyRequest } from "$/tests/helpers";

Deno.test("10 Render component with meta headers and status", async () => {
  const cmp = component(
    () =>
      html`
        ${meta({
          title: "Test Page",
          statusCode: 201,
          statusText: "Created",
          headers: {
            "X-Custom-Header": "test-value",
          },
          head: `<link rel="canonical" href="https://example.com">`,
          bodyStart: `<div id="top"></div>`,
          bodyEnd: `<div id="bottom"></div>`,
        })}
        <div>Content</div>
      `,
  );

  const result = await renderWithEmptyRequest(cmp);

  assertEquals(result.meta.title, "Test Page");
  assertEquals(result.meta.statusCode, 201);
  assertEquals(result.meta.statusText, "Created");
  assertEquals(result.meta.headers?.["X-Custom-Header"], "test-value");
  assertEquals(result.meta.head, `<link rel="canonical" href="https://example.com">`);
  assertEquals(result.meta.bodyStart, `<div id="top"></div>`);
  assertEquals(result.meta.bodyEnd, `<div id="bottom"></div>`);
});
