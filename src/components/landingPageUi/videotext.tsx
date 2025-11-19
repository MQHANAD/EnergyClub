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
import { useI18n } from "@/i18n/index";

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
  const { t, lang } = useI18n();
  const isArabic = lang === "ar";

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

    const computedFont = isArabic
      ? "Tahoma, Arial, system-ui, sans-serif"
      : fontFamily;
    const rtlAttrs = isArabic ? "direction='rtl' unicode-bidi='plaintext'" : "";

    const svgString = `
      <svg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%'>
        <text 
          x='50%' 
          y='50%' 
          font-size='${responsiveFontSize}' 
          font-weight='${fontWeight}' 
          text-anchor='${textAnchor}' 
          dominant-baseline='${dominantBaseline}' 
          font-family='${computedFont}'
          ${rtlAttrs}
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
    isArabic,
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
          "absolute inset-0 flex items-center justify-center md:mb-6 mb-40",
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
          <div className="text-white text-opacity-50">
            {t("common.loading")}
          </div>
        </div>
      )}
      <span className="sr-only">{content}</span>

      {/* Logos positioned under the text */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-wrap justify-center items-center gap-3 sm:gap-4 md:gap-6 w-full px-4">
        <Image
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/KFUPM.svg/1280px-KFUPM.svg.png"
          alt="KFUPM Logo"
          width={200}
          height={200}
          className="h-10 w-auto sm:h-12 md:h-16 object-contain"
        />
        <Image
          src="/CEEELogo.png"
          alt="Energy Club Logo"
          width={270}
          height={270}
          className="h-14 w-auto sm:h-16 md:h-20 object-contain"
        />
        <Image
          src="/EW.svg"
          alt="Energy Week Logo"
          width={200}
          height={200}
          className="h-14 w-auto sm:h-16 md:h-20 object-contain"
        />
        <Image
          src="/energyClubLogo.png"
          alt="Energy Week Logo"
          width={200}
          height={200}
          className="h-16 w-auto sm:h-18 md:h-22 object-contain"
        />
        {/* Hashtag text */}
        <div
          className="flex flex-wrap items-center justify-center text-xl sm:text-5xl font-semibold tracking-wide md:mb-2"
          style={{ fontFamily: '"DGSahabah", sans-serif', direction: "ltr" }}
        >
          <span className="text-[#989898]">#</span>
          <span className="text-[#284f93] mr-1">Lets</span>
          <span className="text-[#209eaa] mr-1">Energize</span>
          <span className="text-[#f4bb12] mr-1">The</span>
          <span className="text-[#f4bb12]">Future</span>
        </div>
      </div>
    </Component>
  );
}
