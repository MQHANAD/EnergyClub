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

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !autoPlay) return;

    const tryPlay = async () => {
      try {
        video.muted = true;
        video.playsInline = true;
        video.setAttribute("playsinline", "true");
        video.setAttribute("webkit-playsinline", "true");
        video.setAttribute("x-webkit-airplay", "allow");
        await video.play();
      } catch (error) {
        console.warn("Autoplay prevented:", error);
        const enableAutoplay = async () => {
          try {
            await video.play();
          } catch (err) {
            console.warn("Still unable to play video:", err);
          }
        };
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
      className={cn(
        "relative w-full h-full overflow-hidden flex flex-col justify-between",
        className
      )}
    >
      {/* VIDEO CONTAINER (Unchanged) */}
      <div className="relative flex-1 w-full flex items-center justify-center min-h-0">
        <div
          className={cn(
            "absolute inset-0 w-full h-full flex items-center justify-center",
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
      </div>

      {/* 3. LOGO AREA - UPDATED FOR LARGER MOBILE ICONS */}
      <div className="flex-shrink-0 w-full py-3 sm:py-4 flex flex-wrap justify-center items-center gap-3 sm:gap-4 md:gap-6 px-2 z-10 mb-16">
        {/* KFUPM: Increased from h-8 to h-12 */}
        <Image
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/KFUPM.svg/1280px-KFUPM.svg.png"
          alt="KFUPM Logo"
          width={200}
          height={200}
          className="h-10 w-auto sm:h-16 md:h-20 object-contain"
        />
        {/* CEEE: Increased from h-10 to h-14 */}
        <Image
          src="/CEEELogo.png"
          alt="Energy Club Logo"
          width={200}
          height={200}
          className="h-14 w-auto sm:h-16 md:h-20 object-contain pb-2"
        />
        {/* EW: Increased from h-10 to h-14 */}
        <Image
          src="/EW.svg"
          alt="Energy Week Logo"
          width={200}
          height={200}
          className="h-14 w-auto sm:h-16 md:h-20 object-contain"
        />
        {/* Energy Club: Increased from h-12 to h-16 */}
        <Image
          src="/energyClubLogo.png"
          alt="Energy Week Logo"
          width={200}
          height={200}
          className="h-16 w-auto sm:h-18 md:h-22 object-contain"
        />

        {/* Hashtag text: Increased base text size from text-sm to text-lg */}
        <div
          className="flex flex-wrap items-center justify-center text-2xl md:text-5xl font-semibold tracking-wide"
          style={{ fontFamily: '"DGSahabah", sans-serif', direction: "ltr" }}
        >
          <span className="text-[#989898]">#</span>
          <span className="text-[#284f93] mr-1">Lets</span>
          <span className="text-[#25818a] mr-1">Energize</span>
          <span className="text-[#f4bb12] mr-1">The</span>
          <span className="text-[#f4bb12]">Future</span>
        </div>
      </div>
    </Component>
  );
}
