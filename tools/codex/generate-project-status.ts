#!/usr/bin/env node
import { buildProjectStatus, projectStatusPath, writeProjectStatus } from "./project-automation-utils.ts";

function run(): void {
  const projectStatus = buildProjectStatus();
  writeProjectStatus(projectStatus);
  console.log(`Wrote: ${projectStatusPath}`);
  console.log(`Components: ${projectStatus.components.total}`);
  console.log(`Implemented partial: ${projectStatus.components.byStatus.implemented_partial ?? 0}`);
  console.log(`Scaffold only: ${projectStatus.components.byStatus.scaffold_only ?? 0}`);
  console.log(`Source-backed scaffolds: ${projectStatus.components.sourceBackedScaffolds.length}`);
  console.log(`Codex agents: ${projectStatus.codex.agentCount}`);
  console.log(`Codex skills: ${projectStatus.codex.skillCount}`);
}

run();
