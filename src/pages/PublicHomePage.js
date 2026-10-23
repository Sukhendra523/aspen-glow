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
import { fetchPublishedServices } from "../services/serviceCatalogueService";
import { fetchPublishedPackages } from "../services/packageService";
import { fetchPublishedBundles } from "../services/bundleService";
import { useAuth } from "../context/AuthContext";

export default function PublicHomePage() {
  const { client } = useAuth();
  const [brand, setBrand] = useState(DEFAULT_BRAND_SETTINGS);
  const [contact, setContact] = useState(DEFAULT_CONTACT_SETTINGS);
  const [publishedServices, setPublishedServices] = useState([]);
  const [publishedPackages, setPublishedPackages] = useState([]);
  const [publishedBundles, setPublishedBundles] = useState([]);

  useEffect(() => {
    if (!client) {
      return undefined;
    }

    let isMounted = true;
    Promise.all([
      fetchPublicSiteSettings(client),
      fetchPublishedServices(client),
      fetchPublishedPackages(client),
      fetchPublishedBundles(client),
    ]).then(([settingsRes, servicesRes, packagesRes, bundlesRes]) => {
      if (!isMounted) return;
      setBrand(settingsRes.brand);
      setContact(settingsRes.contact);
      setPublishedServices(servicesRes.data || []);
      setPublishedPackages(packagesRes.data || []);
      setPublishedBundles(bundlesRes.data || []);
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
        <Services
          publishedServices={publishedServices}
          publishedPackages={publishedPackages}
          publishedBundles={publishedBundles}
        />
        <Contact contact={contact} />
      </main>
      <Footer brand={brand} />
    </ThemeProvider>
  );
}
