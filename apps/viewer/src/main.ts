import { adoptModenaTheme } from "@autoprint/jfx-modena-design-system";
import { defineJfxButton } from "@autoprint/jfx-modena-components";

adoptModenaTheme();
defineJfxButton();

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("Viewer root element #app was not found.");
}

app.className = "jfx-modena-root";
app.innerHTML = `
  <style>
    body {
      margin: 0;
      background: var(--jfx-background);
    }

    .viewer {
      display: grid;
      grid-template-columns: 260px minmax(0, 1fr);
      min-height: 100vh;
      font-family: var(--jfx-font-family);
      font-size: var(--jfx-font-size);
    }

    .sidebar {
      border-right: 1px solid var(--jfx-outer-border);
      background: linear-gradient(to bottom, #f7f7f7, #e9e9e9);
      padding: 12px;
    }

    .sidebar h1 {
      margin: 0 0 12px;
      font-size: 14px;
      font-weight: 600;
    }

    .nav-item {
      padding: 4px 7px;
      border: 1px solid var(--jfx-focus-color);
      background: var(--jfx-accent);
      color: white;
    }

    .stage {
      padding: 18px;
    }

    .component-title {
      margin: 0 0 14px;
      font-size: 18px;
      font-weight: 600;
    }

    .panel {
      max-width: 760px;
      border: 1px solid var(--jfx-outer-border);
      background: var(--jfx-control-inner-background);
    }

    .panel-header {
      padding: 7px 10px;
      border-bottom: 1px solid var(--jfx-outer-border);
      background: linear-gradient(to bottom, #f7f7f7, #e5e5e5);
      font-weight: 600;
    }

    .variants {
      display: grid;
      gap: 12px;
      padding: 14px;
    }

    .variant {
      display: grid;
      grid-template-columns: 120px minmax(0, 1fr);
      align-items: center;
      gap: 12px;
    }

    .label {
      color: #666666;
    }
  </style>

  <main class="viewer">
    <aside class="sidebar">
      <h1>JFX Modena</h1>
      <div class="nav-item">Button</div>
    </aside>

    <section class="stage">
      <h2 class="component-title">jfx-button</h2>
      <div class="panel">
        <div class="panel-header">Variants</div>
        <div class="variants">
          <div class="variant">
            <span class="label">Normal</span>
            <div><jfx-button>Button</jfx-button></div>
          </div>
          <div class="variant">
            <span class="label">Default</span>
            <div><jfx-button default>Default Button</jfx-button></div>
          </div>
          <div class="variant">
            <span class="label">Disabled</span>
            <div><jfx-button disabled>Disabled</jfx-button></div>
          </div>
          <div class="variant">
            <span class="label">Keyboard</span>
            <div><jfx-button id="keyboard-button">Focus with Tab</jfx-button></div>
          </div>
        </div>
      </div>
    </section>
  </main>
`;
