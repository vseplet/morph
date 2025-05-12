import { assertEquals } from "@std/assert";
import { component, html, meta } from "@vseplet/morph";
import { renderWithEmptyRequest } from "$/tests/helpers";

Deno.test("3 Render component with meta information", async () => {
  // deno-fmt-ignore
  const cmp = component(
    () =>
      html`
        <div>
          <p>Hello, World</p>
        </div>
        ${meta({ title: "Hello, World!", head: "<meta>lol</meta>" })}
      `,
  );

  assertEquals(await renderWithEmptyRequest(cmp), {
    html: "\n" +
      "        <div>\n" +
      "          <p>Hello, World</p>\n" +
      "        </div>\n" +
      "        \n" +
      "      ",
    css: "",
    meta: { head: "<meta>lol</meta>", title: "Hello, World!" },
  });
});
