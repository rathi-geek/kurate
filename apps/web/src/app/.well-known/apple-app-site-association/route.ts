import { NextResponse } from "next/server";

/**
 * Apple App Site Association (AASA) file for iOS Universal Links.
 * Served at /.well-known/apple-app-site-association (no .json extension).
 *
 * Replace <TEAM_ID> with your Apple Developer Team ID before deploying.
 */
export async function GET() {
  const aasa = {
    applinks: {
      apps: [],
      details: [
        {
          appIDs: ["<TEAM_ID>.in.co.kurate.app"],
          components: [
            { "/": "/groups/*", comment: "Group detail & join" },
            { "/": "/people/*", comment: "DM conversations" },
            { "/": "/home", comment: "Home / Vault" },
            { "/": "/profile", comment: "User profile" },
            { "/": "/notifications", comment: "Notifications" },
          ],
        },
      ],
    },
  };

  return NextResponse.json(aasa, {
    headers: { "Content-Type": "application/json" },
  });
}
