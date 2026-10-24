import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "@mui/material";
import theme from "../constants/theme";
import { DEFAULT_FESTIVALS } from "../poster/posterTemplates";
import { AuthProvider } from "../context/AuthContext";
import { AppRoutes } from "../App";

function createFestivalSupabaseClient({ isAdmin = true } = {}) {
  const session = isAdmin
    ? { user: { id: "admin-1", email: "shilpi@aspenglow.in" } }
    : null;

  let currentFestivals = DEFAULT_FESTIVALS.map((f) => ({
    ...f,
    status: "active",
  }));

  let newFestCounter = 0;
  const insertMock = jest.fn((payload) => ({
    select: jest.fn(() => ({
      single: jest.fn().mockImplementation(async () => {
        newFestCounter += 1;
        const created = { id: `fest-new-${newFestCounter}`, ...payload };
        currentFestivals = [
          ...currentFestivals.filter((f) => f.id !== created.id),
          created,
        ];
        return { data: created, error: null };
      }),
    })),
  }));

  const updateMock = jest.fn((payload) => ({
    eq: jest.fn((_col, id) => ({
      select: jest.fn(() => ({
        single: jest.fn().mockImplementation(async () => {
          currentFestivals = currentFestivals.map((f) =>
            f.id === id ? { ...f, ...payload } : f
          );
          const updated = currentFestivals.find((f) => f.id === id);
          return { data: updated, error: null };
        }),
      })),
    })),
  }));

  const buildListChain = (getRows) => {
    const chain = {
      order: jest.fn(() => chain),
      eq: jest.fn(() => chain),
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
      if (table === "festivals") {
        return {
          select: jest.fn(() => buildListChain(() => currentFestivals)),
          insert: insertMock,
          update: updateMock,
        };
      }
      return {};
    }),
  };

  return { client, insertMock, updateMock };
}

function renderApp(initialEntries = ["/admin/festivals"], client = null) {
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

describe("Ticket 13 — Festival Management CRUD (/admin/festivals)", () => {
  jest.setTimeout(30000);

  test("redirects unauthenticated user from /admin/festivals to /admin/login", async () => {
    const { client } = createFestivalSupabaseClient({ isAdmin: false });
    renderApp(["/admin/festivals"], client);

    expect(
      await screen.findByText(/Sign in with your administrator account/i)
    ).toBeInTheDocument();
  });

  test("lists seeded festivals, creates a new festival, edits an existing festival, and archives a festival", async () => {
    const { client, insertMock, updateMock } = createFestivalSupabaseClient({
      isAdmin: true,
    });
    renderApp(["/admin/festivals"], client);

    expect(await screen.findByText("Karwa Chauth")).toBeInTheDocument();
    expect(screen.getByText("Diwali")).toBeInTheDocument();
    expect(screen.getByText("Teej")).toBeInTheDocument();

    // Create a new festival
    await userEvent.type(
      screen.getByLabelText(/Festival Name/i),
      "Lohri"
    );
    await userEvent.type(
      screen.getByLabelText(/Default Headline/i),
      "Lohri Winter Glow Special"
    );
    await userEvent.click(
      screen.getByRole("button", { name: /Create Festival/i })
    );

    await waitFor(() => {
      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Lohri",
          default_headline: "Lohri Winter Glow Special",
          active: true,
        })
      );
    });

    expect(
      await screen.findByText(/Created festival "Lohri"/i)
    ).toBeInTheDocument();

    // Edit an existing festival ("Teej")
    await userEvent.click(
      screen.getByRole("button", { name: /Edit Teej/i })
    );
    const headlineField = screen.getByLabelText(/Default Headline/i);
    await userEvent.clear(headlineField);
    await userEvent.type(headlineField, "Hariyali Teej Royal Glow Offer");
    await userEvent.click(
      screen.getByRole("button", { name: /Update Festival/i })
    );

    await waitFor(() => {
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Teej",
          default_headline: "Hariyali Teej Royal Glow Offer",
        })
      );
    });

    // Archive "Diwali"
    await userEvent.click(
      screen.getByRole("button", { name: /Archive Diwali/i })
    );
    expect(
      await screen.findByRole("heading", { name: /Archive Festival\?/i })
    ).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: /Confirm Archive/i })
    );

    await waitFor(() => {
      expect(updateMock).toHaveBeenCalledWith({ active: false });
    });
  });
});

