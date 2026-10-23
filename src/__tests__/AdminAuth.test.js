import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "@mui/material";
import theme from "../constants/theme";
import { AuthProvider } from "../context/AuthContext";
import { AppRoutes } from "../App";

function createFakeSupabaseClient({
  initialSession = null,
  signInResult = { data: { session: null }, error: new Error("Invalid login") },
  profileRow = null,
  profileError = null,
  updateUserError = null,
} = {}) {
  const signOutMock = jest.fn().mockResolvedValue({ error: null });
  const resetPasswordMock = jest.fn().mockResolvedValue({ data: {}, error: null });
  const updateUserMock = jest
    .fn()
    .mockResolvedValue({ data: { user: {} }, error: updateUserError });

  const client = {
    auth: {
      getSession: jest
        .fn()
        .mockResolvedValue({ data: { session: initialSession }, error: null }),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
      signInWithPassword: jest.fn().mockResolvedValue(signInResult),
      signOut: signOutMock,
      resetPasswordForEmail: resetPasswordMock,
      updateUser: updateUserMock,
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          maybeSingle: jest
            .fn()
            .mockResolvedValue({ data: profileRow, error: profileError }),
        })),
      })),
    })),
  };

  return {
    client,
    signOutMock,
    resetPasswordMock,
    updateUserMock,
  };
}

function renderWithRouter(initialEntries = ["/"], client = null) {
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

describe("Ticket 1 — Public Access & Admin Authentication", () => {
  test("renders public website at / without requiring authentication", () => {
    renderWithRouter(["/"], null);
    expect(
      screen.getByText(/Bringing the Salon Experience at DevSai Sports Home/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Our Exclusive Services/i)).toBeInTheDocument();
  });

  test("redirects unauthenticated user from /admin to /admin/login", async () => {
    const { client } = createFakeSupabaseClient({ initialSession: null });
    renderWithRouter(["/admin"], client);

    expect(
      await screen.findByText(/Sign in with your administrator account/i)
    ).toBeInTheDocument();
  });

  test("validates required email and password fields on login submit", async () => {
    const { client } = createFakeSupabaseClient();
    renderWithRouter(["/admin/login"], client);

    const signInButton = await screen.findByRole("button", {
      name: /sign in/i,
    });
    await userEvent.click(signInButton);

    expect(await screen.findByText(/Email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/Password is required/i)).toBeInTheDocument();
  });

  test("shows safe error message and preserves email when credentials are invalid", async () => {
    const { client } = createFakeSupabaseClient({
      signInResult: {
        data: { session: null },
        error: { message: "Invalid login credentials" },
      },
    });
    renderWithRouter(["/admin/login"], client);

    const emailInput = await screen.findByLabelText(/Email Address/i);
    const passwordInput = screen.getByLabelText(/Password/i);

    await userEvent.type(emailInput, "shilpi@example.com");
    await userEvent.type(passwordInput, "wrong-password");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /Invalid email or password/i
    );
    expect(emailInput).toHaveValue("shilpi@example.com");
  });

  test("denies access and signs out authenticated user who does not have active admin role", async () => {
    const fakeSession = {
      user: { id: "user-viewer-1", email: "visitor@example.com" },
    };
    const { client, signOutMock } = createFakeSupabaseClient({
      signInResult: { data: { session: fakeSession }, error: null },
      profileRow: {
        id: "user-viewer-1",
        email: "visitor@example.com",
        display_name: "Visitor",
        role: "viewer",
        status: "active",
      },
    });

    renderWithRouter(["/admin/login"], client);

    await userEvent.type(
      await screen.findByLabelText(/Email Address/i),
      "visitor@example.com"
    );
    await userEvent.type(screen.getByLabelText(/Password/i), "validpass123");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /not authorized as an active administrator/i
    );
    expect(signOutMock).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/Owner Dashboard/i)).not.toBeInTheDocument();
  });

  test("allows active admin to sign in, view dashboard, and sign out", async () => {
    const adminSession = {
      user: { id: "admin-1", email: "shilpi@aspenglow.in" },
    };
    const { client, signOutMock } = createFakeSupabaseClient({
      signInResult: { data: { session: adminSession }, error: null },
      profileRow: {
        id: "admin-1",
        email: "shilpi@aspenglow.in",
        display_name: "Shilpi Chauhan",
        role: "admin",
        status: "active",
      },
    });

    renderWithRouter(["/admin/login"], client);

    await userEvent.type(
      await screen.findByLabelText(/Email Address/i),
      "shilpi@aspenglow.in"
    );
    await userEvent.type(screen.getByLabelText(/Password/i), "StrongPass123!");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(
      await screen.findByRole("heading", { name: /Owner Dashboard/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Welcome back, Shilpi Chauhan/i)
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /sign out/i }));
    await waitFor(() => {
      expect(signOutMock).toHaveBeenCalledTimes(1);
    });
    expect(
      await screen.findByText(/Sign in with your administrator account/i)
    ).toBeInTheDocument();
  });

  test("requests password reset and shows non-enumerating confirmation message", async () => {
    const { client, resetPasswordMock } = createFakeSupabaseClient();
    renderWithRouter(["/admin/login"], client);

    await userEvent.click(
      await screen.findByRole("button", { name: /forgot password\?/i })
    );

    const emailInput = screen.getByLabelText(/Email Address/i);
    await userEvent.type(emailInput, "shilpi@aspenglow.in");
    await userEvent.click(
      screen.getByRole("button", { name: /send reset link/i })
    );

    expect(await screen.findByRole("status")).toHaveTextContent(
      /If an administrator account exists for this email, a password reset link has been sent/i
    );
    expect(resetPasswordMock).toHaveBeenCalledWith(
      "shilpi@aspenglow.in",
      expect.objectContaining({
        redirectTo: expect.stringContaining("/admin/reset-password"),
      })
    );
  });

  test("validates password length and match on /admin/reset-password and updates password", async () => {
    const adminSession = {
      user: { id: "admin-1", email: "shilpi@aspenglow.in" },
    };
    const { client, updateUserMock } = createFakeSupabaseClient({
      initialSession: adminSession,
      profileRow: {
        id: "admin-1",
        email: "shilpi@aspenglow.in",
        display_name: "Shilpi Chauhan",
        role: "admin",
        status: "active",
      },
    });

    renderWithRouter(["/admin/reset-password"], client);

    const newPassInput = await screen.findByLabelText(/^New Password/i);
    const confirmPassInput = screen.getByLabelText(/Confirm New Password/i);
    const submitBtn = screen.getByRole("button", { name: /update password/i });

    await userEvent.type(newPassInput, "short");
    await userEvent.type(confirmPassInput, "different");
    await userEvent.click(submitBtn);

    expect(
      await screen.findByText(/Password must be at least 8 characters long/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Passwords do not match/i)).toBeInTheDocument();
    expect(updateUserMock).not.toHaveBeenCalled();

    await userEvent.clear(newPassInput);
    await userEvent.clear(confirmPassInput);
    await userEvent.type(newPassInput, "NewSecurePass123!");
    await userEvent.type(confirmPassInput, "NewSecurePass123!");
    await userEvent.click(submitBtn);

    expect(await screen.findByRole("status")).toHaveTextContent(
      /Your password has been updated/i
    );
    expect(updateUserMock).toHaveBeenCalledWith({
      password: "NewSecurePass123!",
    });
  });
});

