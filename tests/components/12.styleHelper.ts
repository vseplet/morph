import { assertEquals } from "@std/assert";
import { component, html, style, styled } from "@vseplet/morph";
import { renderWithEmptyRequest } from "$/tests/helpers";

Deno.test("12a Render component with styled in class attribute", async () => {
  const cmp = component(
    () =>
      html`
        <div class="${styled`color: blue; font-size: 14px;`}">
          Styled content
        </div>
      `,
  );

  const result = await renderWithEmptyRequest(cmp);

  // styled generates class name and collects CSS
  assertEquals(result.html.includes('class="s'), true);
  assertEquals(result.css.includes("color: blue;"), true);
  assertEquals(result.css.includes("font-size: 14px;"), true);
});

Deno.test("12b style helper generates class attribute string", () => {
  // style helper is a shortcut that returns class="..." string
  // Note: CSS is not collected with style helper, use styled in class="" for CSS collection
  const result = style`color: red;`;
  assertEquals(result.startsWith('class="s'), true);
  assertEquals(result.endsWith('"'), true);
});
