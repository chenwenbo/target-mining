import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Suppress compile errors from .claude/worktrees subdirectories — they are
  // isolated git worktrees with their own dependency trees and may not have all
  // files from the main repo. These errors do not affect the running application.
  turbopack: {
    ignoreIssue: [
      { path: "**/.claude/worktrees/**" },
    ],
  },
};

export default nextConfig;
