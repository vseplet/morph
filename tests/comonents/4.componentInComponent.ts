import { assertEquals } from "@std/assert";
import { component, html } from "@vseplet/morph";
import { renderWithEmptyRequest } from "$/tests/helpers";

Deno.test("4 Render component in component", async () => {
  const h1 = component<{title: string}>((props) => html`<h1>${props.title}</h1>`);

  const cmp = component(
    () =>
      html`
        <div>
          ${h1({title: "Hello, World"})}
        </div>
      `,
  );

  assertEquals(await renderWithEmptyRequest(cmp), {
    html: "\n        <div>\n          <h1>Hello, World</h1>\n        </div>\n      ",
    css: "",
    js: "",
    meta: {}
  });
});
