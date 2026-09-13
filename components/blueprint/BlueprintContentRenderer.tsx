"use client";

import { useEffect, useRef } from "react";

interface Props {
  html: string;
  className?: string;
}

export default function BlueprintContentRenderer({ html, className = "" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Enhance all <pre> elements with a header bar and copy button
    const preElements = containerRef.current.querySelectorAll("pre");
    preElements.forEach((pre) => {
      // Check if already wrapped
      if (pre.parentElement?.classList.contains("code-block-wrapper")) return;

      const codeElement = pre.querySelector("code");
      const rawCode = codeElement ? codeElement.innerText : pre.innerText;

      // Determine label (e.g. JSON, Workflow Template, Prompt, or Diagram)
      let label = "Code";
      if (rawCode.trim().startsWith("{") || rawCode.trim().startsWith("[")) {
        label = "JSON Workflow Template";
      } else if (rawCode.includes("-->") || rawCode.includes("──►") || rawCode.includes("│") || rawCode.includes("▼")) {
        label = "Architecture Flow";
      } else if (rawCode.toLowerCase().includes("you are") || rawCode.toLowerCase().includes("prompt")) {
        label = "Starter Prompt";
      }

      // Create wrapper
      const wrapper = document.createElement("div");
      wrapper.className = "code-block-wrapper my-6 overflow-hidden rounded-[2px] border border-rule bg-[#18181B] text-zinc-100 font-mono text-xs shadow-md";

      // Create header
      const header = document.createElement("div");
      header.className = "flex items-center justify-between border-b border-zinc-800 bg-zinc-900/95 px-3.5 py-2 text-zinc-400 select-none";
      
      const labelSpan = document.createElement("span");
      labelSpan.className = "font-mono text-[11px] font-medium tracking-wide uppercase text-zinc-300 flex items-center gap-1.5";
      labelSpan.innerHTML = `<span class="inline-block h-1.5 w-1.5 rounded-full bg-accent"></span>${label}`;
      header.appendChild(labelSpan);

      const copyBtn = document.createElement("button");
      copyBtn.type = "button";
      copyBtn.className = "flex items-center gap-1.5 rounded bg-zinc-800/80 px-2 py-1 text-[11px] font-sans font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white transition";
      copyBtn.setAttribute("aria-label", "Copy snippet to clipboard");
      copyBtn.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
        <span>Copy</span>
      `;

      copyBtn.addEventListener("click", async () => {
        try {
          if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(rawCode);
          } else {
            const textarea = document.createElement("textarea");
            textarea.value = rawCode;
            textarea.style.position = "fixed";
            textarea.style.opacity = "0";
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
          }
          copyBtn.innerHTML = `
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#34D399" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span class="text-emerald-400">Copied!</span>
          `;
          setTimeout(() => {
            copyBtn.innerHTML = `
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              <span>Copy</span>
            `;
          }, 2000);
        } catch (err) {
          console.error("Failed to copy code:", err);
        }
      });

      header.appendChild(copyBtn);

      // Replace pre with wrapper
      pre.parentNode?.insertBefore(wrapper, pre);
      wrapper.appendChild(header);
      
      const preContainer = document.createElement("div");
      preContainer.className = "overflow-x-auto p-4 leading-relaxed max-h-[500px]";
      pre.className = "m-0 p-0 bg-transparent text-zinc-100 font-mono text-xs";
      preContainer.appendChild(pre);
      wrapper.appendChild(preContainer);
    });

    // Ensure all H2s have matching IDs for Table of Contents anchors
    const h2Elements = containerRef.current.querySelectorAll("h2");
    h2Elements.forEach((h2) => {
      const text = h2.innerText.trim();
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      if (!h2.id) {
        h2.id = id;
      }
    });
  }, [html]);

  return (
    <div
      ref={containerRef}
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
