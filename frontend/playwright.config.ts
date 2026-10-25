import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:5173",
    channel: "msedge",
    viewport: { width: 1366, height: 768 },
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command:
        '".venv\\Scripts\\python.exe" -m flask --app backend.app:create_app run --host 127.0.0.1 --port 5000',
      cwd: "..",
      url: "http://127.0.0.1:5000/api/health",
      reuseExistingServer: true,
      timeout: 30_000,
    },
    {
      command: "npm run dev",
      url: "http://127.0.0.1:5173",
      reuseExistingServer: true,
      timeout: 30_000,
    },
  ],
});
