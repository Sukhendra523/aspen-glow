import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "@mui/material";
import theme from "../constants/theme";
import {
  formatInrPrice,
  parseInclusionsInput,
} from "../constants/serviceCatalogue";
import { validateServiceInput } from "../services/serviceCatalogueService";
import { AuthProvider } from "../context/AuthContext";
import { AppRoutes } from "../App";

const INITIAL_SERVICES = [
  {
    id: "svc-1",
    name: "Light Party Makeup",
    category: "Makeup & Styling",
    description: "Subtle party look",
    inclusions: ["Light Party Makeup", "Hairstyle", "Saree Draping"],
    price_inr: 1199,
    price_label: "",
    icon_name: "ColorLens",
    display_order: 1,
    status: "published",
  },
  {
    id: "svc-2",
    name: "Step Cut",
    category: "Hair Services",
    description: "",
    inclusions: [],
    price_inr: 350,
    price_label: "",
    icon_name: "ContentCut",
    display_order: 1,
    status: "draft",
  },
];

function createServicesSupabaseClient({
  isAdmin = true,
  servicesRows = INITIAL_SERVICES,
  insertError = null,
  updateError = null,
} = {}) {
  const session = isAdmin
    ? { user: { id: "admin-1", email: "shilpi@aspenglow.in" } }
    : null;

  const insertMock = jest.fn((payload) => ({
    select: jest.fn(() => ({
      single: jest.fn().mockResolvedValue({
        data: insertError ? null : { id: "svc-new-1", ...payload },
        error: insertError,
      }),
    })),
  }));

  const updateMock = jest.fn((payload) => ({
    eq: jest.fn((col, id) => ({
      select: jest.fn(() => ({
        single: jest.fn().mockResolvedValue({
          data: updateError
            ? null
            : {
                ...(servicesRows.find((s) => s.id === id) || {}),
                ...payload,
                id,
              },
          error: updateError,
        }),
      })),
    })),
  }));

  const buildOrderChain = (rows) => {
    const chain = {
      order: jest.fn(() => chain),
      eq: jest.fn(() => chain),
      then: (resolve) => resolve({ data: rows, error: null }),
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
      if (table === "services") {
        return {
          select: jest.fn(() => buildOrderChain(servicesRows)),
          insert: insertMock,
          update: updateMock,
        };
      }
      return {};
    }),
  };

  return { client, insertMock, updateMock };
}

function renderApp(initialEntries = ["/admin/services"], client = null) {
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

describe("Ticket 3 — Service Domain & Validation Rules", () => {
  test("formats integer INR prices and optional prefix labels", () => {
    expect(formatInrPrice(1199)).toBe("₹1,199");
    expect(formatInrPrice(99, "Starting from just")).toBe(
      "Starting from just ₹99"
    );
    expect(parseInclusionsInput("Makeup\n\nHairstyle\nSaree Draping")).toEqual([
      "Makeup",
      "Hairstyle",
      "Saree Draping",
    ]);
  });

  test("rejects decimal or negative prices, empty names, and invalid categories", () => {
    const decimalResult = validateServiceInput({
      name: "Bridal Makeup",
      category: "Bridal & Pre-Bridal",
      price_inr: "1999.50",
      icon_name: "Star",
      display_order: "1",
      status: "published",
    });
    expect(decimalResult.valid).toBe(false);
    expect(decimalResult.errors.price_inr).toMatch(/whole number in INR/i);

    const missingResult = validateServiceInput({
      name: "   ",
      category: "Invalid Category",
      price_inr: "-100",
    });
    expect(missingResult.valid).toBe(false);
    expect(missingResult.errors.name).toMatch(/required/i);
    expect(missingResult.errors.category).toMatch(/valid service category/i);
    expect(missingResult.errors.price_inr).toMatch(/whole number in INR/i);
  });
});

describe("Ticket 3 — Admin Service Catalogue CRUD (/admin/services)", () => {
  test("redirects unauthenticated user from /admin/services to /admin/login", async () => {
    const { client } = createServicesSupabaseClient({ isAdmin: false });
    renderApp(["/admin/services"], client);

    expect(
      await screen.findByText(/Sign in with your administrator account/i)
    ).toBeInTheDocument();
  });

  test("renders service list, filters by search query, and shows empty state when no service matches", async () => {
    const { client } = createServicesSupabaseClient({ isAdmin: true });
    renderApp(["/admin/services"], client);

    expect(
      await screen.findByRole("heading", { name: "Light Party Makeup" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Step Cut" })
    ).toBeInTheDocument();

    const searchInput = screen.getByLabelText(/Search Services/i);
    await userEvent.type(searchInput, "NonExistentServiceXYZ");

    expect(
      await screen.findByText(/No services match the current filters/i)
    ).toBeInTheDocument();
  });

  test("validates new service input, preserves values on error, and creates service", async () => {
    const { client, insertMock } = createServicesSupabaseClient({
      isAdmin: true,
    });
    renderApp(["/admin/services"], client);

    const nameInput = await screen.findByLabelText(/Service Name/i);
    const priceInput = screen.getByLabelText(/Price in INR/i);
    const inclusionsInput = screen.getByLabelText(/Inclusions/i);

    await userEvent.type(nameInput, "HD Reception Makeup");
    await userEvent.type(priceInput, "4999.99");
    await userEvent.click(
      screen.getByRole("button", { name: /Create Service/i })
    );

    expect(
      await screen.findByText(/Price must be a whole number in INR/i)
    ).toBeInTheDocument();
    expect(nameInput).toHaveValue("HD Reception Makeup");
    expect(insertMock).not.toHaveBeenCalled();

    await userEvent.clear(priceInput);
    await userEvent.type(priceInput, "4999");
    await userEvent.type(inclusionsInput, "HD Makeup\nHairstyling");
    await userEvent.click(
      screen.getByRole("button", { name: /Create Service/i })
    );

    await waitFor(() => {
      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "HD Reception Makeup",
          price_inr: 4999,
          inclusions: ["HD Makeup", "Hairstyling"],
        })
      );
    });

    expect(await screen.findByRole("status")).toHaveTextContent(
      /Created service "HD Reception Makeup"/i
    );
    expect(
      screen.getByRole("heading", { name: "HD Reception Makeup" })
    ).toBeInTheDocument();
  });

  test("edits an existing service and archives a service via confirmation dialog", async () => {
    const { client, updateMock } = createServicesSupabaseClient({
      isAdmin: true,
    });
    renderApp(["/admin/services"], client);

    const editBtn = await screen.findByRole("button", {
      name: /Edit Light Party Makeup/i,
    });
    await userEvent.click(editBtn);

    const priceInput = screen.getByLabelText(/Price in INR/i);
    expect(priceInput).toHaveValue("1199");

    await userEvent.clear(priceInput);
    await userEvent.type(priceInput, "1299");
    await userEvent.click(
      screen.getByRole("button", { name: /Update Service/i })
    );

    await waitFor(() => {
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Light Party Makeup",
          price_inr: 1299,
        })
      );
    });
    expect(await screen.findByRole("status")).toHaveTextContent(
      /Updated service "Light Party Makeup"/i
    );

    // Archive Step Cut
    await userEvent.click(
      screen.getByRole("button", { name: /Archive Step Cut/i })
    );
    expect(
      await screen.findByRole("heading", { name: /Archive Service\?/i })
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: /Confirm Archive/i })
    );

    await waitFor(() => {
      expect(updateMock).toHaveBeenCalledWith({ status: "archived" });
    });
    expect(await screen.findByRole("status")).toHaveTextContent(
      /Archived service "Step Cut"/i
    );
    expect(screen.getByText("Status: Archived")).toBeInTheDocument();
  });
});

