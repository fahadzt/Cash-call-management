'use client'

import React from 'react'
import Image from 'next/image'

interface AnimatedLoadingProps {
  message?: string
  className?: string
}

export function AnimatedLoading({ message = "Loading...", className = "" }: AnimatedLoadingProps) {
  return (
    <div className={`min-h-screen aramco-gradient-bg flex items-center justify-center ${className}`}>
      <div className="text-center">
        {/* Animated Logo Container */}
        <div className="relative mb-8">
          {/* Logo with fade animation */}
          <div className="animate-pulse">
            <Image
              src="/images/aramco-digital-new.png"
              alt="Aramco Digital"
              width={300}
              height={90}
              className="h-20 w-auto opacity-80"
              priority
            />
          </div>
          
          {/* Animated dots overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>

        {/* Loading text with fade animation */}
        <div className="animate-pulse">
          <p className="text-white text-lg font-medium opacity-90">{message}</p>
        </div>

        {/* Subtle gradient ring animation */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-96 h-96 rounded-full border-2 border-white/10 animate-ping"></div>
          <div className="absolute w-80 h-80 rounded-full border-2 border-white/20 animate-ping" style={{ animationDelay: '1s' }}></div>
          <div className="absolute w-64 h-64 rounded-full border-2 border-white/30 animate-ping" style={{ animationDelay: '2s' }}></div>
        </div>
      </div>
    </div>
  )
}

// Alternative version with more dramatic fade in/out
export function DramaticAnimatedLoading({ message = "Loading...", className = "" }: AnimatedLoadingProps) {
  return (
    <div className={`min-h-screen aramco-gradient-bg flex items-center justify-center ${className}`}>
      <div className="text-center relative">
        {/* Main logo with dramatic fade animation */}
        <div className="animate-pulse">
          <div className="relative">
            <Image
              src="/images/aramco-digital-new.png"
              alt="Aramco Digital"
              width={300}
              height={90}
              className="h-20 w-auto opacity-90"
              priority
            />
            
            {/* Glowing effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse rounded-lg"></div>
          </div>
        </div>

        {/* Loading text with dramatic fade */}
        <div className="mt-6">
          <p className="text-white text-lg font-medium animate-pulse">
            {message.split('').map((char, index) => (
              <span
                key={index}
                className="inline-block animate-pulse"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {char}
              </span>
            ))}
          </p>
        </div>

        {/* Animated background elements */}
        <div className="absolute inset-0 -z-10">
          {/* Floating particles */}
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white/30 rounded-full animate-ping"></div>
          <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-white/40 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-white/20 rounded-full animate-ping" style={{ animationDelay: '2s' }}></div>
          <div className="absolute bottom-1/3 right-1/3 w-1 h-1 bg-white/50 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
        </div>
      </div>
    </div>
  )
} 