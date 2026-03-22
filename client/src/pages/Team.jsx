import React from 'react'

const Team = () => {
  return (
   <>
   <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-black uppercase tracking-wide">Team</h1>
       <div className="w-20 h-0.5 bg-stone-900 mb-8" />
      <div className='flex  justify-center items-center'>
     <div className="bg-white rounded-xl shadow-md overflow-hidden w-72 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
 
          {/* Photo */}
          <img
            src="https://nikhim.me/images/IMG_20250414_000354954_HDR~2.jpg"
            alt="nikhil"
            className="w-full h-52 object-contain object-center"
          />
 
          {/* Body */}
          <div className="p-6">
            <div className="w-8 h-0.5 bg-stone-900 mb-4" />
 
            <h2 className="text-xl font-bold text-stone-900 leading-tight">Nikhil Yadav</h2>
            <p className="text-xs uppercase tracking-widest text-stone-400 font-mono mt-1">
              Founder & Developer
            </p>
 
            <p className="text-sm text-stone-500 leading-relaxed mt-4 italic">
              Building things solo, one line at a time.
            </p>
 
            {/* Links */}
            <div className="flex gap-3 mt-6 flex-wrap">
              <a
                href="https://twitter.com/nikhil0148"
                className="text-xs font-mono uppercase tracking-widest text-stone-900 border border-stone-200 rounded px-3 py-1.5 hover:bg-stone-900 hover:text-white transition-colors duration-200"
              >
                Twitter
              </a>
              <a
                href="https://github.com/nikhilydv0148"
                className="text-xs font-mono uppercase tracking-widest text-stone-900 border border-stone-200 rounded px-3 py-1.5 hover:bg-stone-900 hover:text-white transition-colors duration-200"
              >
                GitHub
              </a>
              <a
                href="https://nikhim.me"
                className="text-xs font-mono uppercase tracking-widest text-stone-900 border border-stone-200 rounded px-3 py-1.5 hover:bg-stone-900 hover:text-white transition-colors duration-200"
              >
             Portfolio
              </a>
            </div>
          </div>
        </div>

</div>

   </div>

   </>
  )
}

export default Team