"use client"

import React from 'react'
import Link from "next/link"
import { motion } from "framer-motion"
import { Crown } from "lucide-react"

interface LenkersdorferLogoProps {
  collapsed?: boolean
  className?: string
}

export const LenkersdorferLogo: React.FC<LenkersdorferLogoProps> = ({
  collapsed = false,
  className = ""
}) => {
  return (
    <Link
      href="/"
      className={`font-normal flex space-x-2 items-center text-sm text-black dark:text-white py-1 relative z-20 ${className}`}
    >
      <div className="h-6 w-6 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center flex-shrink-0">
        <Crown className="h-4 w-4 text-black" />
      </div>
      <span className="font-bold text-black dark:text-white whitespace-pre">
        Lenkersdorfer
      </span>
    </Link>
  )
}