const { spawnSync } = require("child_process");

// Strip secret keys from the environment so CRA does NOT bake them into build/
const sanitizedEnv = { ...process.env };
delete sanitizedEnv.REACT_APP_SUPABASE_URL;
delete sanitizedEnv.REACT_APP_SUPABASE_PUBLISHABLE_KEY;
delete sanitizedEnv.REACT_APP_SUPABASE_ANON_KEY;

// Use npx react-scripts build directly so it works cross-platform
const isWindows = process.platform === "win32";
const npxCmd = isWindows ? "npx.cmd" : "npx";

console.log("[build-production] Building static assets without inlining secrets...");
const result = spawnSync(npxCmd, ["react-scripts", "build"], {
  stdio: "inherit",
  env: sanitizedEnv,
});

if (result.error) {
  console.error("[build-production] Error spawning build:", result.error);
  process.exit(1);
}

process.exit(result.status || 0);

