import { assertEquals } from "@std/assert";
import { component, html, styled } from "@vseplet/morph";
import { renderWithEmptyRequest } from "$/tests/helpers";

Deno.test("6 Render styled component", async () => {
  const color = "#0056b3";

  const buttonStyle = styled`
    border-radius: 15px;
    border: 1px solid black;
    cursor: pointer;
    font-size: 16px;

    &:hover {
      background-color: ${color};
    }
  `;

  // deno-fmt-ignore
  const cmp = component(
    () =>
      html`
      <div>
        <button class="${buttonStyle}">
      </div>
    `,
  );

  assertEquals(await renderWithEmptyRequest(cmp), {
    html: "\n" +
      "      <div>\n" +
      `        <button class="${buttonStyle.name}">\n` +
      "      </div>\n" +
      "    ",
    css: `.${buttonStyle.name}{\n` +
      "    border-radius: 15px;\n" +
      "    border: 1px solid black;\n" +
      "    cursor: pointer;\n" +
      "    font-size: 16px;\n" +
      "\n" +
      "    &:hover {\n" +
      "      background-color: #0056b3;\n" +
      "    }\n" +
      "  }",
    js: "",
    meta: {},
  });
});
