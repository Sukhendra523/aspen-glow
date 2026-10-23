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
import {
  buildPosterSnapshot,
  validatePosterCampaignInput,
} from "../poster/snapshotResolver";
import { renderPosterToCanvas } from "../poster/posterRenderer";
import { AuthProvider } from "../context/AuthContext";
import { AppRoutes } from "../App";

const SEED_PACKAGES = [
  {
    id: "pkg-basic",
    name: "Basic Glow",
    description: "Essential glow combo",
    price_inr: 799,
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
      {
        id: "ps-2",
        service_id: "svc-thread",
        display_order: 2,
        inclusion_note: "🎉 Free",
        service: { name: "Threading" },
      },
    ],
  },
  {
    id: "pkg-royal",
    name: "Royal Treatment",
    description: "O3 facial & Rica wax",
    price_inr: 1999,
    icon_name: "Star",
    display_order: 2,
    status: "published",
    package_services: [
      {
        id: "ps-3",
        service_id: "svc-o3",
        display_order: 1,
        inclusion_note: "",
        service: { name: "O3 Facial" },
      },
    ],
  },
];

function createPosterStudioSupabaseClient({ isAdmin = true } = {}) {
  const session = isAdmin
    ? { user: { id: "admin-1", email: "shilpi@aspenglow.in" } }
    : null;

  let currentFestivals = [...DEFAULT_FESTIVALS];

  const festivalInsertMock = jest.fn((payload) => ({
    select: jest.fn(() => ({
      single: jest.fn().mockImplementation(async () => {
        const created = { id: "fest-custom-1", ...payload };
        currentFestivals.push(created);
        return { data: created, error: null };
      }),
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
          select: jest.fn(() => buildListChain(() => currentFestivals)),
          insert: festivalInsertMock,
        };
      }
      if (table === "poster_templates") {
        return {
          select: jest.fn(() => buildListChain(() => DEFAULT_POSTER_TEMPLATES)),
        };
      }
      if (table === "packages") {
        return {
          select: jest.fn(() => buildListChain(() => SEED_PACKAGES)),
        };
      }
      if (table === "bundles") {
        return {
          select: jest.fn(() => buildListChain(() => [])),
        };
      }
      return {};
    }),
  };

  return { client, festivalInsertMock };
}

function renderApp(initialEntries = ["/admin/posters"], client = null) {
  return render(
    <ThemeProvider theme={theme}>
      <AuthProvider client={client}>
        <MemoryRouter initialEntries={initialEntries}>
          <AppRoutes />
        </MemoryRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

describe("Ticket 7 — Snapshot Resolver & Canvas Poster Renderer", () => {
  test("creates deep-cloned immutable snapshot that does not mutate when source data changes", () => {
    const mutablePackage = {
      id: "pkg-1",
      name: "Basic Glow",
      price_inr: 799,
      items: ["Facial Cleanup", "Threading 🎉 Free"],
    };
    const mutableBrand = { ...DEFAULT_BRAND_SETTINGS };

    const snapshot = buildPosterSnapshot({
      campaignName: "Karwa Chauth Offer",
      headline: "Karwa Chauth Special",
      festival: DEFAULT_FESTIVALS[0],
      template: DEFAULT_POSTER_TEMPLATES[0],
      formatKey: "portrait_1080x1350",
      brand: mutableBrand,
      selectedPackages: [mutablePackage],
      capturedAt: "2026-10-23T12:00:00.000Z",
    });

    // Mutate source objects after snapshot creation
    mutablePackage.price_inr = 1499;
    mutablePackage.items.push("Mutated Extra Item");
    mutableBrand.brand_name = "Changed Salon Name";

    expect(snapshot.template.width).toBe(1080);
    expect(snapshot.template.height).toBe(1350);
    expect(snapshot.brand.brand_name).toBe("Aspen Glow by Shilpi");
    expect(snapshot.offerings[0].price_inr).toBe(799);
    expect(snapshot.offerings[0].price_formatted).toBe("₹799");
    expect(snapshot.offerings[0].items).toEqual([
      "Facial Cleanup",
      "Threading 🎉 Free",
    ]);
    expect(snapshot.campaign.validity_note).toBe("");
  });

  test("enforces template max_offerings validation", () => {
    const spotlightTemplate = DEFAULT_POSTER_TEMPLATES[1]; // max_offerings: 2
    const invalid = validatePosterCampaignInput({
      campaignName: "Spotlight Test",
      headline: "Spotlight Offer",
      template: spotlightTemplate,
      selectedPackages: [{ id: "1" }, { id: "2" }, { id: "3" }],
      selectedBundles: [],
    });

    expect(invalid.valid).toBe(false);
    expect(invalid.errors.offerings).toMatch(/at most 2 featured offerings/i);
  });

  test("renders snapshot artwork to 2D canvas context with correct dimensions and text", () => {
    const fillTextCalls = [];
    const fakeCtx = {
      fillStyle: "",
      strokeStyle: "",
      lineWidth: 1,
      font: "",
      textAlign: "left",
      fillRect: jest.fn(),
      strokeRect: jest.fn(),
      fillText: jest.fn((text) => fillTextCalls.push(text)),
    };
    const fakeCanvas = {
      width: 0,
      height: 0,
      getContext: jest.fn(() => fakeCtx),
    };

    const snapshot = buildPosterSnapshot({
      campaignName: "Diwali Glow",
      headline: "Diwali Festive Beauty Offers",
      festival: DEFAULT_FESTIVALS[1],
      template: DEFAULT_POSTER_TEMPLATES[0],
      formatKey: "square_1080",
      selectedPackages: [
        {
          id: "pkg-basic",
          name: "Basic Glow",
          price_inr: 799,
          items: ["Facial Cleanup"],
        },
      ],
    });

    const result = renderPosterToCanvas(fakeCanvas, snapshot);
    expect(result).toEqual({ rendered: true, width: 1080, height: 1080 });
    expect(fakeCanvas.width).toBe(1080);
    expect(fakeCanvas.height).toBe(1080);
    expect(fillTextCalls.join(" | ")).toContain("Aspen Glow by Shilpi");
    expect(fillTextCalls.join(" | ")).toContain("Diwali Festive Beauty Offers");
    expect(fillTextCalls.join(" | ")).toContain("Basic Glow");
    expect(fillTextCalls.join(" | ")).toContain("₹799");
  });
});

describe("Ticket 7 — Admin Poster Studio UI (/admin/posters)", () => {
  test("redirects unauthenticated user from /admin/posters to /admin/login", async () => {
    const { client } = createPosterStudioSupabaseClient({ isAdmin: false });
    renderApp(["/admin/posters"], client);

    expect(
      await screen.findByText(/Sign in with your administrator account/i)
    ).toBeInTheDocument();
  });

  test("switches festival copy, updates live snapshot preview, and adds a custom festival", async () => {
    const { client, festivalInsertMock } = createPosterStudioSupabaseClient({
      isAdmin: true,
    });
    renderApp(["/admin/posters"], client);

    const preview = await screen.findByTestId("poster-snapshot-preview");
    expect(
      within(preview).getByText(/Karwa Chauth Special Glow Packages/i)
    ).toBeInTheDocument();
    expect(within(preview).getByText("Basic Glow")).toBeInTheDocument();
    expect(within(preview).getByText("₹799")).toBeInTheDocument();

    // Switch festival to Diwali
    const festSelect = screen.getByLabelText(/Select Festival \/ Occasion/i);
    await userEvent.click(festSelect);
    await userEvent.click(await screen.findByRole("option", { name: /Diwali/i }));

    expect(
      within(preview).getByText(/Diwali Festive Beauty Offers/i)
    ).toBeInTheDocument();

    // Add Custom Festival via dialog
    await userEvent.click(
      screen.getByRole("button", { name: /\+ Add Festival/i })
    );
    expect(
      await screen.findByRole("heading", { name: /Add Custom Festival/i })
    ).toBeInTheDocument();

    await userEvent.type(
      screen.getByLabelText(/Festival Name/i),
      "Raksha Bandhan"
    );
    await userEvent.type(
      screen.getByLabelText(/Default Headline/i),
      "Rakhi Special Pampering Offers"
    );
    await userEvent.click(
      screen.getByRole("button", { name: /Save Festival/i })
    );

    await waitFor(() => {
      expect(festivalInsertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Raksha Bandhan",
          default_headline: "Rakhi Special Pampering Offers",
        })
      );
    });

    expect(
      await within(preview).findByText(/Rakhi Special Pampering Offers/i)
    ).toBeInTheDocument();
  });
});

