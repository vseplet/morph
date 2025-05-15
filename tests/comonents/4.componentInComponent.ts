import { assertEquals } from "@std/assert";
import { component, html } from "@vseplet/morph";
import { renderWithEmptyRequest } from "$/tests/helpers";

Deno.test("4 Render component in component", async () => {
  const cmp = component(
    () =>
      html`
        <div>
          <p>Hello, World</p>
        </div>
      `,
  );

  assertEquals(await renderWithEmptyRequest(cmp), {
    html:
      "\n        <div>\n          <p>Hello, World</p>\n        </div>\n      ",
    css: "",
    js: "",
    meta: {},
  });
});
