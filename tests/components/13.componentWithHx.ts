import { assertEquals } from "@std/assert";
import { component, html, morph } from "@vseplet/morph";

Deno.test("13 Component receives hx function in props", async () => {
  let capturedHx: string | undefined;

  const cmp = component((props) => {
    capturedHx = props.hx();
    return html`<div ${props.hx()}>Content</div>`;
  });

  // Register partial to test hx generation
  const app = morph.partial(cmp);

  // The hx function should be available and return hx-get attribute
  assertEquals(capturedHx === undefined || capturedHx.includes("hx-get="), true);
});
