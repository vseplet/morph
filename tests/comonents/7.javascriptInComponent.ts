import { assertEquals } from "@std/assert";
import { component, html, js } from "@vseplet/morph";
import { renderWithEmptyRequest } from "$/tests/helpers";

Deno.test("7 Render component with JavaScript", async () => {
  const cmp = component(
    () =>
      html`
      <div>
        <p id="title">Hello, World</p>
        ${js`document.querySelector('#title').innerHTML = 'LoL';`}
      </div>
    `,
  );


  assertEquals(await renderWithEmptyRequest(cmp), {
    html: "\n" +
      "      <div>\n" +
      '        <p id="title">Hello, World</p>\n' +
      "        \n" +
      "      </div>\n" +
      "    ",
    css: "",
    js: "(function() {document.querySelector('#title').innerHTML = 'LoL';})();",
    meta: {}
  });
});
