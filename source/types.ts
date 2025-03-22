export type MorphTemplate = {
  isTemplate: boolean;
  type: string;
  str: TemplateStringsArray;
  args: Array<any | MorphTemplate>;
};

export type MorphAsyncTemplate<P> = {
  isAsyncTemplate: boolean;
  type: string;
  generator: (props: P & MorphPageProps) => MorphTemplate;
  props: P & MorphPageProps;
};

export type MorphTemplateGenerator<T> = T extends void ? () => MorphTemplate
  : (props: T) => MorphTemplate;

export type MorphTemplateAsyncGenerator<T> = T extends void
  ? () => Promise<MorphTemplate>
  : (props: T) => Promise<MorphTemplate>;

export type MorphBaseProps = {
  child?: MorphTemplate;
};

export type MorphPageProps = MorphBaseProps & {
  request: Request;
  route: string;
  params: {
    [x: string]: string;
  };
  headers: Record<string, string>;
  query: Record<string, string>;
};

export type MorphRequest = {
  api: string;
  route: string;
  params: { [x: string]: string };
  query: Record<string, string>;
  headers: Record<string, string>;
  formData: FormData;
};

export type MorphResponse = {
  html?: string;
  status?: number;
};

// Island
export type IslandRpcDefinition = { [key: string]: any };

export type IslandRpcCalls<R> = {
  hx: {
    [key in keyof R]: (args?: R[key]) => string;
  };
};

export type RpcHandlers<R> = {
  [key in keyof R]: (_: {
    args: R[key];
    // req: RefaceRequest; TODO: add req
    // log: (...args: any[]) => void; TODO: add luminous logger
  }) => Promise<{
    html?: string;
    status?: number;
  }>;
};

export type Island<R, P> = {
  name?: string;
  template: (args: {
    props: P;
    rpc: IslandRpcCalls<R>;
    // log: (...args: any[]) => void; TODO: add luminous logger
    // rest: {
    //   hx: (
    //     name: string | "self",
    //     method: "get" | "post" | "put" | "delete" | "patch",
    //     route: string,
    //   ) => string;
    // };
    // partial?: (name: string) => string; // TODO: add partial
    // island?: (name: string) => string; // TODO: add island
  }) => Promise<MorphTemplate>;
  component?: (
    props: MorphPageProps & { rpc: IslandRpcCalls<R> } & P,
  ) => Promise<MorphTemplate> | MorphTemplate;
  rpc?: RpcHandlers<R>;
};

export type Layout = {
  layout: (page: string) => string;
  wrapper?: MorphTemplateGenerator<{ child: MorphTemplate } & MorphPageProps>;
};

export type LayoutOptions = {
  title?: string;
  scripts?: {
    src: string;
    integrity?: string;
    defer?: boolean;
    async?: boolean;
    crossorigin?: string;
  }[];
  styles?: {
    href: string;
    integrity?: string;
    defer?: boolean;
    async?: boolean;
    crossorigin?: string;
  }[];
  head?: string;
  bodyStart?: string;
  bodyEnd?: string;
};
