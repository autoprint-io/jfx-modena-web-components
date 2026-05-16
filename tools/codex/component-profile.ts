import fs from "node:fs";
import path from "node:path";
import { projectRoot } from "./component-context.ts";

export type ComponentWorkflow =
  | "chart-component"
  | "choice-component"
  | "container-component"
  | "content-component"
  | "control-component"
  | "data-component"
  | "media-component"
  | "menu-component"
  | "misc-component"
  | "shape-component"
  | "text-input-component"
  | "generic-component";

export interface ComponentProfile {
  component: string;
  category: string;
  workflow: ComponentWorkflow;
  status: string;
  certificationStatus: string;
  directory: string;
  allowedFiles: string[];
  sourceAuthority: string[];
  riskFlags: string[];
  overrideApplied: boolean;
  notes: string[];
}

interface ProfileOverride {
  workflow?: ComponentWorkflow;
  allowedFiles?: string[];
  sourceAuthority?: string[];
  riskFlags?: string[];
  notes?: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function workflowForCategory(category: string): ComponentWorkflow {
  switch (category) {
    case "charts":
      return "chart-component";
    case "choices":
      return "choice-component";
    case "containers":
      return "container-component";
    case "content":
      return "content-component";
    case "controls":
      return "control-component";
    case "data":
      return "data-component";
    case "media":
      return "media-component";
    case "menus":
      return "menu-component";
    case "misc":
      return "misc-component";
    case "shapes":
      return "shape-component";
    case "text-inputs":
      return "text-input-component";
    default:
      return "generic-component";
  }
}

function inferRiskFlags(component: string, category: string): string[] {
  const flags = new Set<string>();

  if (category === "charts") {
    flags.add("chart_rendering");
    flags.add("data_binding");
  }

  if (category === "menus" || component.includes("menu") || component.includes("tooltip") || component.includes("dialog")) {
    flags.add("popup_surface");
    flags.add("overlay_positioning");
    flags.add("complex_keyboard");
  }

  if (component.includes("table") || component.includes("tree") || component.includes("list-view")) {
    flags.add("selection_model");
    flags.add("virtualization");
    flags.add("data_binding");
    flags.add("complex_keyboard");
  }

  if (component.includes("text-field") || component.includes("text-area") || component.includes("password-field") || component.includes("html-editor")) {
    flags.add("editable_text");
    flags.add("form_associated");
    flags.add("complex_keyboard");
  }

  if (component.includes("combo-box") || component.includes("choice-box") || component.includes("date-picker") || component.includes("color-picker")) {
    flags.add("popup_surface");
    flags.add("overlay_positioning");
    flags.add("selection_model");
    flags.add("complex_keyboard");
  }

  if (component.includes("canvas") || category === "shapes") {
    flags.add("canvas_or_graphics");
  }

  if (component.includes("media-view") || component.includes("web-view") || component.includes("image-view")) {
    flags.add("media_or_webview");
  }

  return [...flags].sort();
}

function readJsonIfExists(filePath: string): unknown | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function loadOverride(component: string): ProfileOverride | null {
  const overridePath = path.join(projectRoot, "tools", "codex", "component-profiles", "overrides", `${component}.profile.json`);
  const override = readJsonIfExists(overridePath);
  if (!isRecord(override)) {
    return null;
  }

  return {
    workflow: typeof override.workflow === "string" ? (override.workflow as ComponentWorkflow) : undefined,
    allowedFiles: stringArray(override.allowedFiles),
    sourceAuthority: stringArray(override.sourceAuthority),
    riskFlags: stringArray(override.riskFlags),
    notes: stringArray(override.notes),
  };
}

function unique(values: string[]): string[] {
  return [...new Set(values)].sort();
}

export function buildComponentProfile(statusRecord: Record<string, unknown>, sources: unknown): ComponentProfile {
  const component = String(statusRecord.tagName ?? "");
  const category = String(statusRecord.category ?? "unknown");
  const files = isRecord(statusRecord.files) ? statusRecord.files : {};
  const allowedFiles = Object.values(files).filter((item): item is string => typeof item === "string");
  const sourceAuthority = isRecord(sources) ? stringArray(sources.sources) : [];
  const override = loadOverride(component);

  return {
    component,
    category,
    workflow: override?.workflow ?? workflowForCategory(category),
    status: String(statusRecord.componentStatus ?? "unknown"),
    certificationStatus: String(statusRecord.certificationStatus ?? "unknown"),
    directory: String(statusRecord.directory ?? ""),
    allowedFiles: unique([...(override?.allowedFiles ?? []), ...allowedFiles]),
    sourceAuthority: unique([...(override?.sourceAuthority ?? []), ...sourceAuthority]),
    riskFlags: unique([...(override?.riskFlags ?? []), ...inferRiskFlags(component, category)]),
    overrideApplied: Boolean(override),
    notes: unique(override?.notes ?? []),
  };
}
