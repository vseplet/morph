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
        ${meta({ msg: "Hello!" })}
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
    meta: { msg: "Hello!" },
  });
});
