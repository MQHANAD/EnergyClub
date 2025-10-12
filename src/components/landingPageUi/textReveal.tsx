"use client"

import { ComponentPropsWithoutRef, FC, ReactNode, useRef } from "react"
import { motion, MotionValue, useScroll, useTransform } from "framer-motion"

import { cn } from "@/lib/utils"

export interface TextRevealProps extends ComponentPropsWithoutRef<"div"> {
  children: string
}

export const TextReveal: FC<TextRevealProps> = ({ children, className }) => {
  const targetRef = useRef<HTMLDivElement | null>(null)
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start 0.9", "end 0.6"],
  })

  if (typeof children !== "string") {
    throw new Error("TextReveal: children must be a string")
  }

  const words = children.split(" ")

  return (
    <div ref={targetRef} className={cn("relative z-0 h-[200vh]", className)}>
      <div
        className={
          "sticky top-0 mx-auto flex h-screen items-center bg-transparent px-26"
        }
      >
         <motion.span
           className={
             "flex flex-wrap items-center justify-center gap-1 p-4 text-base font-light leading-snug text-black/5 md:gap-2 md:p-6 md:text-lg lg:gap-3 lg:p-8 lg:text-xl xl:text-2xl font-serif"
           }
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          {words.map((word, i) => {
            // Adjusted range to start later and finish earlier
            const start = 0.2 + (i / words.length) * 0.6 // Starts at 20% through scroll
            const end = start + 0.6 / words.length // Shorter range for quicker completion
            return (
              <Word key={i} progress={scrollYProgress} range={[start, end]}>
                {word}
              </Word>
            )
          })}
        </motion.span>
      </div>
    </div>
  )
}

interface WordProps {
  children: ReactNode
  progress: MotionValue<number>
  range: [number, number]
}

const Word: FC<WordProps> = ({ children, progress, range }) => {
  // Animation starts later and finishes earlier
  const opacity = useTransform(progress, [range[0], range[1]], [0, 1])
  const scale = useTransform(progress, [range[0], range[1]], [0.9, 1])
  const y = useTransform(progress, [range[0], range[1]], [10, 0])
  
  return (
     <span className="relative mx-0.5 inline-flex">
       <span className="text-black/5 select-none">{children}</span>
      <motion.span
        style={{ 
          opacity, 
          scale,
          y 
        }}
         className={
           "absolute inset-0 text-black font-light tracking-wide font-serif"
         }
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 25,
          mass: 0.8
        }}
      >
        {children}
      </motion.span>
    </span>
  )
}