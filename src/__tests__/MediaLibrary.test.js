import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "@mui/material";
import theme from "../constants/theme";
import {
  DEFAULT_BRAND_SETTINGS,
  DEFAULT_CONTACT_SETTINGS,
} from "../constants/defaultSettings";
import {
  MAX_MEDIA_FILE_BYTES,
  buildSafeStoragePath,
  validateMediaUpload,
} from "../services/mediaService";
import { AuthProvider } from "../context/AuthContext";
import { AppRoutes } from "../App";

const SEED_ASSETS = [
  {
    id: "media-1",
    label: "Festive Gold Logo",
    category: "logo",
    bucket_name: "salon-media",
    storage_path: "logo/1700000000-abc-festive-gold-logo.png",
    public_url:
      "https://example.supabase.co/storage/v1/object/public/salon-media/logo/1700000000-abc-festive-gold-logo.png",
    mime_type: "image/png",
    size_bytes: 45056,
    status: "active",
  },
];

function createMediaSupabaseClient({
  isAdmin = true,
  assetsRows = SEED_ASSETS,
} = {}) {
  const session = isAdmin
    ? { user: { id: "admin-1", email: "shilpi@aspenglow.in" } }
    : null;

  let currentAssets = [...assetsRows];

  const storageUploadMock = jest
    .fn()
    .mockResolvedValue({ data: { path: "uploaded" }, error: null });
  const storageGetPublicUrlMock = jest.fn((path) => ({
    data: {
      publicUrl: `https://example.supabase.co/storage/v1/object/public/salon-media/${path}`,
    },
  }));

  const mediaInsertMock = jest.fn((payload) => ({
    select: jest.fn(() => ({
      single: jest.fn().mockImplementation(async () => {
        const created = { id: "media-new-1", ...payload };
        currentAssets = [created, ...currentAssets];
        return { data: created, error: null };
      }),
    })),
  }));

  const mediaUpdateMock = jest.fn((payload) => ({
    eq: jest.fn((col, id) => ({
      select: jest.fn(() => ({
        single: jest.fn().mockImplementation(async () => {
          currentAssets = currentAssets.map((a) =>
            a.id === id ? { ...a, ...payload } : a
          );
          return {
            data: currentAssets.find((a) => a.id === id) || null,
            error: null,
          };
        }),
      })),
    })),
  }));

  const brandUpsertMock = jest.fn((payload) => ({
    select: jest.fn(() => ({
      single: jest.fn().mockResolvedValue({
        data: { ...DEFAULT_BRAND_SETTINGS, ...payload },
        error: null,
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
    storage: {
      from: jest.fn(() => ({
        upload: storageUploadMock,
        getPublicUrl: storageGetPublicUrlMock,
      })),
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
      if (table === "media_assets") {
        return {
          select: jest.fn(() => buildListChain(() => currentAssets)),
          insert: mediaInsertMock,
          update: mediaUpdateMock,
        };
      }
      if (table === "brand_settings") {
        return {
          select: jest.fn(() =>
            buildListChain(() => [{ ...DEFAULT_BRAND_SETTINGS }])
          ),
          upsert: brandUpsertMock,
        };
      }
      if (table === "contact_settings") {
        return {
          select: jest.fn(() =>
            buildListChain(() => [{ ...DEFAULT_CONTACT_SETTINGS }])
          ),
        };
      }
      return {};
    }),
  };

  return {
    client,
    storageUploadMock,
    mediaInsertMock,
    mediaUpdateMock,
    brandUpsertMock,
  };
}

function renderApp(initialEntries = ["/admin/media"], client = null) {
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

describe("Ticket 6 — Media Validation & Safe Storage Path Rules", () => {
  test("sanitizes storage paths against path traversal and preserves safe extensions", () => {
    const path = buildSafeStoragePath(
      "logo",
      "../../evil/My Salon Logo!!.PNG",
      1700000000
    );
    expect(path).toMatch(/^logo\/1700000000-[a-z0-9]+-my-salon-logo\.png$/);
    expect(path).not.toContain("..");
  });

  test("rejects SVG files, oversized files, and accepts valid raster PNG/JPEG/WebP files", () => {
    const svgFile = new File(["<svg></svg>"], "malicious.svg", {
      type: "image/svg+xml",
    });
    const svgResult = validateMediaUpload({
      label: "Vector Logo",
      category: "logo",
      file: svgFile,
    });
    expect(svgResult.valid).toBe(false);
    expect(svgResult.errors.file).toMatch(/SVG and active formats are blocked/i);

    const hugeFile = {
      name: "huge.png",
      type: "image/png",
      size: MAX_MEDIA_FILE_BYTES + 1024,
    };
    const hugeResult = validateMediaUpload({
      label: "Huge Photo",
      category: "general",
      file: hugeFile,
    });
    expect(hugeResult.valid).toBe(false);
    expect(hugeResult.errors.file).toMatch(/2 MB or smaller/i);

    const validFile = new File(["pngbytes"], "diwali-motif.png", {
      type: "image/png",
    });
    const validResult = validateMediaUpload({
      label: "Diwali Motif",
      category: "poster_motif",
      file: validFile,
    });
    expect(validResult.valid).toBe(true);
  });
});

describe("Ticket 6 — Admin Media Library & Safe Asset Upload (/admin/media)", () => {
  test("redirects unauthenticated user from /admin/media to /admin/login", async () => {
    const { client } = createMediaSupabaseClient({ isAdmin: false });
    renderApp(["/admin/media"], client);

    expect(
      await screen.findByText(/Sign in with your administrator account/i)
    ).toBeInTheDocument();
  });

  test("rejects SVG upload, uploads valid PNG, applies as brand logo, and archives asset", async () => {
    const {
      client,
      storageUploadMock,
      mediaInsertMock,
      mediaUpdateMock,
      brandUpsertMock,
    } = createMediaSupabaseClient({ isAdmin: true });

    renderApp(["/admin/media"], client);

    expect(
      await screen.findByRole("heading", { name: "Festive Gold Logo" })
    ).toBeInTheDocument();

    const labelInput = screen.getByLabelText(/Asset Label/i);
    const fileInput = screen.getByLabelText(/Image File/i);

    await userEvent.type(labelInput, "Diwali Floral Border");

    // Attempt SVG upload -> blocked
    const svgFile = new File(["<svg></svg>"], "border.svg", {
      type: "image/svg+xml",
    });
    fireEvent.change(fileInput, { target: { files: [svgFile] } });
    await userEvent.click(
      screen.getByRole("button", { name: /Upload Asset/i })
    );

    expect(
      await screen.findByText(/SVG and active formats are blocked/i)
    ).toBeInTheDocument();
    expect(labelInput).toHaveValue("Diwali Floral Border");
    expect(storageUploadMock).not.toHaveBeenCalled();

    // Upload valid PNG
    const pngFile = new File(["png-binary-content"], "diwali-border.png", {
      type: "image/png",
    });
    fireEvent.change(fileInput, { target: { files: [pngFile] } });
    await userEvent.click(
      screen.getByRole("button", { name: /Upload Asset/i })
    );

    await waitFor(() => {
      expect(storageUploadMock).toHaveBeenCalledTimes(1);
    });
    expect(mediaInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        label: "Diwali Floral Border",
        mime_type: "image/png",
        status: "active",
      })
    );
    expect(await screen.findByRole("status")).toHaveTextContent(
      /Uploaded media asset "Diwali Floral Border"/i
    );

    // Apply Festive Gold Logo as Brand Logo
    const useLogoButtons = screen.getAllByRole("button", {
      name: /Use as Brand Logo/i,
    });
    await userEvent.click(useLogoButtons[useLogoButtons.length - 1]);

    await waitFor(() => {
      expect(brandUpsertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          logo_url: expect.stringContaining("festive-gold-logo.png"),
        }),
        { onConflict: "id" }
      );
    });

    // Archive Festive Gold Logo
    await userEvent.click(
      screen.getByRole("button", { name: /Archive Festive Gold Logo/i })
    );
    expect(
      await screen.findByRole("heading", { name: /Archive Media Asset\?/i })
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: /Confirm Archive/i })
    );

    await waitFor(() => {
      expect(mediaUpdateMock).toHaveBeenCalledWith({ status: "archived" });
    });
    expect(await screen.findByRole("status")).toHaveTextContent(
      /Archived media asset "Festive Gold Logo"/i
    );
  });
});

