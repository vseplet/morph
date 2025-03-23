export type MorphTemplate = {
  isTemplate: boolean;
  type: string;
  str: TemplateStringsArray;
  args: Array<any | MorphTemplate>;
  meta?: {};
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

export type Layout = {
  layout: (page: string, args: Partial<LayoutOptions>) => string;
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
