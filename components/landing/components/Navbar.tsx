'use client';
import React from 'react';
import { Button } from '@/components/ui/home/LandingButton';
import { SignInButton, UserButton, SignedIn, SignedOut } from '@clerk/nextjs';

const Navbar = () => {
  return (
    <nav className="container mx-auto flex items-center justify-between p-6 shadow-md bg-gradient-to-b from-purple-950/10 to-purple-950/10">
      <div className="flex items-center gap-2">
        <div className="font-bold text-purple-300/90 text-2xl">RemO</div>
        <span className="bg-gradient-to-r from-violet-500 to-purple-600 text-transparent bg-clip-text text-sm font-medium">
          BETA
        </span>
      </div>
      <div className="hidden md:flex items-center gap-8 text-purple-200/90">
        <a href="#features" className="hover:text-white transition">
          Features
        </a>
        <a href="#how-it-works" className="hover:text-white transition">
          How it works
        </a>
        <a href="#pricing" className="hover:text-white transition">
          Pricing
        </a>
      </div>
      <div className="flex items-center gap-4">
        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
        <SignedOut>
          <Button
            variant="outline"
            className="text-purple-300/90 bg-purple-950/70 border border-purple-700"
          >
            <SignInButton forceRedirectUrl="/" />
          </Button>
        </SignedOut>
      </div>
    </nav>
  );
};

export default Navbar;
