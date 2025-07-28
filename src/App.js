import React from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Services from "./components/Services";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import theme from "./constants/theme";

// Main App Component
export default function App() {
  return (
    <ThemeProvider theme={theme}>
      {/* CssBaseline kickstarts an elegant, consistent, and simple baseline to build upon. */}
      <CssBaseline />
      {/* Google Fonts Import */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&family=Playfair+Display:wght@400;700&display=swap');
          html { scroll-behavior: smooth; }
        `}
      </style>

      <Navbar />
      <main>
        <Hero />
        <Services />
        <Contact />
      </main>
      <Footer />
    </ThemeProvider>
  );
}
