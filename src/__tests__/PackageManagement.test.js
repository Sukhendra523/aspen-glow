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
  formatPackageServiceLine,
  validatePackageInput,
} from "../services/packageService";
import { AuthProvider } from "../context/AuthContext";
import { AppRoutes } from "../App";

const SEED_SERVICES = [
  {
    id: "svc-facial",
    name: "Facial Cleanup",
    category: "Beauty & Skincare",
    description: "",
    inclusions: [],
    price_inr: 399,
    price_label: "",
    icon_name: "AutoAwesome",
    display_order: 1,
    status: "published",
  },
  {
    id: "svc-wax",
    name: "Full Hand Waxing",
    category: "Beauty & Skincare",
    description: "",
    inclusions: [],
    price_inr: 250,
    price_label: "",
    icon_name: "AutoAwesome",
    display_order: 2,
    status: "published",
  },
  {
    id: "svc-thread",
    name: "Threading",
    category: "Beauty & Skincare",
    description: "",
    inclusions: [],
    price_inr: 50,
    price_label: "",
    icon_name: "AutoAwesome",
    display_order: 3,
    status: "published",
  },
  {
    id: "svc-makeup-pub",
    name: "Signature Cocktail Makeup",
    category: "Makeup & Styling",
    description: "Evening party makeup",
    inclusions: ["Airbrush Base", "Hairstyling"],
    price_inr: 2199,
    price_label: "",
    icon_name: "ColorLens",
    display_order: 1,
    status: "published",
  },
  {
    id: "svc-makeup-draft",
    name: "Unreleased Secret Makeup",
    category: "Makeup & Styling",
    description: "Draft only",
    inclusions: ["Secret"],
    price_inr: 9999,
    price_label: "",
    icon_name: "ColorLens",
    display_order: 2,
    status: "draft",
  },
];

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
        service: {
          id: "svc-facial",
          name: "Facial Cleanup",
          price_inr: 399,
        },
      },
      {
        id: "ps-2",
        service_id: "svc-thread",
        display_order: 2,
        inclusion_note: "🎉 Free",
        service: {
          id: "svc-thread",
          name: "Threading",
          price_inr: 50,
        },
      },
    ],
  },
  {
    id: "pkg-draft",
    name: "Secret Draft Package",
    description: "Should not appear on public page",
    price_inr: 1599,
    icon_name: "Star",
    display_order: 2,
    status: "draft",
    package_services: [],
  },
];

function createPackagesSupabaseClient({
  isAdmin = true,
  servicesRows = SEED_SERVICES,
  packagesRows = SEED_PACKAGES,
} = {}) {
  const session = isAdmin
    ? { user: { id: "admin-1", email: "shilpi@aspenglow.in" } }
    : null;

  let currentPackages = [...packagesRows];

  const packageInsertMock = jest.fn((payload) => ({
    select: jest.fn(() => ({
      single: jest.fn().mockImplementation(async () => {
        const created = {
          id: "pkg-created-1",
          ...payload,
          package_services: [],
        };
        currentPackages.push(created);
        return { data: { id: created.id }, error: null };
      }),
    })),
  }));

  const packageUpdateMock = jest.fn((payload) => ({
    eq: jest.fn((col, id) => {
      currentPackages = currentPackages.map((pkg) =>
        pkg.id === id ? { ...pkg, ...payload } : pkg
      );
      return {
        select: jest.fn(() => ({
          single: jest.fn().mockImplementation(async () => ({
            data: currentPackages.find((p) => p.id === id) || null,
            error: null,
          })),
        })),
        then: (resolve) => resolve({ data: null, error: null }),
      };
    }),
  }));

  const packageServicesInsertMock = jest
    .fn()
    .mockImplementation(async (rows) => {
      if (Array.isArray(rows) && rows.length > 0) {
        const pkgId = rows[0].package_id;
        const hydrated = rows.map((r, i) => ({
          id: `ps-new-${i}`,
          ...r,
          service: servicesRows.find((s) => s.id === r.service_id) || null,
        }));
        currentPackages = currentPackages.map((pkg) =>
          pkg.id === pkgId ? { ...pkg, package_services: hydrated } : pkg
        );
      }
      return { data: rows, error: null };
    });

  const packageServicesDeleteMock = jest.fn(() => ({
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
      if (table === "services") {
        return {
          select: jest.fn(() => buildListChain(() => servicesRows)),
        };
      }
      if (table === "packages") {
        return {
          select: jest.fn(() => buildListChain(() => currentPackages)),
          insert: packageInsertMock,
          update: packageUpdateMock,
        };
      }
      if (table === "package_services") {
        return {
          insert: packageServicesInsertMock,
          delete: packageServicesDeleteMock,
        };
      }
      return {};
    }),
  };

  return {
    client,
    packageInsertMock,
    packageUpdateMock,
    packageServicesInsertMock,
  };
}

function renderApp(initialEntries = ["/admin/packages"], client = null) {
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

describe("Ticket 4 — Package Domain & Validation Rules", () => {
  test("formats package service lines with optional inclusion notes", () => {
    expect(
      formatPackageServiceLine({
        service: { name: "Threading" },
        inclusion_note: "🎉 Free",
      })
    ).toBe("Threading 🎉 Free");
    expect(
      formatPackageServiceLine({
        service: { name: "Facial Cleanup" },
        inclusion_note: "",
      })
    ).toBe("Facial Cleanup");
  });

  test("validates standalone package price, requires at least one service, and rejects duplicate services", () => {
    const emptyServicesResult = validatePackageInput({
      name: "Festive Glow",
      price_inr: "999",
      icon_name: "Star",
      display_order: "1",
      status: "published",
      service_items: [],
    });
    expect(emptyServicesResult.valid).toBe(false);
    expect(emptyServicesResult.errors.service_items).toMatch(
      /at least one service/i
    );

    const duplicateResult = validatePackageInput({
      name: "Festive Glow",
      price_inr: "999",
      icon_name: "Star",
      display_order: "1",
      status: "published",
      service_items: [
        { service_id: "svc-facial", inclusion_note: "" },
        { service_id: "svc-facial", inclusion_note: "Bonus" },
      ],
    });
    expect(duplicateResult.valid).toBe(false);
    expect(duplicateResult.errors.service_items).toMatch(/only be added once/i);
  });
});

describe("Ticket 4 — Public Catalogue Cutover (Services & Packages)", () => {
  test("renders published database services and packages on / while excluding drafts", async () => {
    const { client } = createPackagesSupabaseClient({ isAdmin: false });
    renderApp(["/"], client);

    expect(
      await screen.findByText("Signature Cocktail Makeup")
    ).toBeInTheDocument();
    expect(screen.getByText("Basic Glow")).toBeInTheDocument();
    expect(screen.getByText("Threading 🎉 Free")).toBeInTheDocument();

    expect(
      screen.queryByText("Unreleased Secret Makeup")
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Secret Draft Package")).not.toBeInTheDocument();
  });
});

describe("Ticket 4 — Admin Package Management CRUD (/admin/packages)", () => {
  test("redirects unauthenticated user from /admin/packages to /admin/login", async () => {
    const { client } = createPackagesSupabaseClient({ isAdmin: false });
    renderApp(["/admin/packages"], client);

    expect(
      await screen.findByText(/Sign in with your administrator account/i)
    ).toBeInTheDocument();
  });

  test("validates required service selection, creates package with standalone price, and archives package", async () => {
    const {
      client,
      packageInsertMock,
      packageServicesInsertMock,
      packageUpdateMock,
    } = createPackagesSupabaseClient({ isAdmin: true });

    renderApp(["/admin/packages"], client);

    expect(
      await screen.findByRole("heading", { name: "Basic Glow" })
    ).toBeInTheDocument();

    const nameInput = screen.getByLabelText(/Package Name/i);
    const priceInput = screen.getByLabelText(/Package Price in INR/i);

    await userEvent.type(nameInput, "Karwa Chauth Glow");
    await userEvent.type(priceInput, "899");
    await userEvent.click(
      screen.getByRole("button", { name: /Create Package/i })
    );

    // Fails validation because no service was added yet; preserves input values
    expect(
      await screen.findByText(/Select at least one service for this package/i)
    ).toBeInTheDocument();
    expect(nameInput).toHaveValue("Karwa Chauth Glow");
    expect(packageInsertMock).not.toHaveBeenCalled();

    // Select a service and add it
    const serviceSelect = screen.getByLabelText(/Select Service to Add/i);
    await userEvent.click(serviceSelect);
    await userEvent.click(
      await screen.findByRole("option", { name: /Facial Cleanup/i })
    );

    const noteInput = screen.getByLabelText(/Inclusion Note \(optional\)/i);
    await userEvent.type(noteInput, "Glow Special");
    await userEvent.click(screen.getByRole("button", { name: /^Add$/i }));

    expect(screen.getByText(/1\. Facial Cleanup/i)).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: /Create Package/i })
    );

    await waitFor(() => {
      expect(packageInsertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Karwa Chauth Glow",
          price_inr: 899,
        })
      );
    });
    expect(packageServicesInsertMock).toHaveBeenCalledWith([
      expect.objectContaining({
        package_id: "pkg-created-1",
        service_id: "svc-facial",
        display_order: 1,
        inclusion_note: "Glow Special",
      }),
    ]);

    expect(await screen.findByRole("status")).toHaveTextContent(
      /Created package "Karwa Chauth Glow"/i
    );

    // Archive Basic Glow
    await userEvent.click(
      screen.getByRole("button", { name: /Archive Basic Glow/i })
    );
    expect(
      await screen.findByRole("heading", { name: /Archive Package\?/i })
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: /Confirm Archive/i })
    );

    await waitFor(() => {
      expect(packageUpdateMock).toHaveBeenCalledWith({ status: "archived" });
    });
    expect(await screen.findByRole("status")).toHaveTextContent(
      /Archived package "Basic Glow"/i
    );
  });
});

