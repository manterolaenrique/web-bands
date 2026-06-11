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

export function HomeIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5.25 9.75V20h13.5V9.75" />
    </BaseIcon>
  )
}

export function SearchIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.25 4.25" />
    </BaseIcon>
  )
}

export function UserIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="8" r="3.25" />
      <path d="M5 20c1.35-3.4 4.1-5.1 7-5.1S17.65 16.6 19 20" />
    </BaseIcon>
  )
}

export function DashboardIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="3.5" y="4" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="4" width="7" height="5" rx="1.5" />
      <rect x="13.5" y="11" width="7" height="9" rx="1.5" />
      <rect x="3.5" y="13" width="7" height="7" rx="1.5" />
    </BaseIcon>
  )
}

export function EditIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4 20h4.25L19 9.25 14.75 5 4 15.75V20Z" />
      <path d="m12.75 7 4.25 4.25" />
    </BaseIcon>
  )
}

export function LogoutIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M9.5 5H5v14h4.5" />
      <path d="M13 8.5 18 12l-5 3.5" />
      <path d="M18 12H8" />
    </BaseIcon>
  )
}

export function PlusIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </BaseIcon>
  )
}
