import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Exchanges the magic-link/OAuth `code` for a session cookie, then redirects
// into the app. Registered as the Supabase Auth redirect URL (and as the
// OAuth redirect URL for the Google/GitHub providers — see app/login/page.tsx).
// `next` lets a specific flow (password recovery) send the user somewhere
// other than the home page after the exchange — see resetPasswordForEmail's
// redirectTo in app/login/page.tsx.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const errorDescription = searchParams.get("error_description");
  const next = searchParams.get("next") || "/";

  if (errorDescription) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorDescription)}`);
  }

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      // Happens when a recovery/magic link is opened in a different browser
      // (e.g. an email app's built-in browser) than the one that requested
      // it — the PKCE verifier only exists in that original browser. The
      // custom token_hash link in app/reset-password/page.tsx avoids this
      // entirely once the Supabase "Reset Password" email template is
      // updated to use it instead of {{ .ConfirmationURL }}.
      const message = error.message.toLowerCase().includes("code verifier")
        ? "Ce lien doit être ouvert dans le même navigateur que celui où tu as fait la demande. Réessaie depuis ce navigateur, ou redemande un nouveau lien."
        : error.message;
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(message)}`);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
