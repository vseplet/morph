import { assertEquals } from "@std/assert";
import { component, html } from "@vseplet/morph";
import { renderWithEmptyRequest } from "$/tests/helpers";

Deno.test("2 Render sync component with async function", async () => {
  const cmp = component(
    () =>
      html`
      <div>
        ${async () => (html`<p>Hello, World</p>`)}
      </div>
    `,
  );

  assertEquals(await renderWithEmptyRequest(cmp), {
    html: "\n      <div>\n        <p>Hello, World</p>\n      </div>\n    ",
    css: "",
    js: "",
    meta: {},
  });
});
