import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

function IconBase({ children, ...props }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
      {...props}
    >
      {children}
    </svg>
  )
}

export function PlayIcon(props: IconProps) {
  return <IconBase {...props}><path d="m9 7 8 5-8 5V7Z" /></IconBase>
}

export function PlusIcon(props: IconProps) {
  return <IconBase {...props}><path d="M12 5v14M5 12h14" /></IconBase>
}

export function ArrowRightIcon(props: IconProps) {
  return <IconBase {...props}><path d="M5 12h14M13 6l6 6-6 6" /></IconBase>
}

export function LinkIcon(props: IconProps) {
  return <IconBase {...props}><path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.2 1.2M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.2-1.2" /></IconBase>
}

export function UsersIcon(props: IconProps) {
  return <IconBase {...props}><path d="M16 20v-1.5a4.5 4.5 0 0 0-4.5-4.5h-4A4.5 4.5 0 0 0 3 18.5V20M9.5 10.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM17 10.5a3 3 0 0 0 0-6M21 20v-1.5a4.5 4.5 0 0 0-3-4.24" /></IconBase>
}
