import { createTheme } from "@mui/material";

const theme = createTheme({
  palette: {
    primary: {
      main: "#d81b60",
    },
    secondary: {
      main: "#880e4f",
    },
    background: {
      default: "#FEFBF6",
      paper: "#ffffff",
    },
    text: {
      primary: "#333333",
      secondary: "#555555",
    },
  },
  typography: {
    fontFamily: "'Lato', 'Helvetica', 'Arial', sans-serif",
    h1: {
      fontFamily: "'Playfair Display', 'Georgia', serif",
      fontWeight: 700,
    },
    h2: {
      fontFamily: "'Playfair Display', 'Georgia', serif",
      fontWeight: 700,
    },
    h3: {
      fontFamily: "'Playfair Display', 'Georgia', serif",
      fontWeight: 700,
    },
    h4: {
      fontFamily: "'Playfair Display', 'Georgia', serif",
      fontWeight: 400,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: "50px",
          textTransform: "none",
          padding: "10px 24px",
        },
      },
    },
  },
});

export default theme;
