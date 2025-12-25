import { NextAuthOptions } from "next-auth";
import StravaProvider from "next-auth/providers/strava";

export const authOptions: NextAuthOptions = {
  debug: true,
  providers: [
    StravaProvider({
      clientId: process.env.STRAVA_CLIENT_ID!,
      clientSecret: process.env.STRAVA_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "activity:read_all",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // Persist the OAuth access_token to the token right after signin
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client, like an access_token from a provider.
      // @ts-ignore
      session.accessToken = token.accessToken;
      return session;
    },
  },
};
