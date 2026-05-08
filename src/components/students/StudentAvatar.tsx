import type { Student } from '@/db/database'
import { useBlobUrl } from '@/hooks/useBlobUrl'
import { studentInitials } from '@/lib/studentInitials'
import { cn } from '@/lib/utils'

type Props = {
  student: Pick<Student, 'name' | 'profilePhoto'>
  className?: string
  /** Light initials on translucent circle (e.g. teal app header). */
  tone?: 'surface' | 'inverse'
}

/** Circle avatar: profile photo if set, otherwise initials. */
export function StudentAvatar({ student, className, tone = 'surface' }: Props) {
  const url = useBlobUrl(student.profilePhoto ?? null)

  if (url) {
    return (
      <img
        src={url}
        alt=""
        className={cn('rounded-full object-cover', className)}
      />
    )
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full font-semibold',
        tone === 'inverse'
          ? 'bg-[rgb(255_255_255_/_0.22)] text-[var(--theme-app-header-fg)]'
          : 'bg-[var(--theme-surface-muted)] text-[var(--theme-primary)]',
        className,
      )}
    >
      {studentInitials(student.name)}
    </div>
  )
}
