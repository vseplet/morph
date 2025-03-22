import { type Context, Hono } from "@hono/hono";

import type {
  Layout,
  LayoutOptions,
  MorphAsyncTemplate,
  MorphPageProps,
  MorphTemplate,
  MorphTemplateAsyncGenerator,
  MorphTemplateGenerator,
} from "./types.ts";

export * from "./types.ts";

export const render = async (
  template:
    | MorphTemplate
    | MorphAsyncTemplate<any>
    | Array<MorphTemplate | MorphAsyncTemplate<any>>
    | MorphTemplateGenerator<any>
    | MorphTemplateAsyncGenerator<any>
    | Array<MorphTemplateGenerator<any> | MorphTemplateAsyncGenerator<any>>
    | any, // TODO: костыль
  pageProps: MorphPageProps,
): Promise<{ html: string; meta: {} }> => {
  let meta: Record<string, any> = {};

  if (Array.isArray(template)) {
    const results = await Promise.all(
      template.map((item) => render(item, pageProps)),
    );
    return {
      html: results.map((r) => r.html).join(""),
      meta: Object.assign({}, ...results.map((r) => r.meta)),
    };
  }

  if (template?.isAsyncTemplateGenerator || template?.isTemplateGenerator) {
    return render(
      await template.generate({ ...template.props, ...pageProps }),
      pageProps,
    );
  }

  if (!template?.str || !Array.isArray(template.args)) {
    return { html: String(template ?? ""), meta };
  }

  meta = { ...template.meta };

  const html = await template.str.reduce(
    async (accPromise: any, part: any, i: any) => {
      const acc = await accPromise;
      const { html: renderedArg, meta: argMeta } = await renderArgument(
        template.args[i],
        pageProps,
      );
      Object.assign(meta, argMeta);
      return acc + part + renderedArg;
    },
    Promise.resolve(""),
  );

  return { html, meta };
};

const renderArgument = async (
  arg: any,
  pageProps: MorphPageProps,
): Promise<{ html: string; meta: {} }> => {
  let meta: Record<string, any> = {};
  if (!arg) return { html: "", meta };

  if (arg.isTemplate) {
    const result = await render(arg, pageProps);
    return result;
  }

  if (arg.isAsyncTemplateGenerator || arg.isTemplateGenerator) {
    return render(
      await arg.generate({ ...arg.props, ...pageProps }),
      pageProps,
    );
  }

  if (typeof arg === "function") {
    const result = await (arg.constructor.name === "AsyncFunction"
      ? arg(pageProps)
      : Promise.resolve(arg(pageProps)));
    return renderArgument(result, pageProps);
  }

  if (Array.isArray(arg)) {
    const results = await Promise.all(
      arg.map((item) => render(item, pageProps)),
    );
    return {
      html: results.map((r) => r.html).join(""),
      meta: Object.assign({}, ...results.map((r) => r.meta)),
    };
  }

  return { html: String(arg), meta };
};

export class Morph {
  private morphLayout: Layout;
  private pages: Record<string, any> = {};
  private partials: Record<string, any> = {};
  private honoRouter: Hono | null = null;

  constructor(
    private options: {
      layout: Layout;
    },
  ) {
    this.morphLayout = options.layout;
  }

  layout(layout: Layout) {
    this.morphLayout = layout;
    return this;
  }

  page(route: string, generate: any) {
    this.pages[route] = async (c: Context) => {
      const pageProps = {
        request: c.req.raw,
        route,
        params: c.req.param(),
        query: c.req.query(),
        headers: c.req.header(),
      };

      const template = generate(pageProps);

      const pageObject = this.morphLayout.wrapper
        ? await render(
            this.morphLayout?.wrapper({ child: template, ...pageProps }),
            pageProps,
          )
        : await render(template, pageProps);

      console.log(pageObject.meta);

      return c.html(this.morphLayout.layout(pageObject.html, pageObject.meta));
    };

    return this;
  }

  hono() {
    if (this.honoRouter == null) {
      const router = new Hono();

      for (const [route, handler] of Object.entries(this.pages)) {
        router.get(route, handler);
      }

      for (const [route, handler] of Object.entries(this.partials)) {
        router.get(route, handler);
      }

      return router;
    } else {
      return this.honoRouter;
    }
  }

  async fetch(req: Request) {
    return await this.hono().fetch(req);
  }
}

export const html = (
  str: TemplateStringsArray,
  ...args: any[]
): MorphTemplate => ({
  isTemplate: true,
  type: "html",
  str,
  args,
});

export const css = (str: TemplateStringsArray, ...args: any[]) => ({
  isTemplate: true,
  type: "css",
  str,
  args,
});

export const morph = new Morph({
  layout: {
    layout: (page) => `
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <script src="https://unpkg.com/htmx.org@2.0.1"></script>
          <script src="https://unpkg.com/hyperscript.org@0.9.12"></script>
        </head>
        <body>
          ${page}
        </body>
      </html>
    `,
  },
});

export const layout = <C>(cb: (layoutOptions: C & LayoutOptions) => Layout) =>
  cb;

export const component = <T = {}>(
  generate: T extends void
    ? (props: MorphPageProps) => Promise<MorphTemplate> | MorphTemplate
    : (props: T & MorphPageProps) => Promise<MorphTemplate> | MorphTemplate,
  slots?: any,
) => {
  if (generate.constructor.name === "AsyncFunction") {
    return (props: T) => {
      return {
        isAsyncTemplateGenerator: true,
        generate,
        props,
        slots,
      };
    };
  } else {
    return (props: T) => {
      return {
        isTemplateGenerator: true,
        generate,
        props,
        slots,
      };
    };
  }
};

export const partial = <T = {}>() => {};

export const style = (text: string) => `style="${text}"`;

export const onclick = (fn: Function) => {
  return `onclick='(${fn.toString()})()'`;
};

export const script = (fn: Function) => {
  return `<script>(${fn.toString()})()</script>`;
};

export const basic = layout<{
  hyperscript?: boolean;
  alpine?: boolean;
  bootstrap?: boolean;
  bootstrapIcons?: boolean;
  htmx?: boolean;
  jsonEnc?: boolean;
  bluma?: boolean;
  wrapper?: MorphTemplateGenerator<{ child: MorphTemplate } & MorphPageProps>;
}>((options) => {
  return {
    wrapper: options?.wrapper,
    layout: (page: string, args) => {
      return `
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            ${
              options.htmx
                ? `<script src="https://unpkg.com/htmx.org@2.0.1"></script>`
                : ""
            }
            ${
              options.alpine
                ? `<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>`
                : ""
            }
            ${
              options.bootstrap
                ? `<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet"
      integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">`
                : ""
            }
            ${
              options.bootstrapIcons
                ? `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">`
                : ""
            }
            ${
              options.jsonEnc
                ? `<script src="https://unpkg.com/htmx-ext-json-enc@2.0.1/json-enc.js"></script>`
                : ""
            }
            ${
              options.bluma
                ? `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bulma@1.0.2/css/bulma.min.css">`
                : ""
            }
            ${
              options.hyperscript
                ? `<script src="https://unpkg.com/hyperscript.org@0.9.12"></script>`
                : ""
            }
            <title>${args.title || options.title || "Reface Clean"}</title>
            ${options.head || ""}
          </head>
          <body>
            ${options.bodyStart || ""}
            ${page}
            ${options.bodyEnd || ""}
          </body>
        </html>
      `;
    },
  };
});
