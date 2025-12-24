import { Context, Hono } from "@hono/hono";
import { component, html, meta, morph, styled } from "@vseplet/morph";

interface Process {
  pid: string;
  user: string;
  cpu: string;
  mem: string;
  command: string;
}

async function getProcessList(): Promise<Process[]> {
  const command = new Deno.Command("ps", {
    args: ["aux"],
    stdout: "piped",
  });

  const { stdout } = await command.output();
  const output = new TextDecoder().decode(stdout);
  const lines = output.trim().split("\n");

  // Skip header line
  return lines.slice(1).map((line) => {
    const parts = line.split(/\s+/);
    return {
      user: parts[0],
      pid: parts[1],
      cpu: parts[2],
      mem: parts[3],
      command: parts.slice(10).join(" ").slice(0, 50),
    };
  }).slice(0, 30); // Limit to 30 processes
}

const tableStyles = styled`
  width: 100%;
  border-collapse: collapse;
  font-family: monospace;
  font-size: 12px;
  color: #e0e0e0;
`;

const headerStyles = styled`
  background: #2d2d2d;
  color: #fff;
  text-align: left;
  padding: 8px;
  position: sticky;
  top: 0;
`;

const cellStyles = styled`
  padding: 6px 8px;
  border-bottom: 1px solid #333;
  color: #e0e0e0;
`;

const rowStyles = styled`
  color: #e0e0e0;
  &:hover {
    background: #2a2a3e;
  }
`;

const containerStyles = styled`
  background: #1a1a1a;
  color: #e0e0e0;
  padding: 20px;
  min-height: 100vh;
  font-family: system-ui, sans-serif;
`;

const titleStyles = styled`
  color: #4ade80;
  margin-bottom: 10px;
`;

const infoStyles = styled`
  color: #aaa;
  font-size: 12px;
  margin-bottom: 15px;
`;

// deno-fmt-ignore
const processList = component(async (props) => {
  const processes = await getProcessList();
  const now = new Date().toLocaleTimeString();

  return html`
    <div ${props.hx()} hx-trigger="every 2s" hx-swap="outerHTML">
      <p class="${infoStyles}">
        Last update: ${now} | Showing ${processes.length} processes | Auto-refresh: 2s
      </p>
      <table class="${tableStyles}">
        <thead>
          <tr>
            <th class="${headerStyles}">PID</th>
            <th class="${headerStyles}">USER</th>
            <th class="${headerStyles}">CPU %</th>
            <th class="${headerStyles}">MEM %</th>
            <th class="${headerStyles}">COMMAND</th>
          </tr>
        </thead>
        <tbody>
          ${processes.map((p) => html`
            <tr class="${rowStyles}">
              <td class="${cellStyles}">${p.pid}</td>
              <td class="${cellStyles}">${p.user}</td>
              <td class="${cellStyles}">${p.cpu}</td>
              <td class="${cellStyles}">${p.mem}</td>
              <td class="${cellStyles}">${p.command}</td>
            </tr>
          `)}
        </tbody>
      </table>
    </div>
  `;
});

// deno-fmt-ignore
const homePage = component((props) => html`
  ${meta({ title: "Process Monitor" })}
  <div class="${containerStyles}">
    <h1 class="${titleStyles}">Process Monitor</h1>
    ${processList}
  </div>
`);

const fetch = new Hono()
  .all("/*", async (c: Context) =>
    await morph
      .partial(processList)
      .page("/", homePage)
      .fetch(c.req.raw))
  .fetch;

Deno.serve({ port: 3000 }, fetch);
