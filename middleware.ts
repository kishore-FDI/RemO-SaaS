import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export default clerkMiddleware(async (auth, req) => {
  // Get the current pathname from the request URL.
  const { pathname } = req.nextUrl;

  // Allow unauthenticated access to the landing page.
  if (pathname === '/landing') {
    return NextResponse.next();
  }
  
  // Allow all API requests to pass through - they should handle their own auth
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }
  
  // Await the authentication data from Clerk.
  const authData = await auth();
  
  // If the user is not authenticated, redirect them to /landing.
  if (!authData.userId) {
    return NextResponse.redirect(new URL('/landing', req.url));
  }

  // Allow the request to proceed.
  return NextResponse.next();
});

// Export configuration to match routes properly, while skipping
// Next.js internals and static files.
export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
};