import React from "react";
import Image from "next/image";
import { SITE_NAME } from "@/lib/site";

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
  size?: "sm" | "md" | "lg";
  useImage?: boolean;
}

/**
 * Concept 2: Editorial Monogram for Stacksgpt
 * Features the signature folded ribbon 'S' with indigo/violet fold accent.
 */
export default function Logo({
  className = "",
  iconOnly = false,
  size = "md",
  useImage = false,
}: LogoProps) {
  const dimension = size === "sm" ? 28 : size === "lg" ? 44 : 34;

  if (useImage) {
    return (
      <div className={`inline-flex items-center gap-2.5 ${className}`}>
        <Image
          src="/images/logo.jpg"
          alt="Stacksgpt Logo"
          width={dimension}
          height={dimension}
          className="rounded-lg object-contain shadow-sm"
          priority
        />
        {!iconOnly && (
          <span className="font-serif text-head-sm font-bold tracking-tight text-ink">
            {SITE_NAME}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div
        style={{ width: dimension, height: dimension }}
        className="relative shrink-0 overflow-hidden rounded-lg bg-stone-900 p-1 shadow-sm transition-transform group-hover:scale-105 dark:bg-stone-800"
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-full w-full"
        >
          {/* Top curve of the S */}
          <path
            d="M78 28C78 20 71 14 62 14H36C26 14 18 22 18 32C18 42 26 50 36 50H60C64 50 67 53 67 57C67 61 64 64 60 64H22"
            stroke="white"
            strokeWidth="13"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Folded Indigo Accent Line inside the junction */}
          <path
            d="M36 50H58C62 50 65 52 66 55"
            stroke="#818cf8"
            strokeWidth="5"
            strokeLinecap="round"
          />
          {/* Bottom sweep of the S */}
          <path
            d="M22 72C22 80 29 86 38 86H64C74 86 82 78 82 68C82 58 74 50 64 50H40C36 50 33 47 33 43C33 39 36 36 40 36H78"
            stroke="white"
            strokeWidth="13"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Top subtle indigo accent */}
          <path
            d="M42 36H64C68 36 71 38 72 41"
            stroke="#6366f1"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {!iconOnly && (
        <span className="font-serif text-head-sm font-bold tracking-tight text-ink">
          {SITE_NAME}
        </span>
      )}
    </div>
  );
}
