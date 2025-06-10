import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware() {
        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token
        },
    }
);

// Protect all routes except the following
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         * - auth (auth routes)
         * - root path (/)
         */
        "/((?!api|_next/static|_next/image|favicon.ico|public|auth|$).*)",
    ],
}; 