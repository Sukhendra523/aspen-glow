exports.handler = async () => {
  const supabaseUrl =
    process.env.REACT_APP_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    "";
  const supabaseAnonKey =
    process.env.REACT_APP_SUPABASE_PUBLISHABLE_KEY ||
    process.env.REACT_APP_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    "";

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    },
    body: JSON.stringify({
      supabaseUrl,
      supabaseAnonKey,
    }),
  };
};

