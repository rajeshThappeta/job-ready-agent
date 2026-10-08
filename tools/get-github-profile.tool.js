import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const getGitHubProfileTool = tool(
  async ({ username }) => {
    const headers = {
      Accept: "application/vnd.github+json",
      "User-Agent": "job-ready-agent",
    };
    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const name = username.trim().replace(/^@/, "");
    const base = `https://api.github.com/users/${name}`;

    const [profileRes, reposRes] = await Promise.all([
      fetch(base, { headers }),
      fetch(`${base}/repos?type=owner&sort=pushed&per_page=100`, { headers }),
    ]);

    if (profileRes.status === 404) {
      throw new Error(
        `GitHub user "${name}" not found. Ask the student to check the username.`,
      );
    }
    if (!profileRes.ok || !reposRes.ok) {
      throw new Error(
        `GitHub request failed (status ${profileRes.status}). Rate limit may be reached; try later.`,
      );
    }

    const profile = await profileRes.json();
    const repos = await reposRes.json();

    // own work first, forks last
    const ordered = [
      ...repos.filter((r) => !r.fork),
      ...repos.filter((r) => r.fork),
    ];

    return JSON.stringify({
      username: profile.login,
      bio: profile.bio,
      publicRepoCount: profile.public_repos,
      repos: ordered.slice(0, 15).map((r) => ({
        name: r.name,
        description: r.description,
        language: r.language,
        topics: r.topics,
        lastPushed: r.pushed_at,
        isFork: r.fork,
      })),
    });
  },
  {
    name: "get_github_profile",
    description:
      "Lists a student's public GitHub repositories with languages, topics and activity. " +
      "Use this first, once you have a username, to decide which repositories are worth reading. " +
      "Forks are marked and are not the student's own work. Does not return code or README content.",
    schema: z.object({
      username: z.string().describe("GitHub username, without the @ sign"),
    }),
  },
);

export default getGitHubProfileTool;
