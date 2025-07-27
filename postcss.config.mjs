export default {
    plugins: {
      "@tailwindcss/postcss": {
        tailwindConfig: {
          content: ["./src/**/*.{js,jsx,ts,tsx}"],
          theme: {
            extend: {},
          },
          plugins: [],
        },
      },
    }
  }