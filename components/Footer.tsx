import React from "react";
import { ShieldCheck } from "lucide-react";

export interface SocialLink {
  label: string;
  href: string;
}

interface FooterProps {
  socialLinks?: SocialLink[];
  statusText?: string;
  poweredByText?: string;
}

const DEFAULT_SOCIAL_LINKS: SocialLink[] = [
  { label: "GitHub", href: "https://github.com/nero-tx" },
  { label: "X", href: "https://x.com/n3rotx" },
];

const GithubIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.54-3.87-1.54-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.69 1.24 3.34.95.1-.74.4-1.24.73-1.52-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.18 1.83 1.18 3.09 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56C20.22 21.38 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z" />
  </svg>
);

const XIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const SOCIAL_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  GitHub: GithubIcon,
  X: XIcon,
};

export function Footer({
  socialLinks = DEFAULT_SOCIAL_LINKS,
  statusText = "Zero-Storage Architecture • No diagnostic measurements or IP payloads retained",
  poweredByText = "Powered by @cloudflare/speedtest, W3C PerformanceObserver, Node.js Native DNS & WebRTC",
}: FooterProps) {
  return (
    <footer className="w-full border-t border-slate-900 bg-slate-950/80 py-6 mt-12 text-xs text-slate-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck
            className="w-4 h-4 text-emerald-400"
            aria-hidden="true"
          />
          <span>{statusText}</span>
        </div>

        <div className="flex items-center gap-4">
          <nav aria-label="Social links" className="flex items-center gap-3">
            {socialLinks.map(({ label, href }) => {
              const Icon = SOCIAL_ICONS[label];
              return (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="text-slate-500 hover:text-cyan-400 transition-colors"
                >
                  {Icon && <Icon className="w-4 h-4" />}
                </a>
              );
            })}
          </nav>
          <div className="text-[11px] text-slate-600">{poweredByText}</div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
