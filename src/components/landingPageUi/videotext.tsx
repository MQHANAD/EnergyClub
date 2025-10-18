"use client";

import React, {
  ElementType,
  ReactNode,
  useEffect,
  useState,
  useRef,
  useMemo,
  useCallback,
} from "react";
import Image from "next/image";

// Utility for joining class names
const cn = (...inputs: (string | undefined | null | false)[]) =>
  inputs.filter(Boolean).join(" ");

export interface VideoTextProps {
  src: string;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  preload?: "auto" | "metadata" | "none";
  children: ReactNode;
  fontSize?: string | number;
  fontWeight?: string | number;
  textAnchor?: "start" | "middle" | "end";
  dominantBaseline?:
    | "auto"
    | "middle"
    | "hanging"
    | "alphabetic"
    | "ideographic"
    | "text-bottom"
    | "text-top";
  fontFamily?: string;
  as?: ElementType;
  letterSpacing?: string | number;
  lineHeight?: string | number;
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
  onVideoLoad?: () => void;
  onVideoError?: (error: Event) => void;
  sources?: Array<{ src: string; type: string }>;
  poster?: string;
}

export function VideoText({
  src,
  children,
  className = "",
  autoPlay = true,
  muted = true,
  loop = true,
  preload = "auto",
  fontSize = 18,
  fontWeight = "bold",
  textAnchor = "middle",
  dominantBaseline = "middle",
  fontFamily = "sans-serif",
  as: Component = "div",
  letterSpacing,
  textTransform = "none",
  onVideoLoad,
  onVideoError,
  sources = [],
  poster,
}: VideoTextProps) {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Combine child text content
  const content = useMemo(() => {
    return React.Children.toArray(children)
      .map((child) =>
        typeof child === "string" || typeof child === "number" ? child : ""
      )
      .join("");
  }, [children]);

  // Build SVG text mask
  const svgMask = useMemo(() => {
    const responsiveFontSize =
      typeof fontSize === "number" ? `${fontSize}vw` : fontSize;
    const escapedContent = content
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

    const svgString = `
      <svg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%'>
        <text 
          x='50%' 
          y='50%' 
          font-size='${responsiveFontSize}' 
          font-weight='${fontWeight}' 
          text-anchor='${textAnchor}' 
          dominant-baseline='${dominantBaseline}' 
          font-family='${fontFamily}'
          ${letterSpacing ? `letter-spacing='${letterSpacing}'` : ""}
          ${textTransform !== "none" ? `text-transform='${textTransform}'` : ""}
        >
          ${escapedContent}
        </text>
      </svg>
    `;
    return `url("data:image/svg+xml,${encodeURIComponent(svgString.trim())}")`;
  }, [
    content,
    fontSize,
    fontWeight,
    textAnchor,
    dominantBaseline,
    fontFamily,
    letterSpacing,
    textTransform,
  ]);

  const handleVideoLoad = useCallback(() => {
    setIsVideoLoaded(true);
    onVideoLoad?.();
  }, [onVideoLoad]);

  const handleVideoError = useCallback(
    (event: React.SyntheticEvent<HTMLVideoElement, Event>) => {
      console.error("Video failed to load:", event);
      onVideoError?.(event.nativeEvent);
    },
    [onVideoError]
  );

  // ✅ Safari-safe autoplay logic
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !autoPlay) return;

    const tryPlay = async () => {
      try {
        // Set all Safari-specific attributes
        video.muted = true;
        video.playsInline = true;
        video.setAttribute("playsinline", "true");
        video.setAttribute("webkit-playsinline", "true");
        video.setAttribute("x-webkit-airplay", "allow");

        // Try to play
        await video.play();
        console.log("Video autoplay successful");
      } catch (error) {
        console.warn("Autoplay prevented:", error);

        // Set up user interaction handlers for Safari
        const enableAutoplay = async () => {
          try {
            await video.play();
            console.log("Video started after user interaction");
          } catch (err) {
            console.warn("Still unable to play video:", err);
          }
        };

        // Listen for any user interaction
        const events = ["click", "touchstart", "keydown"];
        const handleUserInteraction = () => {
          enableAutoplay();
          events.forEach((event) => {
            document.removeEventListener(event, handleUserInteraction);
          });
        };

        events.forEach((event) => {
          document.addEventListener(event, handleUserInteraction, {
            once: true,
          });
        });
      }
    };

    // Wait for video to be ready
    if (video.readyState >= 3) {
      tryPlay();
    } else {
      video.addEventListener("canplay", tryPlay, { once: true });
    }

    return () => {
      video.removeEventListener("canplay", tryPlay);
    };
  }, [autoPlay]);

  return (
    <Component
      className={cn("relative w-full h-full overflow-hidden", className)}
    >
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center mb-6",
          !isVideoLoaded && "opacity-0 transition-opacity duration-500"
        )}
        style={{
          maskImage: svgMask,
          WebkitMaskImage: svgMask,
          maskSize: "contain",
          WebkitMaskSize: "contain",
          maskRepeat: "no-repeat",
          WebkitMaskRepeat: "no-repeat",
          maskPosition: "center",
          WebkitMaskPosition: "center",
          opacity: isVideoLoaded ? 1 : 0,
          transition: "opacity 0.5s ease-in-out",
        }}
      >
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay={autoPlay}
          muted={muted}
          loop={loop}
          preload={preload}
          playsInline
          webkit-playsinline="true"
          x-webkit-airplay="allow"
          poster={poster}
          onLoadedData={handleVideoLoad}
          onError={handleVideoError}
        >
          <source src={src} type="video/mp4" />
          {sources.map((source, index) => (
            <source key={index} src={source.src} type={source.type} />
          ))}
          Your browser does not support the video tag.
        </video>
      </div>

      {!isVideoLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white text-opacity-50">Loading...</div>
        </div>
      )}
      <span className="sr-only">{content}</span>

      {/* Logos positioned under the text */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex justify-center items-center space-x-6">
        <Image
          src="/CEEELogo.png"
          alt="Energy Club Logo"
          width={300}
          height={300}
          className="object-contain"
        />
        <Image
          src="/energyWeekLogo.png"
          alt="Energy Week Logo"
          width={200}
          height={200}
          className="object-contain"
        />
      </div>
    </Component>
  );
}
