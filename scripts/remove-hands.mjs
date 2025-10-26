#!/usr/bin/env node
import { NodeIO } from '@gltf-transform/core';
import { prune, dedup } from '@gltf-transform/functions';
import path from 'node:path';
import fs from 'node:fs/promises';

const INPUT = process.argv[2] || 'public/face-legacy.glb';
const OUTPUT = process.argv[3] || 'public/face-legacy-head.glb';

async function main() {
  const io = new NodeIO();
  const inputPath = path.resolve(INPUT);
  const outputPath = path.resolve(OUTPUT);

  const dir = path.dirname(outputPath);
  await fs.mkdir(dir, { recursive: true });

  console.log(`Reading: ${inputPath}`);
  const doc = await io.read(inputPath);
  const root = doc.getRoot();

  // Collect nodes to remove by name heuristics.
  const toRemove = new Set();
  const nameMatches = (name) => /hand|wrist|finger/i.test(name || '');

  for (const node of root.listNodes()) {
    if (nameMatches(node.getName())) {
      toRemove.add(node);
    }
  }

  // Also remove bones that match, plus their children.
  for (const skin of root.listSkins()) {
    for (const joint of skin.listJoints()) {
      if (nameMatches(joint.getName())) {
        toRemove.add(joint);
        joint.traverse((child) => toRemove.add(child));
      }
    }
  }

  // Dispose nodes selected for removal.
  let removed = 0;
  for (const node of toRemove) {
    node.dispose();
    removed++;
  }
  console.log(`Removed nodes: ${removed}`);

  // Prune unused meshes/materials/accessors, and deduplicate.
  await doc.transform(prune(), dedup());

  console.log(`Writing: ${outputPath}`);
  await io.write(outputPath, doc);
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
