import { assertEquals } from "@std/assert";
import { component, html } from "@vseplet/morph";
import { renderWithEmptyRequest } from "$/tests/helpers";

Deno.test("8 Render component with falsy values (0, '', false)", async () => {
  const cmp = component(
    () =>
      html`
        <div>
          <span>zero: ${0}</span>
          <span>empty: ${""}</span>
          <span>false: ${false}</span>
          <span>null: ${null}</span>
        </div>
      `,
  );

  const result = await renderWithEmptyRequest(cmp);

  assertEquals(result.html.includes("zero: 0"), true);
  assertEquals(result.html.includes("empty: "), true);
  assertEquals(result.html.includes("false: "), true);
  assertEquals(result.html.includes("null: "), true);
});
