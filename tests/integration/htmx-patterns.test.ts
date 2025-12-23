import { assertEquals } from "@std/assert";
import { component, html, Morph, basic, styled } from "@vseplet/morph";

Deno.test("HTMX: props.hx() returns correct hx-get attribute", async () => {
  const randomNumber = component((props) => html`
    <div ${props.hx()} hx-swap="outerHTML" hx-trigger="every 1s">
      Random: ${Math.random()}
    </div>
  `);

  const app = new Morph({ layout: basic({ htmx: true }) })
    .partial(randomNumber)
    .build();

  const response = await app.fetch(
    new Request(`http://localhost/draw/${randomNumber.name}`)
  );
  const html_content = await response.text();

  assertEquals(html_content.includes(`hx-get='/draw/${randomNumber.name}'`), true);
  assertEquals(html_content.includes('hx-swap="outerHTML"'), true);
  assertEquals(html_content.includes('hx-trigger="every 1s"'), true);
});

Deno.test("HTMX: counter component with query params", async () => {
  const counter = component((props) => {
    const count = parseInt(props.query?.count ?? "0");
    return html`
      <div id="counter" data-count="${count}">
        Clicked ${count} times
      </div>
    `;
  });

  const app = new Morph({ layout: basic({ htmx: true }) })
    .partial(counter)
    .build();

  // Initial state
  const res0 = await app.fetch(
    new Request(`http://localhost/draw/${counter.name}`)
  );
  assertEquals((await res0.text()).includes("Clicked 0 times"), true);

  // After clicks
  const res1 = await app.fetch(
    new Request(`http://localhost/draw/${counter.name}?count=1`)
  );
  assertEquals((await res1.text()).includes("Clicked 1 times"), true);

  const res5 = await app.fetch(
    new Request(`http://localhost/draw/${counter.name}?count=5`)
  );
  assertEquals((await res5.text()).includes("Clicked 5 times"), true);
});

Deno.test("HTMX: load content on demand with query id", async () => {
  const users: Record<string, { name: string; email: string }> = {
    "1": { name: "Alice", email: "alice@example.com" },
    "2": { name: "Bob", email: "bob@example.com" },
  };

  const userCard = component((props) => {
    const userId = props.query?.id;
    if (!userId || !users[userId]) {
      return html`<div id="user-card">No user selected</div>`;
    }
    const user = users[userId];
    return html`
      <div id="user-card">
        <h3>${user.name}</h3>
        <p>${user.email}</p>
      </div>
    `;
  });

  const app = new Morph({ layout: basic({ htmx: true }) })
    .partial(userCard)
    .build();

  // No user selected
  const noUser = await app.fetch(
    new Request(`http://localhost/draw/${userCard.name}`)
  );
  assertEquals((await noUser.text()).includes("No user selected"), true);

  // User 1
  const user1 = await app.fetch(
    new Request(`http://localhost/draw/${userCard.name}?id=1`)
  );
  const user1Html = await user1.text();
  assertEquals(user1Html.includes("Alice"), true);
  assertEquals(user1Html.includes("alice@example.com"), true);

  // User 2
  const user2 = await app.fetch(
    new Request(`http://localhost/draw/${userCard.name}?id=2`)
  );
  const user2Html = await user2.text();
  assertEquals(user2Html.includes("Bob"), true);
  assertEquals(user2Html.includes("bob@example.com"), true);
});

Deno.test("HTMX: search results component", async () => {
  const searchResults = component((props) => {
    const query = props.query?.q ?? "";
    if (!query) {
      return html`<p id="results">Enter a search term</p>`;
    }
    // Mock search results
    const results = ["Result 1", "Result 2", "Result 3"]
      .filter(r => r.toLowerCase().includes(query.toLowerCase()));
    return html`
      <ul id="results">
        ${results.map(item => html`<li>${item}</li>`)}
      </ul>
    `;
  });

  const app = new Morph({ layout: basic({ htmx: true }) })
    .partial(searchResults)
    .build();

  // Empty search
  const empty = await app.fetch(
    new Request(`http://localhost/draw/${searchResults.name}`)
  );
  assertEquals((await empty.text()).includes("Enter a search term"), true);

  // Search with query
  const search = await app.fetch(
    new Request(`http://localhost/draw/${searchResults.name}?q=Result`)
  );
  const searchHtml = await search.text();
  assertEquals(searchHtml.includes("<ul"), true);
  assertEquals(searchHtml.includes("Result 1"), true);
});

Deno.test("HTMX: component.name is accessible for manual hx-get", async () => {
  const card = component(() => html`<div>Card content</div>`);

  // Component name should be accessible
  assertEquals(card.name.startsWith("cmp-"), true);

  // Can use in hx-get manually
  const page = component(() => html`
    <button hx-get="/draw/${card.name}" hx-target="#container">
      Load Card
    </button>
    <div id="container"></div>
  `);

  const app = new Morph({ layout: basic({ htmx: true }) })
    .partial(card)
    .page("/", page)
    .build();

  const pageRes = await app.fetch(new Request("http://localhost/"));
  const pageHtml = await pageRes.text();
  assertEquals(pageHtml.includes(`hx-get="/draw/${card.name}"`), true);

  // Partial endpoint works
  const cardRes = await app.fetch(
    new Request(`http://localhost/draw/${card.name}`)
  );
  assertEquals((await cardRes.text()).includes("Card content"), true);
});

Deno.test("HTMX: multiple partials on same page", async () => {
  const header = component((props) => html`
    <header ${props.hx()} hx-trigger="every 60s" hx-swap="outerHTML">
      <span>Last updated: ${new Date().toISOString()}</span>
    </header>
  `);

  const notifications = component((props) => html`
    <div ${props.hx()} hx-trigger="every 5s" hx-swap="outerHTML" id="notifications">
      <span>Notifications: ${Math.floor(Math.random() * 10)}</span>
    </div>
  `);

  const page = component(() => html`
    <div>
      ${header({})}
      <main>Content</main>
      ${notifications({})}
    </div>
  `);

  const app = new Morph({ layout: basic({ htmx: true }) })
    .partial(header)
    .partial(notifications)
    .page("/", page)
    .build();

  // Page includes both components with their hx attributes
  const pageRes = await app.fetch(new Request("http://localhost/"));
  const pageHtml = await pageRes.text();
  assertEquals(pageHtml.includes(`hx-get='/draw/${header.name}'`), true);
  assertEquals(pageHtml.includes(`hx-get='/draw/${notifications.name}'`), true);

  // Both partials are accessible
  const headerRes = await app.fetch(
    new Request(`http://localhost/draw/${header.name}`)
  );
  assertEquals((await headerRes.text()).includes("Last updated:"), true);

  const notifRes = await app.fetch(
    new Request(`http://localhost/draw/${notifications.name}`)
  );
  assertEquals((await notifRes.text()).includes("Notifications:"), true);
});

Deno.test("HTMX: partial with styled CSS", async () => {
  const styledCard = component((props) => html`
    <div ${props.hx()}
         hx-swap="outerHTML"
         hx-trigger="click"
         class="${styled`
           padding: 16px;
           border: 1px solid blue;
           cursor: pointer;
         `}">
      Click to refresh: ${Math.random().toFixed(4)}
    </div>
  `);

  const app = new Morph({ layout: basic({ htmx: true }) })
    .partial(styledCard)
    .build();

  const res = await app.fetch(
    new Request(`http://localhost/draw/${styledCard.name}`)
  );
  const html_content = await res.text();

  // Partial returns HTML but CSS is not wrapped in style tag for partials
  // (by design - partials return just the component HTML)
  assertEquals(html_content.includes(`hx-get='/draw/${styledCard.name}'`), true);
  assertEquals(html_content.includes("Click to refresh:"), true);
});

Deno.test("HTMX: async partial component", async () => {
  const asyncData = component(async (props) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 10));
    return html`
      <div ${props.hx()} hx-trigger="click" hx-swap="outerHTML">
        Data loaded: ${Date.now()}
      </div>
    `;
  });

  const app = new Morph({ layout: basic({ htmx: true }) })
    .partial(asyncData)
    .build();

  const res = await app.fetch(
    new Request(`http://localhost/draw/${asyncData.name}`)
  );
  const html_content = await res.text();

  assertEquals(html_content.includes("Data loaded:"), true);
  assertEquals(html_content.includes(`hx-get='/draw/${asyncData.name}'`), true);
});

Deno.test("HTMX: infinite scroll pattern", async () => {
  // Use props.hx() to get the component's own URL - avoids self-reference issue
  const loadMore = component((props) => {
    const page = parseInt(props.query?.page ?? "1");
    const items = [`Item ${page * 3 - 2}`, `Item ${page * 3 - 1}`, `Item ${page * 3}`];
    // props.hx() returns hx-get='/draw/cmp-X', we need to append query params
    const hxAttr = props.hx();
    const nextPageUrl = hxAttr.replace("hx-get='", "").replace("'", "") + `?page=${page + 1}`;

    return html`
      <div id="items-page-${page}">
        ${items.map(item => html`<div class="item">${item}</div>`)}
        <div hx-get="${nextPageUrl}"
             hx-trigger="revealed"
             hx-swap="afterend">
          Loading more...
        </div>
      </div>
    `;
  });

  const app = new Morph({ layout: basic({ htmx: true }) })
    .partial(loadMore)
    .build();

  // Page 1
  const page1 = await app.fetch(
    new Request(`http://localhost/draw/${loadMore.name}?page=1`)
  );
  const page1Html = await page1.text();
  assertEquals(page1Html.includes("Item 1"), true);
  assertEquals(page1Html.includes("Item 2"), true);
  assertEquals(page1Html.includes("Item 3"), true);
  assertEquals(page1Html.includes("page=2"), true);

  // Page 2
  const page2 = await app.fetch(
    new Request(`http://localhost/draw/${loadMore.name}?page=2`)
  );
  const page2Html = await page2.text();
  assertEquals(page2Html.includes("Item 4"), true);
  assertEquals(page2Html.includes("Item 5"), true);
  assertEquals(page2Html.includes("Item 6"), true);
  assertEquals(page2Html.includes("page=3"), true);
});

Deno.test("HTMX: toggle component state", async () => {
  const toggle = component((props) => {
    const isOpen = props.query?.open === "true";
    // Use string "true"/"false" instead of boolean for URL params
    const nextState = isOpen ? "false" : "true";
    return html`
      <div id="toggle">
        <button ${props.hx()}?open=${nextState}
                hx-swap="outerHTML"
                hx-trigger="click">
          ${isOpen ? "Close" : "Open"}
        </button>
        ${isOpen ? html`<div id="content">Hidden content revealed!</div>` : ""}
      </div>
    `;
  });

  const app = new Morph({ layout: basic({ htmx: true }) })
    .partial(toggle)
    .build();

  // Closed state
  const closed = await app.fetch(
    new Request(`http://localhost/draw/${toggle.name}`)
  );
  const closedHtml = await closed.text();
  assertEquals(closedHtml.includes("Open"), true);
  assertEquals(closedHtml.includes("Hidden content"), false);
  assertEquals(closedHtml.includes("open=true"), true);

  // Open state
  const open = await app.fetch(
    new Request(`http://localhost/draw/${toggle.name}?open=true`)
  );
  const openHtml = await open.text();
  assertEquals(openHtml.includes("Close"), true);
  assertEquals(openHtml.includes("Hidden content revealed!"), true);
  assertEquals(openHtml.includes("open=false"), true);
});
