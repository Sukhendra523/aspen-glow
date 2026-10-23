import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "@mui/material";
import theme from "../constants/theme";
import {
  DEFAULT_BRAND_SETTINGS,
  DEFAULT_CONTACT_SETTINGS,
} from "../constants/defaultSettings";
import {
  DEFAULT_FESTIVALS,
  DEFAULT_POSTER_TEMPLATES,
} from "../poster/posterTemplates";
import { buildPosterSnapshot } from "../poster/snapshotResolver";
import {
  buildPosterExportFilename,
  exportPosterToPng,
} from "../poster/posterRenderer";
import { AuthProvider } from "../context/AuthContext";
import { AppRoutes } from "../App";

// Current catalogue has Basic Glow at updated price ₹1,299
const CURRENT_CATALOGUE_PACKAGES = [
  {
    id: "pkg-basic",
    name: "Basic Glow",
    description: "Essential glow combo",
    price_inr: 1299,
    icon_name: "AutoAwesome",
    display_order: 1,
    status: "published",
    package_services: [
      {
        id: "ps-1",
        service_id: "svc-facial",
        display_order: 1,
        inclusion_note: "",
        service: { name: "Facial Cleanup" },
      },
    ],
  },
];

// Historical saved poster snapshot captured when Basic Glow was ₹799
const HISTORICAL_SNAPSHOT = buildPosterSnapshot({
  campaignName: "Historical Karwa Chauth Draft",
  headline: "Karwa Chauth 2025 Special",
  festival: DEFAULT_FESTIVALS[0],
  template: DEFAULT_POSTER_TEMPLATES[0],
  formatKey: "square_1080",
  selectedPackages: [
    {
      id: "pkg-basic",
      name: "Basic Glow",
      price_inr: 799,
      items: ["Facial Cleanup", "Threading 🎉 Free"],
    },
  ],
  capturedAt: "2025-10-15T10:00:00.000Z",
});

const SEED_POSTERS = [
  {
    id: "poster-hist-1",
    campaign_name: "Historical Karwa Chauth Draft",
    festival_id: DEFAULT_FESTIVALS[0].id,
    template_key: "festive_grid_v1",
    template_version: 1,
    format_key: "square_1080",
    status: "draft",
    structured_config: {
      themeKey: "royal_rose",
      selectedPackageIds: ["pkg-basic"],
      selectedBundleIds: [],
    },
    content_snapshot: HISTORICAL_SNAPSHOT,
    export_metadata: {},
  },
];

function createPosterPersistenceClient({
  isAdmin = true,
  postersRows = SEED_POSTERS,
} = {}) {
  const session = isAdmin
    ? { user: { id: "admin-1", email: "shilpi@aspenglow.in" } }
    : null;

  let currentPosters = [...postersRows];

  const posterInsertMock = jest.fn((payload) => ({
    select: jest.fn(() => ({
      single: jest.fn().mockImplementation(async () => {
        const created = { id: "poster-new-1", ...payload };
        currentPosters = [created, ...currentPosters];
        return { data: created, error: null };
      }),
    })),
  }));

  const posterUpdateMock = jest.fn((payload) => ({
    eq: jest.fn((col, id) => ({
      select: jest.fn(() => ({
        single: jest.fn().mockImplementation(async () => {
          currentPosters = currentPosters.map((p) =>
            p.id === id ? { ...p, ...payload } : p
          );
          return {
            data: currentPosters.find((p) => p.id === id) || null,
            error: null,
          };
        }),
      })),
    })),
  }));

  const buildListChain = (getRows) => {
    const chain = {
      order: jest.fn(() => chain),
      eq: jest.fn(() => chain),
      maybeSingle: jest.fn().mockImplementation(async () => ({
        data: getRows()[0] || null,
        error: null,
      })),
      then: (resolve) => resolve({ data: getRows(), error: null }),
    };
    return chain;
  };

  const client = {
    auth: {
      getSession: jest
        .fn()
        .mockResolvedValue({ data: { session }, error: null }),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
      signOut: jest.fn().mockResolvedValue({ error: null }),
    },
    from: jest.fn((table) => {
      if (table === "profiles") {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              maybeSingle: jest.fn().mockResolvedValue({
                data: isAdmin
                  ? {
                      id: "admin-1",
                      email: "shilpi@aspenglow.in",
                      display_name: "Shilpi Chauhan",
                      role: "admin",
                      status: "active",
                    }
                  : null,
                error: null,
              }),
            })),
          })),
        };
      }
      if (table === "brand_settings") {
        return {
          select: jest.fn(() =>
            buildListChain(() => [{ ...DEFAULT_BRAND_SETTINGS }])
          ),
        };
      }
      if (table === "contact_settings") {
        return {
          select: jest.fn(() =>
            buildListChain(() => [{ ...DEFAULT_CONTACT_SETTINGS }])
          ),
        };
      }
      if (table === "festivals") {
        return {
          select: jest.fn(() => buildListChain(() => DEFAULT_FESTIVALS)),
        };
      }
      if (table === "poster_templates") {
        return {
          select: jest.fn(() => buildListChain(() => DEFAULT_POSTER_TEMPLATES)),
        };
      }
      if (table === "packages") {
        return {
          select: jest.fn(() =>
            buildListChain(() => CURRENT_CATALOGUE_PACKAGES)
          ),
        };
      }
      if (table === "bundles") {
        return {
          select: jest.fn(() => buildListChain(() => [])),
        };
      }
      if (table === "posters") {
        return {
          select: jest.fn(() => buildListChain(() => currentPosters)),
          insert: posterInsertMock,
          update: posterUpdateMock,
        };
      }
      return {};
    }),
  };

  return { client, posterInsertMock, posterUpdateMock };
}

function renderApp(initialEntries = ["/admin/posters"], client = null) {
  return render(
    <ThemeProvider theme={theme}>
      <AuthProvider client={client}>
        <MemoryRouter
          initialEntries={initialEntries}
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <AppRoutes />
        </MemoryRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

describe("Ticket 8 — PNG Export Adapter & Filename Rules", () => {
  test("builds deterministic PNG filenames and exports canvas dataURL", () => {
    const filename = buildPosterExportFilename(HISTORICAL_SNAPSHOT);
    expect(filename).toBe(
      "aspen-glow-historical-karwa-chauth-draft-1080x1080.png"
    );

    const fakeCtx = {
      fillStyle: "",
      strokeStyle: "",
      lineWidth: 1,
      font: "",
      textAlign: "left",
      fillRect: jest.fn(),
      strokeRect: jest.fn(),
      fillText: jest.fn(),
    };
    const fakeCanvas = {
      width: 0,
      height: 0,
      getContext: jest.fn(() => fakeCtx),
      toDataURL: jest.fn(() => "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg=="),
    };
    const onDownload = jest.fn();

    const exportRes = exportPosterToPng(fakeCanvas, HISTORICAL_SNAPSHOT, {
      onDownload,
    });
    expect(exportRes.ok).toBe(true);
    expect(exportRes.filename).toBe(
      "aspen-glow-historical-karwa-chauth-draft-1080x1080.png"
    );
    expect(onDownload).toHaveBeenCalledWith(
      expect.objectContaining({
        filename: "aspen-glow-historical-karwa-chauth-draft-1080x1080.png",
        width: 1080,
        height: 1080,
      })
    );
  });

  test("returns retryable error when canvas toDataURL throws", () => {
    const fakeCtx = {
      fillRect: jest.fn(),
      strokeRect: jest.fn(),
      fillText: jest.fn(),
    };
    const brokenCanvas = {
      getContext: jest.fn(() => fakeCtx),
      toDataURL: jest.fn(() => {
        throw new Error("Tainted canvas");
      }),
    };

    const res = exportPosterToPng(brokenCanvas, HISTORICAL_SNAPSHOT);
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/Unable to export poster PNG right now/i);
  });
});

describe("Ticket 8 — Draft Persistence, Snapshot Immutability & PNG Export UI", () => {
  test("preserves saved poster snapshot price (₹799) when source catalogue price changes (₹1,299), saves draft, and archives draft", async () => {
    const { client, posterInsertMock, posterUpdateMock } =
      createPosterPersistenceClient({ isAdmin: true });

    renderApp(["/admin/posters"], client);

    const preview = await screen.findByTestId("poster-snapshot-preview");
    // Live preview initially uses current catalogue price ₹1,299
    expect(within(preview).getByText("₹1,299")).toBeInTheDocument();

    // Save a new poster draft first
    await userEvent.click(
      screen.getByRole("button", { name: /Save Poster Draft/i })
    );

    await waitFor(() => {
      expect(posterInsertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          campaign_name: "Karwa Chauth Festive Campaign",
          status: "draft",
        })
      );
    });
    expect(await screen.findByRole("status")).toHaveTextContent(
      /not published to public website/i
    );

    // Now reopen the historical saved poster draft (captured when Basic Glow was ₹799)
    await userEvent.click(
      screen.getByRole("button", {
        name: /Open Saved Snapshot Historical Karwa Chauth Draft/i,
      })
    );

    // Verify immutable snapshot mode is active and displays ₹799, NOT ₹1,299!
    expect(screen.getByText(/Snapshot Mode: Immutable/i)).toBeInTheDocument();
    expect(within(preview).getByText("₹799")).toBeInTheDocument();
    expect(within(preview).queryByText("₹1,299")).not.toBeInTheDocument();

    // Clicking "Refresh Snapshot with Current Catalogue Data" explicitly pulls current price ₹1,299
    await userEvent.click(
      screen.getByRole("button", {
        name: /Refresh Snapshot with Current Catalogue Data/i,
      })
    );
    expect(within(preview).getByText("₹1,299")).toBeInTheDocument();

    // Archive the historical draft
    await userEvent.click(
      screen.getByRole("button", {
        name: /Archive Historical Karwa Chauth Draft/i,
      })
    );
    expect(
      await screen.findByRole("heading", { name: /Archive Poster Draft\?/i })
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: /Confirm Archive/i })
    );

    await waitFor(() => {
      expect(posterUpdateMock).toHaveBeenCalledWith({ status: "archived" });
    });
    expect(await screen.findByRole("status")).toHaveTextContent(
      /Archived poster draft "Historical Karwa Chauth Draft"/i
    );
  });

  test("shows retryable error alert when PNG export fails in headless environment", async () => {
    const { client } = createPosterPersistenceClient({ isAdmin: true });
    renderApp(["/admin/posters"], client);

    await screen.findByTestId("poster-snapshot-preview");

    // In jsdom without a 2D context mock, Export PNG fails safely and shows Retry button
    await userEvent.click(screen.getByRole("button", { name: /Export PNG/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /Unable to render poster artwork onto the canvas/i
    );
    expect(
      screen.getByRole("button", { name: /Retry PNG Export/i })
    ).toBeInTheDocument();
  });
});

