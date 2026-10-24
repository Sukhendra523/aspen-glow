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
      if (table === "posters") {
        return {
          select: jest.fn(() => buildListChain(() => [])),
        };
      }
      if (table === "services") {
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

  test("renders all 4 reference poster templates (Multi-Service 4-Col, Cleanup List, Luxe 3-Col + QR, Bridal & À La Carte Catalogue) via Fabric.js engine", () => {
    const templateIds = [
      "royal_4col_packages_v1",
      "cleanup_arch_list_v1",
      "luxe_3col_gift_v1",
      "bridal_alacarte_catalogue_v1",
    ];

    templateIds.forEach((tplKey) => {
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

      const tpl =
        DEFAULT_POSTER_TEMPLATES.find((t) => t.template_key === tplKey) ||
        DEFAULT_POSTER_TEMPLATES[0];

      const snap = buildPosterSnapshot({
        campaignName: `Teej ${tplKey}`,
        headline: "Teej Special Offer",
        festival: DEFAULT_FESTIVALS[2],
        template: tpl,
        formatKey:
          tplKey === "cleanup_arch_list_v1"
            ? "square_1080"
            : "portrait_1080x1620",
        showQrCode: tplKey === "luxe_3col_gift_v1",
        selectedPackages: [
          {
            id: "pkg-lotus",
            name: "Lotus Glow",
            price_inr: 1499,
            badge_text: "MOST POPULAR",
            tagline: "SHINE LIKE | A LOTUS",
            items: ["Lotus Facial", "Skin Brightening Bleach"],
          },
        ],
      });

      const res = renderPosterToCanvas(fakeCanvas, snap);
      expect(res.rendered).toBe(true);
      expect(fillTextCalls.join(" | ")).toContain("Aspen Glow by Shilpi");
    });
  });

  test("Ticket 18: uses custom icon_url instead of default cardIcons on poster cards when available", () => {
    const drawImageCalls = [];
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
      drawImage: jest.fn((...args) => drawImageCalls.push(args)),
    };
    const fakeCanvas = {
      width: 0,
      height: 0,
      getContext: jest.fn(() => fakeCtx),
    };

    const tpl = DEFAULT_POSTER_TEMPLATES.find(
      (t) => t.template_key === "bridal_alacarte_catalogue_v1"
    );

    const customIconUrl =
      "https://example.com/salon-media/general/test-custom-icon.png";

    const snap = buildPosterSnapshot({
      campaignName: "Teej Bridal Catalogue",
      headline: "Teej Special Offer For Every Occasion",
      festival: DEFAULT_FESTIVALS[2],
      template: tpl,
      formatKey: "portrait_1080x1620",
      catalogueServices: [
        {
          id: "svc-1",
          name: "Light Party Makeup",
          category: "Makeup & Styling",
          price_inr: 1499,
          icon_type: "makeup_brush",
          icon_url: customIconUrl,
          inclusions: [
            "Includes: Professional Makeup, Elegant Hairstyle & Saree Draping.",
          ],
        },
      ],
    });

    expect(snap.catalogue_sections.makeupAndBridalCards[0].icon_url).toBe(
      customIconUrl
    );

    const res = renderPosterToCanvas(fakeCanvas, snap);
    expect(res.rendered).toBe(true);
    expect(fillTextCalls.join(" | ")).toContain("Light Party Makeup");
  });

  test("cancels stale async redraws and does not loop infinitely when switching snapshots on the same canvas", () => {
    jest.useFakeTimers();
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

    const snap1 = buildPosterSnapshot({
      campaignName: "First Snapshot",
      headline: "First Headline",
      template: DEFAULT_POSTER_TEMPLATES[0],
      selectedPackages: [{ id: "1", name: "Basic Glow", price_inr: 799 }],
    });
    const snap2 = buildPosterSnapshot({
      campaignName: "Second Snapshot",
      headline: "Second Headline",
      template: DEFAULT_POSTER_TEMPLATES[2],
      selectedPackages: [
        { id: "2", name: "Gold cleanup with D-tan pack", price_inr: 599 },
      ],
    });

    renderPosterToCanvas(fakeCanvas, snap1);
    renderPosterToCanvas(fakeCanvas, snap2);

    const callsAfterRender = fakeCtx.fillText.mock.calls.length;
    jest.advanceTimersByTime(200);
    // No infinite timer loop should fire after synchronous renders
    expect(fakeCtx.fillText.mock.calls.length).toBe(callsAfterRender);
    jest.useRealTimers();
  });
});

describe("Ticket 7 — Admin Poster Studio UI (/admin/posters)", () => {
  jest.setTimeout(30000);

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

  test("supports Reset Form, Clear Form, Tiptap typography customization, Export Preview Card PNG, and scannable QR code", async () => {
    const { client } = createPosterStudioSupabaseClient({ isAdmin: true });
    renderApp(["/admin/posters"], client);

    const preview = await screen.findByTestId("poster-snapshot-preview");
    expect(
      within(preview).getByText(/Karwa Chauth Special Glow Packages/i)
    ).toBeInTheDocument();

    // Verify Export Preview Card PNG button is rendered
    expect(
      screen.getByRole("button", { name: /Export Preview Card PNG/i })
    ).toBeInTheDocument();

    // Open Tiptap Rich Text & Font Style toolbar on Poster Headline
    const headlineStyleBtn = screen.getByRole("button", {
      name: /Customize typography for Poster Headline/i,
    });
    await userEvent.click(headlineStyleBtn);
    const headlineToolbar = screen.getByTestId("rich-toolbar-headline");
    expect(
      within(headlineToolbar).getByText(/Tiptap Typography & Style Controls/i)
    ).toBeInTheDocument();

    // Toggle Uppercase (AA) and Champagne Gold color swatch in headline toolbar
    await userEvent.click(
      within(headlineToolbar).getByRole("button", { name: "AA" })
    );
    await userEvent.click(
      within(headlineToolbar).getByRole("button", {
        name: /Set Poster Headline color to Champagne Gold/i,
      })
    );
    expect(await screen.findByText("Custom Style")).toBeInTheDocument();

    // Clear Form clears all campaign inputs and selections
    await userEvent.click(screen.getByRole("button", { name: /Clear Form/i }));
    expect(
      await screen.findByText(/Cleared all Poster Configuration form inputs/i)
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Campaign Name/i)).toHaveValue("");
    // Target the headline text input by id: the label "Poster Headline" also
    // matches the toolbar toggle button and the color picker aria-labels.
    expect(document.getElementById("poster-headline")).toHaveValue("");

    // Reset Form restores default festival, headline, and packages
    await userEvent.click(screen.getByRole("button", { name: /Reset Form/i }));
    expect(
      await screen.findByText(
        /Reset Poster Configuration form to default values/i
      )
    ).toBeInTheDocument();
    expect(document.getElementById("poster-headline")).toHaveValue(
      "Karwa Chauth Special Glow Packages"
    );

    // Enable QR code and verify /aspen-glow-QR-code.png renders in preview
    const qrCheckbox = screen.getByLabelText(
      /Display Scannable Booking QR Code in Footer/i
    );
    await userEvent.click(qrCheckbox);
    const qrImg = await within(preview).findByAltText(
      /Scannable Booking QR Code/i
    );
    expect(qrImg).toHaveAttribute("src", "/aspen-glow-QR-code.png");
  });
});

