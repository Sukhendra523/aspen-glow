import React, { useEffect, useMemo, useState } from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Services from "../components/Services";
import Contact from "../components/Contact";
import Footer from "../components/Footer";
import {
  DEFAULT_BRAND_SETTINGS,
  DEFAULT_CONTACT_SETTINGS,
} from "../constants/defaultSettings";
import { buildSalonTheme } from "../constants/theme";
import { fetchPublicSiteSettings } from "../services/settingsService";
import { useAuth } from "../context/AuthContext";

export default function PublicHomePage() {
  const { client } = useAuth();
  const [brand, setBrand] = useState(DEFAULT_BRAND_SETTINGS);
  const [contact, setContact] = useState(DEFAULT_CONTACT_SETTINGS);

  useEffect(() => {
    let isMounted = true;
    fetchPublicSiteSettings(client).then((result) => {
      if (!isMounted) return;
      setBrand(result.brand);
      setContact(result.contact);
    });
    return () => {
      isMounted = false;
    };
  }, [client]);

  const activeTheme = useMemo(() => buildSalonTheme(brand), [brand]);

  return (
    <ThemeProvider theme={activeTheme}>
      <CssBaseline />
      <Navbar brand={brand} />
      <main>
        <Hero brand={brand} />
        <Services />
        <Contact contact={contact} />
      </main>
      <Footer brand={brand} />
    </ThemeProvider>
  );
}
