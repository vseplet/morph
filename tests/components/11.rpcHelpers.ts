import { assertEquals } from "@std/assert";
import { rpc } from "@vseplet/morph";

Deno.test("11 RPC helper generates correct HTMX attributes", () => {
  const api = rpc({
    getUser: async (_req, _args: { id: number }) => {
      return { isTemplate: true, type: "html", str: ["test"] as unknown as TemplateStringsArray, args: [] };
    },
    updateUser: async (_req, _args: { id: number; name: string }) => {
      return { isTemplate: true, type: "html", str: ["test"] as unknown as TemplateStringsArray, args: [] };
    },
  });

  // Check that rpc name is generated
  assertEquals(api.name.startsWith("rpc-"), true);

  // Check that rpc methods generate correct attributes
  const getUserAttrs = api.rpc.getUser({ id: 123 });
  assertEquals(getUserAttrs.includes("hx-ext='json-enc'"), true);
  assertEquals(getUserAttrs.includes(`hx-post='/rpc/${api.name}/getUser'`), true);
  assertEquals(getUserAttrs.includes(`hx-vals='{"id":123}'`), true);

  // Check without args
  const noArgsAttrs = api.rpc.getUser();
  assertEquals(noArgsAttrs.includes("hx-vals"), false);
});
