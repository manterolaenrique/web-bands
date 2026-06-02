import type {SVGProps} from 'react'

type IconProps = SVGProps<SVGSVGElement>

function BaseIcon(props: IconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    />
  )
}

export function InstagramIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect height="16" rx="4" stroke="currentColor" strokeWidth="1.8" width="16" x="4" y="4" />
      <circle cx="12" cy="12" r="3.6" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.2" cy="6.8" fill="currentColor" r="1.2" />
    </BaseIcon>
  )
}

export function YouTubeIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path
        d="M20 8.2a3.3 3.3 0 0 0-2.3-2.3C15.8 5.4 12 5.4 12 5.4s-3.8 0-5.7.5A3.3 3.3 0 0 0 4 8.2 34 34 0 0 0 3.6 12c0 1.3.1 2.6.4 3.8a3.3 3.3 0 0 0 2.3 2.3c1.9.5 5.7.5 5.7.5s3.8 0 5.7-.5a3.3 3.3 0 0 0 2.3-2.3c.3-1.2.4-2.5.4-3.8s-.1-2.6-.4-3.8Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path d="m10 9.4 5 2.6-5 2.6V9.4Z" fill="currentColor" />
    </BaseIcon>
  )
}

export function FacebookIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path
        d="M13.2 20v-6.4h2.5l.4-2.8h-2.9V9c0-.8.3-1.6 1.6-1.6h1.5V5.1s-1.3-.2-2.5-.2c-2.6 0-4.3 1.6-4.3 4.4v1.5H7v2.8h2.5V20h3.7Z"
        fill="currentColor"
      />
    </BaseIcon>
  )
}

export function SpotifyIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 10.1c2.5-.8 5.6-.6 8 1" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <path d="M8.8 12.9c1.9-.5 4-.3 5.8.7" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
      <path d="M9.4 15.4c1.4-.3 2.9-.2 4.2.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </BaseIcon>
  )
}

export function TikTokIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path
        d="M14.2 5.2c.4 1.2 1.2 2.2 2.4 2.8.8.4 1.6.6 2.4.7v2.8a7.2 7.2 0 0 1-3.2-.8v5.2a5.1 5.1 0 1 1-5.2-5.1c.3 0 .6 0 .9.1v2.9a2.2 2.2 0 1 0 1.7 2.1V5.2h1Z"
        fill="currentColor"
      />
    </BaseIcon>
  )
}

export function TwitterXIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path
        d="M5.5 5.5h3.5l2.8 4 3.3-4h3.4l-5.1 6.1 5.5 7h-3.5l-3.2-4.4-3.8 4.4H5.2l5.6-6.5-5.3-6.6Zm4.1 1.9H8.7l6 8.7h.9l-6-8.7Z"
        fill="currentColor"
      />
    </BaseIcon>
  )
}
