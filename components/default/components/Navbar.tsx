import React, { useState } from "react";
import Image from "next/image";
import motion from "framer-motion";
import { UserButton } from "@clerk/nextjs";
const Navbar = ({ user }: any) => {
  return (
    <section className='flex justify-between bg-[#1e1e2d] p-4 px-5'>
      <img src='/favicon.ico' className='h-12'></img>
      <section className='flex items-center text-center text-xl text-white'>
        <div>ReMo</div>
      </section>
      <div>
        <UserButton/>
      </div>
    </section>
  );
};

export default Navbar;
