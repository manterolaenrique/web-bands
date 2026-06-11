import type {SVGProps} from 'react'

type IconProps = SVGProps<SVGSVGElement>

function BaseIcon({children, ...props}: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

export function AudioWaveIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4 10v4" />
      <path d="M8 7v10" />
      <path d="M12 4v16" />
      <path d="M16 7v10" />
      <path d="M20 10v4" />
    </BaseIcon>
  )
}

export function PlayCircleIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m10 8 6 4-6 4Z" fill="currentColor" stroke="none" />
    </BaseIcon>
  )
}

export function PauseCircleIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M10 8v8" />
      <path d="M14 8v8" />
    </BaseIcon>
  )
}

export function PlaylistIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4 7h10" />
      <path d="M4 12h10" />
      <path d="M4 17h6" />
      <circle cx="18" cy="17" r="2.5" />
      <path d="M20.5 9.5V17" />
    </BaseIcon>
  )
}

export function UploadIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 16V6" />
      <path d="m8 10 4-4 4 4" />
      <path d="M5 18.5h14" />
    </BaseIcon>
  )
}

export function DownloadIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 5v10" />
      <path d="m8 11 4 4 4-4" />
      <path d="M5 19h14" />
    </BaseIcon>
  )
}

export function MoreIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="6.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="17.5" r="1" fill="currentColor" stroke="none" />
    </BaseIcon>
  )
}

export function BackTenIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M6 8H3v3" />
      <path d="M3 11a8 8 0 1 0 2.4-5.7L3 8" />
      <path d="M11 9v6" />
      <path d="M15 10.5a1.5 1.5 0 1 1 3 0c0 1.8-3 2.3-3 4.5h3" />
    </BaseIcon>
  )
}

export function ForwardTenIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M18 8h3v3" />
      <path d="M21 11a8 8 0 1 1-2.4-5.7L21 8" />
      <path d="M9 9v6" />
      <path d="M13 10.5a1.5 1.5 0 1 1 3 0c0 1.8-3 2.3-3 4.5h3" />
    </BaseIcon>
  )
}

export function CloseIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="m6 6 12 12" />
      <path d="M18 6 6 18" />
    </BaseIcon>
  )
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="m9 6 6 6-6 6" />
    </BaseIcon>
  )
}
