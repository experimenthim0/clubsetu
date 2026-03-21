import React from 'react'


const Maintainance = () => {
  return (
    <div className='flex items-center justify-center h-screen flex-col'>
        <div className='text-center'>
            <h1 className='text-4xl font-black text-black tracking-wide'>Down For a Reason (Estimated time 10-15 mins)</h1>
            <p className='mt-4 text-neutral-500 uppercase tracking-widest text-xs font-bold'>
Club<span className='text-orange-600'>Setu</span> is down for planned maintenance. We'll be back with the latest updates and features. </p>
        </div>
        <div className='mt-4 text-center'>
            <p className='text-neutral-500 uppercase tracking-widest text-xs font-bold'>
Follow us on Instagram or X for latest updates.</p>
        </div>
    </div>
  )
}

export default Maintainance