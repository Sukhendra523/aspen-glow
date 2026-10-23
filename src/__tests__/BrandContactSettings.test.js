import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "@mui/material";
import theme from "../constants/theme";
import {
  DEFAULT_BRAND_SETTINGS,
  DEFAULT_CONTACT_SETTINGS,
  getSafeExternalUrl,
  getSafeTelHref,
  getSafeWhatsAppHref,
} from "../constants/defaultSettings";
import {
  validateBrandSettingsInput,
  validateContactSettingsInput,
} from "../services/settingsService";
import { AuthProvider } from "../context/AuthContext";
import { AppRoutes } from "../App";

function createSettingsSupabaseClient({
  isAdmin = true,
  brandRow = { ...DEFAULT_BRAND_SETTINGS },
  contactRow = { ...DEFAULT_CONTACT_SETTINGS },
  brandSaveResult = null,
  contactSaveResult = null,
  brandSaveError = null,
  contactSaveError = null,
} = {}) {
  const session = isAdmin
    ? { user: { id: "admin-1", email: "shilpi@aspenglow.in" } }
    : null;

  const brandUpsertMock = jest.fn(() => ({
    select: jest.fn(() => ({
      single: jest.fn().mockResolvedValue({
        data: brandSaveError
          ? null
          : brandSaveResult || { ...DEFAULT_BRAND_SETTINGS, ...brandRow },
        error: brandSaveError,
      }),
    })),
  }));

  const contactUpsertMock = jest.fn(() => ({
    select: jest.fn(() => ({
      single: jest.fn().mockResolvedValue({
        data: contactSaveError
          ? null
          : contactSaveResult || { ...DEFAULT_CONTACT_SETTINGS, ...contactRow },
        error: contactSaveError,
      }),
    })),
  }));

  const buildSelectChain = (row) => {
    const chain = {
      eq: jest.fn((column, value) => {
        if (column === "status" && row && row.status !== value) {
          return {
            maybeSingle: jest
              .fn()
              .mockResolvedValue({ data: null, error: null }),
          };
        }
        return chain;
      }),
      maybeSingle: jest.fn().mockResolvedValue({ data: row, error: null }),
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
          select: jest.fn(() => buildSelectChain(brandRow)),
          upsert: brandUpsertMock,
        };
      }
      if (table === "contact_settings") {
        return {
          select: jest.fn(() => buildSelectChain(contactRow)),
          upsert: contactUpsertMock,
        };
      }
      return {};
    }),
  };

  return { client, brandUpsertMock, contactUpsertMock };
}

function renderApp(initialEntries = ["/"], client = null) {
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

describe("Ticket 2 — Brand & Contact Settings Validation & Helpers", () => {
  test("validates brand settings hex colors and required names", () => {
    const invalid = validateBrandSettingsInput({
      ...DEFAULT_BRAND_SETTINGS,
      brand_name: "",
      primary_color: "pink",
      logo_url: "javascript:alert(1)",
    });

    expect(invalid.valid).toBe(false);
    expect(invalid.errors.brand_name).toMatch(/required/i);
    expect(invalid.errors.primary_color).toMatch(/6-digit hex/i);
    expect(invalid.errors.logo_url).toMatch(/valid http/i);
  });

  test("validates contact settings phone, whatsapp, address, and booking URL", () => {
    const invalid = validateContactSettingsInput({
      ...DEFAULT_CONTACT_SETTINGS,
      phone: "123",
      whatsapp: "abc",
      booking_url: "javascript:evil()",
    });

    expect(invalid.valid).toBe(false);
    expect(invalid.errors.phone).toMatch(/valid phone/i);
    expect(invalid.errors.whatsapp).toMatch(/valid WhatsApp/i);
    expect(invalid.errors.booking_url).toMatch(/valid http/i);
  });

  test("sanitizes external URLs, tel links, and WhatsApp links", () => {
    expect(getSafeExternalUrl("https://cal.com/aspen-glow")).toBe(
      "https://cal.com/aspen-glow"
    );
    expect(getSafeExternalUrl("javascript:alert(1)")).toBe("");
    expect(getSafeTelHref("+91 70114-13546")).toBe("tel:+917011413546");
    expect(getSafeWhatsAppHref("+91 70114-13546")).toBe(
      "https://wa.me/917011413546"
    );
  });
});

describe("Ticket 2 — Public Website Cutover & Safe Fallback", () => {
  test("renders published brand and contact settings from database on public home page", async () => {
    const { client } = createSettingsSupabaseClient({
      isAdmin: false,
      brandRow: {
        ...DEFAULT_BRAND_SETTINGS,
        brand_name: "Aspen Glow Royal Studio",
        short_name: "Aspen Royal",
        tagline: "Festive Bridal & Beauty Lounge",
        status: "published",
      },
      contactRow: {
        ...DEFAULT_CONTACT_SETTINGS,
        contact_name: "Shilpi C.",
        phone: "9876543210",
        address: "801 Aspen Tower, Greater Noida",
        booking_url: "https://booking.aspenglow.in",
        status: "published",
      },
    });

    renderApp(["/"], client);

    expect(
      await screen.findByText(/Festive Bridal & Beauty Lounge/i)
    ).toBeInTheDocument();
    expect(screen.getByText("Aspen Royal")).toBeInTheDocument();
    expect(screen.getByText(/Contact: Shilpi C\./i)).toBeInTheDocument();
    expect(screen.getByText("9876543210")).toBeInTheDocument();
    expect(
      screen.getByText(/801 Aspen Tower, Greater Noida/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Book Online/i })
    ).toHaveAttribute("href", "https://booking.aspenglow.in");
  });

  test("does not expose draft settings on public home page and falls back to defaults", async () => {
    const { client } = createSettingsSupabaseClient({
      isAdmin: false,
      brandRow: {
        ...DEFAULT_BRAND_SETTINGS,
        tagline: "Unreleased Secret Draft Tagline",
        status: "draft",
      },
      contactRow: {
        ...DEFAULT_CONTACT_SETTINGS,
        address: "Unreleased Draft Address",
        status: "draft",
      },
    });

    renderApp(["/"], client);

    expect(
      await screen.findByText(
        /Bringing the Salon Experience at DevSai Sports Home/i
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Unreleased Secret Draft Tagline/i)
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Unreleased Draft Address/i)
    ).not.toBeInTheDocument();
  });
});

describe("Ticket 2 — Admin Brand & Contact Settings Module", () => {
  test("redirects unauthenticated user from /admin/settings to /admin/login", async () => {
    const { client } = createSettingsSupabaseClient({ isAdmin: false });
    renderApp(["/admin/settings"], client);

    expect(
      await screen.findByText(/Sign in with your administrator account/i)
    ).toBeInTheDocument();
  });

  test("shows unsaved changes indicator, validates inputs, and saves brand and contact settings", async () => {
    const { client, brandUpsertMock, contactUpsertMock } =
      createSettingsSupabaseClient({
        isAdmin: true,
        brandSaveResult: {
          ...DEFAULT_BRAND_SETTINGS,
          tagline: "Updated Salon Tagline",
        },
        contactSaveResult: {
          ...DEFAULT_CONTACT_SETTINGS,
          phone: "9988776655",
        },
      });

    renderApp(["/admin/settings"], client);

    const taglineInput = await screen.findByLabelText(/Hero Tagline/i);
    expect(taglineInput).toHaveValue(DEFAULT_BRAND_SETTINGS.tagline);

    await userEvent.clear(taglineInput);
    await userEvent.type(taglineInput, "Updated Salon Tagline");

    expect(screen.getByText(/Unsaved changes/i)).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: /Save Brand Settings/i })
    );

    expect(await screen.findByRole("status")).toHaveTextContent(
      /Brand settings saved/i
    );
    expect(brandUpsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 1,
        tagline: "Updated Salon Tagline",
      }),
      { onConflict: "id" }
    );

    // Update contact phone
    const phoneInput = screen.getByLabelText(/Phone Number/i);
    await userEvent.clear(phoneInput);
    await userEvent.type(phoneInput, "9988776655");

    await userEvent.click(
      screen.getByRole("button", { name: /Save Contact Settings/i })
    );

    await waitFor(() => {
      expect(contactUpsertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          phone: "9988776655",
        }),
        { onConflict: "id" }
      );
    });
    expect(screen.getByText(/Contact settings saved/i)).toBeInTheDocument();
  });

  test("preserves form input values and displays safe error when server save fails", async () => {
    const { client } = createSettingsSupabaseClient({
      isAdmin: true,
      brandSaveError: new Error("RLS violation"),
    });

    renderApp(["/admin/settings"], client);

    const shortNameInput = await screen.findByLabelText(
      /Short Navigation Name/i
    );
    await userEvent.clear(shortNameInput);
    await userEvent.type(shortNameInput, "Aspen Luxe");

    await userEvent.click(
      screen.getByRole("button", { name: /Save Brand Settings/i })
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /Unable to save settings right now/i
    );
    expect(shortNameInput).toHaveValue("Aspen Luxe");
  });
});

