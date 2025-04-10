import React, { useState } from "react";
import Image from "next/image";
import motion from "framer-motion";
const Navbar = ({ user }: any) => {
  return (
    <section className='flex justify-between bg-[#1e1e2d] p-4 px-5'>
      <img src='/favicon.ico' className='h-12'></img>
      <section className='flex items-center text-center text-xl text-white'>
        <div>ReMo</div>
      </section>
      <div>
        {user && (
          // <button onClick={() => setIsProfile(!isProfile)}>
          <Image
            src={user?.imageUrl}
            width={40}
            height={40}
            className=' rounded-full'
            alt={""}
          />
          // </button>
        )}
      </div>
    </section>
  );
};

export default Navbar;
