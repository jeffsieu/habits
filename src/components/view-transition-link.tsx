"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ComponentProps, MouseEvent } from "react";

interface ViewTransitionLinkProps extends ComponentProps<typeof Link> {
  href: string;
}

export function ViewTransitionLink({
  href,
  onClick,
  ...props
}: ViewTransitionLinkProps) {
  const router = useRouter();

  const handleLinkClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (onClick) {
      onClick(e);
    }

    if (e.defaultPrevented) return;

    // Check if View Transitions API is supported
    if (!document.startViewTransition) {
      return;
    }

    e.preventDefault();

    document.startViewTransition(() => {
      router.push(href);
    });
  };

  return <Link href={href} onClick={handleLinkClick} {...props} />;
}
