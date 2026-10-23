import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "@mui/material";
import theme from "../constants/theme";
import {
  DEFAULT_BRAND_SETTINGS,
  DEFAULT_CONTACT_SETTINGS,
} from "../constants/defaultSettings";
import {
  normalizeBundleRecord,
  validateBundleInput,
} from "../services/bundleService";
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
    package_services: [],
  },
  {
    id: "pkg-radiant",
    name: "Radiant Refresh",
    description: "D-Tan & waxing package",
    price_inr: 1099,
    icon_name: "Star",
    display_order: 2,
    status: "published",
    package_services: [],
  },
  {
    id: "pkg-royal",
    name: "Royal Treatment",
    description: "O3 facial & Rica wax",
    price_inr: 1999,
    icon_name: "Star",
    display_order: 3,
    status: "published",
    package_services: [],
  },
];

const SEED_BUNDLES = [
  {
    id: "bnd-festive",
    name: "Diwali Mega Combo",
    description: "Combine Basic Glow and Radiant Refresh at a festive price.",
    price_inr: 1599,
    icon_name: "Star",
    display_order: 1,
    status: "published",
    bundle_packages: [
      {
        id: "bp-1",
        package_id: "pkg-basic",
        display_order: 1,
        package: { id: "pkg-basic", name: "Basic Glow", price_inr: 799 },
      },
      {
        id: "bp-2",
        package_id: "pkg-radiant",
        display_order: 2,
        package: {
          id: "pkg-radiant",
          name: "Radiant Refresh",
          price_inr: 1099,
        },
      },
    ],
  },
  {
    id: "bnd-draft",
    name: "Unreleased Secret Bundle",
    description: "Hidden draft bundle",
    price_inr: 2499,
    icon_name: "AutoAwesome",
    display_order: 2,
    status: "draft",
    bundle_packages: [],
  },
];

function createBundlesSupabaseClient({
  isAdmin = true,
  packagesRows = SEED_PACKAGES,
  bundlesRows = SEED_BUNDLES,
} = {}) {
  const session = isAdmin
    ? { user: { id: "admin-1", email: "shilpi@aspenglow.in" } }
    : null;

  let currentBundles = [...bundlesRows];

  const bundleInsertMock = jest.fn((payload) => ({
    select: jest.fn(() => ({
      single: jest.fn().mockImplementation(async () => {
        const created = {
          id: "bnd-created-1",
          ...payload,
          bundle_packages: [],
        };
        currentBundles.push(created);
        return { data: { id: created.id }, error: null };
      }),
    })),
  }));

  const bundleUpdateMock = jest.fn((payload) => ({
    eq: jest.fn((col, id) => {
      currentBundles = currentBundles.map((b) =>
        b.id === id ? { ...b, ...payload } : b
      );
      return {
        select: jest.fn(() => ({
          single: jest.fn().mockImplementation(async () => ({
            data: currentBundles.find((b) => b.id === id) || null,
            error: null,
          })),
        })),
        then: (resolve) => resolve({ data: null, error: null }),
      };
    }),
  }));

  const bundlePackagesInsertMock = jest
    .fn()
    .mockImplementation(async (rows) => {
      if (Array.isArray(rows) && rows.length > 0) {
        const bundleId = rows[0].bundle_id;
        const hydrated = rows.map((r, i) => ({
          id: `bp-new-${i}`,
          ...r,
          package: packagesRows.find((p) => p.id === r.package_id) || null,
        }));
        currentBundles = currentBundles.map((b) =>
          b.id === bundleId ? { ...b, bundle_packages: hydrated } : b
        );
      }
      return { data: rows, error: null };
    });

  const bundlePackagesDeleteMock = jest.fn(() => ({
    eq: jest.fn().mockResolvedValue({ data: null, error: null }),
  }));

  const buildListChain = (getRows) => {
    let filterStatus = null;
    let filterId = null;
    const chain = {
      order: jest.fn(() => chain),
      eq: jest.fn((col, val) => {
        if (col === "status") filterStatus = val;
        if (col === "id") filterId = val;
        return chain;
      }),
      maybeSingle: jest.fn().mockImplementation(async () => {
        const rows = getRows();
        return { data: rows[0] || null, error: null };
      }),
      single: jest.fn().mockImplementation(async () => {
        const rows = getRows();
        const match = filterId
          ? rows.find((r) => r.id === filterId)
          : rows[0];
        return { data: match || null, error: null };
      }),
      then: (resolve) => {
        let rows = getRows();
        if (filterStatus) {
          rows = rows.filter((r) => r.status === filterStatus);
        }
        return resolve({ data: rows, error: null });
      },
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
      if (table === "packages") {
        return {
          select: jest.fn(() => buildListChain(() => packagesRows)),
        };
      }
      if (table === "bundles") {
        return {
          select: jest.fn(() => buildListChain(() => currentBundles)),
          insert: bundleInsertMock,
          update: bundleUpdateMock,
        };
      }
      if (table === "bundle_packages") {
        return {
          insert: bundlePackagesInsertMock,
          delete: bundlePackagesDeleteMock,
        };
      }
      return {};
    }),
  };

  return {
    client,
    bundleInsertMock,
    bundleUpdateMock,
    bundlePackagesInsertMock,
  };
}

function renderApp(initialEntries = ["/admin/bundles"], client = null) {
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

describe("Ticket 5 — Bundle Domain & Validation Rules", () => {
  test("normalizes bundle records in display_order", () => {
    const normalized = normalizeBundleRecord({
      id: "b1",
      name: "Bridal Prep Bundle",
      bundle_packages: [
        { display_order: 2, package: { name: "Royal Treatment" } },
        { display_order: 1, package: { name: "Basic Glow" } },
      ],
    });
    expect(normalized.items).toEqual(["Basic Glow", "Royal Treatment"]);
  });

  test("validates promotional price, requires at least one package, and rejects duplicate packages", () => {
    const noPackagesResult = validateBundleInput({
      name: "Karwa Chauth Bundle",
      price_inr: "1499",
      icon_name: "Star",
      display_order: "1",
      status: "published",
      package_items: [],
    });
    expect(noPackagesResult.valid).toBe(false);
    expect(noPackagesResult.errors.package_items).toMatch(
      /at least one package/i
    );

    const duplicateResult = validateBundleInput({
      name: "Karwa Chauth Bundle",
      price_inr: "1499",
      icon_name: "Star",
      display_order: "1",
      status: "published",
      package_items: [{ package_id: "pkg-basic" }, { package_id: "pkg-basic" }],
    });
    expect(duplicateResult.valid).toBe(false);
    expect(duplicateResult.errors.package_items).toMatch(/only be added once/i);
  });
});

describe("Ticket 5 — Public Bundle Display", () => {
  test("renders published promotional bundles on / while excluding drafts", async () => {
    const { client } = createBundlesSupabaseClient({ isAdmin: false });
    renderApp(["/"], client);

    expect(
      await screen.findByText(/Special Promotional Bundles/i)
    ).toBeInTheDocument();
    expect(screen.getByText("Diwali Mega Combo")).toBeInTheDocument();
    expect(
      screen.getByText("Includes Package: Basic Glow")
    ).toBeInTheDocument();

    expect(
      screen.queryByText("Unreleased Secret Bundle")
    ).not.toBeInTheDocument();
  });
});

describe("Ticket 5 — Admin Bundle Management CRUD (/admin/bundles)", () => {
  test("redirects unauthenticated user from /admin/bundles to /admin/login", async () => {
    const { client } = createBundlesSupabaseClient({ isAdmin: false });
    renderApp(["/admin/bundles"], client);

    expect(
      await screen.findByText(/Sign in with your administrator account/i)
    ).toBeInTheDocument();
  });

  test("validates required package selection, creates bundle with promotional price, and archives bundle", async () => {
    const {
      client,
      bundleInsertMock,
      bundlePackagesInsertMock,
      bundleUpdateMock,
    } = createBundlesSupabaseClient({ isAdmin: true });

    renderApp(["/admin/bundles"], client);

    expect(
      await screen.findByRole("heading", { name: "Diwali Mega Combo" })
    ).toBeInTheDocument();

    const nameInput = screen.getByLabelText(/Bundle Name/i);
    const priceInput = screen.getByLabelText(/Promotional Price in INR/i);

    await userEvent.type(nameInput, "Bridal Glow Duo");
    await userEvent.type(priceInput, "2499");
    await userEvent.click(
      screen.getByRole("button", { name: /Create Bundle/i })
    );

    // Validation fails because no package was added; input values are preserved
    expect(
      await screen.findByText(/Select at least one package for this bundle/i)
    ).toBeInTheDocument();
    expect(nameInput).toHaveValue("Bridal Glow Duo");
    expect(bundleInsertMock).not.toHaveBeenCalled();

    // Select two packages and add them
    const pkgSelect = screen.getByLabelText(/Select Package to Add/i);
    await userEvent.click(pkgSelect);
    await userEvent.click(
      await screen.findByRole("option", { name: /Radiant Refresh/i })
    );
    await userEvent.click(screen.getByRole("button", { name: /^Add$/i }));

    await userEvent.click(pkgSelect);
    await userEvent.click(
      await screen.findByRole("option", { name: /Royal Treatment/i })
    );
    await userEvent.click(screen.getByRole("button", { name: /^Add$/i }));

    expect(screen.getByText(/1\. Radiant Refresh/i)).toBeInTheDocument();
    expect(screen.getByText(/2\. Royal Treatment/i)).toBeInTheDocument();
    // Sum of 1099 + 1999 = 3098; promo = 2499 -> customer saves ₹599
    expect(screen.getByText(/Customer saves/i)).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: /Create Bundle/i })
    );

    await waitFor(() => {
      expect(bundleInsertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Bridal Glow Duo",
          price_inr: 2499,
        })
      );
    });
    expect(bundlePackagesInsertMock).toHaveBeenCalledWith([
      expect.objectContaining({
        bundle_id: "bnd-created-1",
        package_id: "pkg-radiant",
        display_order: 1,
      }),
      expect.objectContaining({
        bundle_id: "bnd-created-1",
        package_id: "pkg-royal",
        display_order: 2,
      }),
    ]);

    expect(await screen.findByRole("status")).toHaveTextContent(
      /Created bundle "Bridal Glow Duo"/i
    );

    // Archive Diwali Mega Combo
    await userEvent.click(
      screen.getByRole("button", { name: /Archive Diwali Mega Combo/i })
    );
    expect(
      await screen.findByRole("heading", { name: /Archive Bundle\?/i })
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: /Confirm Archive/i })
    );

    await waitFor(() => {
      expect(bundleUpdateMock).toHaveBeenCalledWith({ status: "archived" });
    });
    expect(await screen.findByRole("status")).toHaveTextContent(
      /Archived bundle "Diwali Mega Combo"/i
    );
  });
});

