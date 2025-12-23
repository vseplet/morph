import { assertEquals } from "@std/assert";
import { component, html, onclick, script } from "@vseplet/morph";
import { renderWithEmptyRequest } from "$/tests/helpers";

Deno.test("9 Render component with onclick and script helpers", async () => {
  const cmp = component(
    () =>
      html`
        <div>
          <button ${onclick(() => alert("clicked"))}>Click me</button>
          ${script(() => console.log("loaded"))}
        </div>
      `,
  );

  const result = await renderWithEmptyRequest(cmp);

  // Note: arrow functions may be minified without spaces
  assertEquals(result.html.includes("onclick='(()=>alert(\"clicked\"))()'"), true);
  assertEquals(result.html.includes("<script>(()=>console.log(\"loaded\"))()</script>"), true);
});
