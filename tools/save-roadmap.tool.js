import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const OUTPUT_DIR = process.env.ROADMAP_OUTPUT_DIR || "./roadmaps";
const MAX_CHARS = 20000;

export const saveRoadmapTool = tool(
  async ({ title, content }) => {
    // safe filename built in code, never from model-supplied paths
    const slug =
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 50) || "roadmap";
    const fileName = `${slug}-${Date.now()}.md`;

    await mkdir(OUTPUT_DIR, { recursive: true });
    await writeFile(
      path.join(OUTPUT_DIR, fileName),
      content.slice(0, MAX_CHARS),
      "utf-8",
    );

    return `Roadmap saved as ${fileName}`;
  },
  {
    name: "save_roadmap",
    description:
      "Saves the study roadmap as a Markdown file. " +
      "Call it only after you have shown the student the readiness report and roadmap. " +
      "The student will be asked to approve before anything is saved.",
    schema: z.object({
      title: z.string().describe("Short title for the roadmap"),
      content: z.string().describe("The full roadmap in Markdown"),
    }),
  },
);
