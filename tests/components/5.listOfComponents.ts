import { assertEquals } from "@std/assert";
import { component, html } from "@vseplet/morph";
import { renderWithEmptyRequest } from "$/tests/helpers";

Deno.test("5 Render list of components", async () => {
  const h1 = component<{title: string}>((props) => html`<h1>${props.title}</h1>`);

  const cmp = component(
    () =>
      html`
        <div>
          ${["title 1", "title 2"].map(title => h1({title}))}
        </div>
      `,
  );

  assertEquals(await renderWithEmptyRequest(cmp), {
    html: "\n" +
      "        <div>\n" +
      "          <h1>title 1</h1><h1>title 2</h1>\n" +
      "        </div>\n" +
      "      ",
    css: "",
    js: "",
    meta: {}
  });
});
