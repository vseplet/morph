import { render } from "@vseplet/morph";

export const renderWithEmptyRequest = async (cmp: any) =>
  await render(cmp({}), {
    request: new Request("http://localhost"),
    route: "",
    params: {},
    headers: {},
    query: {},
    hx: () => "",
  });
