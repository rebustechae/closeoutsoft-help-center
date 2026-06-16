/**
 * _components/Header.tsx
 * 
 * Reuasable header component for the Closeoutsoft Help Center.
 */

import Link from 'next/link';
import Image from 'next/image';

export function Header(){
    return(
        <header className='border-b border-gray-200 px-6 py-5'>
            <div className='mx-auto max-w-5xl flex items-center gap-4'>
                {/* Logo - Link to Homepage */}
                <Link href='/'>
                    <Image
                        src='/closeoutsoft_logo.png'
                        alt='CloseoutSoft Logo'
                        width={128}
                        height={64}
                        className='object-contain'
                    />
                </Link>

                {/*Divider*/}
                <div className='h-8 w-px bg-gray-200' />

                {/* Title */}
                <div>
                    <h1 className='text-xl font-bold text-[#2a354b] tracking-tight leading-tight'>
                        CloseoutSoft Help Center
                    </h1>
                    <p className='text-gray-500 text-sm'>
                        Step-by-step video guides for CloseoutSoft
                    </p>
                </div>
            </div>
        </header>
    )
}