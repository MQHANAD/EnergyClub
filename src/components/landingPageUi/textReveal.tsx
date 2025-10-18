"use client";

import React, { ComponentPropsWithoutRef, FC, ReactNode, useRef } from "react";
import { motion, MotionValue, useScroll, useTransform } from "framer-motion";

import { cn } from "@/lib/utils";

export interface TextRevealProps extends ComponentPropsWithoutRef<"div"> {
  children: ReactNode;
}

export const TextReveal: FC<TextRevealProps> = ({ children, className }) => {
  const targetRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start 0.5", "end 0.5"],
  });

  const childArray = React.Children.toArray(children);
  const textWords: string[] = [];
  const elements: Array<{
    element: React.ReactElement;
    hasAnimation: boolean;
  }> = [];

  childArray.forEach((child) => {
    if (typeof child === "string") {
      textWords.push(...child.split(" "));
    } else if (React.isValidElement(child)) {
      // Check if the element already has animation props
      const element = child as React.ReactElement;
      const props = element.props as any;
      const hasAnimationProps =
        props &&
        (props.initial !== undefined ||
          props.animate !== undefined ||
          props.transition !== undefined);
      elements.push({ element, hasAnimation: Boolean(hasAnimationProps) });
    }
  });

  return (
    <div
      ref={targetRef}
      className={cn("relative z-0 h-[60vh] min-h-[400px]", className)}
    >
      <div
        className={
          "sticky top-0 mx-auto flex h-screen items-top bg-transparent md:px-26 px-0 justify-top"
        }
      >
        <motion.div
          className={
            "flex flex-col items-center justify-center text-black font-serif"
          }
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          {/* Render non-text elements (like h1) first */}
          {elements.map(({ element, hasAnimation }, i) =>
            hasAnimation ? (
              // Elements with existing animations - render as-is
              <div key={i}>{element}</div>
            ) : (
              // Elements without animations - apply default animation
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.8,
                  delay: 0.2,
                  type: "spring",
                  stiffness: 100,
                  damping: 15,
                }}
              >
                {element}
              </motion.div>
            )
          )}

          {/* Render animated text words */}
          {textWords.length > 0 && (
            <motion.div
              className={
                "flex flex-wrap items-center justify-center gap-1 text-base font-light leading-snug md:gap-2 md:text-lg lg:gap-3 lg:text-xl xl:text-2xl font-serif"
              }
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              {textWords.map((word, i) => {
                // Adjusted range to start later and finish earlier
                const start = 0.2 + (i / textWords.length) * 0.6; // Starts at 20% through scroll
                const end = start + 0.6 / textWords.length; // Shorter range for quicker completion
                return (
                  <Word key={i} progress={scrollYProgress} range={[start, end]}>
                    {word}
                  </Word>
                );
              })}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

interface WordProps {
  children: ReactNode;
  progress: MotionValue<number>;
  range: [number, number];
}

const Word: FC<WordProps> = ({ children, progress, range }) => {
  // Animation starts later and finishes earlier
  const opacity = useTransform(progress, [range[0], range[1]], [0, 1]);
  const scale = useTransform(progress, [range[0], range[1]], [0.9, 1]);
  const y = useTransform(progress, [range[0], range[1]], [10, 0]);

  return (
    <span className="relative mx-0.5 inline-flex">
      <span className="text-black/5 select-none">{children}</span>
      <motion.span
        style={{
          opacity,
          scale,
          y,
        }}
        className={
          "absolute inset-0 text-black font-light tracking-wide font-serif"
        }
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 25,
          mass: 0.8,
        }}
      >
        {children}
      </motion.span>
    </span>
  );
};
