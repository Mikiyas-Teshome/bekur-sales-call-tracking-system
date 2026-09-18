import Image from "next/image";

export function BekurLogo({ className = "size-11" }: { className?: string }) {
  return <Image src="/bekur-logo.svg" alt="" width={44} height={44} className={className} priority />;
}