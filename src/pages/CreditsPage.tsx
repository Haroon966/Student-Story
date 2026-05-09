import { Button } from '@/components/ui/button'
import licenseText from '../../LICENSE?raw'
import { ChevronLeft, ExternalLink, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'

const SOURCE_REPO    = 'https://github.com/Haroon966/Student-Story'
const GITHUB_PROFILE = 'https://github.com/Haroon966'
const GITHUB_AVATAR  = `${GITHUB_PROFILE}.png`

export function CreditsPage() {
  return (
    <div className="flex flex-1 flex-col gap-5 px-3 pb-8 pt-4 sm:px-4">

      {/* Back nav */}
      <div>
        <Button asChild variant="ghost" size="sm" className="gap-1.5 px-2">
          <Link to="/settings"><ChevronLeft className="size-4" aria-hidden />Settings</Link>
        </Button>
      </div>

      {/* Heading */}
      <div>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--theme-charcoal)', letterSpacing: 'var(--tracking-tight)', lineHeight: 'var(--leading-tight)' }}>
          Credits &amp; license
        </h1>
        <p className="mt-1" style={{ fontSize: 'var(--text-sm)', color: 'var(--theme-charcoal-muted)', lineHeight: 'var(--leading-body)' }}>
          Attribution as required by the project license — thanks for using Student Story.
        </p>
      </div>

      {/* Creator card */}
      <div
        className="flex flex-wrap items-start gap-5 overflow-hidden rounded-[var(--radius-lg)] border p-5"
        style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-surface)', boxShadow: 'var(--shadow-sm)' }}
      >
        <a
          href={GITHUB_PROFILE}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 rounded-[var(--radius-full)] transition-opacity hover:opacity-90"
          style={{
            outline: 'none',
            boxShadow: '0 0 0 2px var(--theme-primary), 0 0 0 4px var(--theme-primary-soft)',
          }}
          aria-label="Creator GitHub profile (opens in new tab)"
        >
          <img
            src={GITHUB_AVATAR}
            alt=""
            width={80}
            height={80}
            loading="lazy"
            decoding="async"
            className="rounded-[var(--radius-full)] object-cover"
            style={{ width: '80px', height: '80px' }}
          />
        </a>

        <div className="min-w-0 flex-1 space-y-1">
          <p style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--theme-charcoal)', letterSpacing: 'var(--tracking-tight)', lineHeight: 'var(--leading-tight)' }}>
            Student Story
          </p>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--theme-charcoal-muted)', lineHeight: 'var(--leading-body)' }}>
            Original creator: <span className="font-semibold" style={{ color: 'var(--theme-charcoal)' }}>Olufsen</span>
          </p>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--theme-charcoal-muted)', lineHeight: 'var(--leading-snug)' }}>
            GitHub avatar loads from github.com — requires an active connection.
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button asChild variant="outline" size="sm" className="gap-2">
              <a href={GITHUB_PROFILE} target="_blank" rel="noreferrer">
                <UserRound className="size-4" aria-hidden />
                GitHub profile
                <ExternalLink className="size-3 opacity-60" aria-hidden />
              </a>
            </Button>
            <Button asChild variant="outline" size="sm" className="gap-2">
              <a href={SOURCE_REPO} target="_blank" rel="noreferrer">
                Source repository
                <ExternalLink className="size-3 opacity-60" aria-hidden />
              </a>
            </Button>
          </div>
        </div>
      </div>

      {/* License text card */}
      <div
        className="overflow-hidden rounded-[var(--radius-lg)] border"
        style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-surface)', boxShadow: 'var(--shadow-sm)' }}
      >
        <div className="border-b px-5 pt-5 pb-3" style={{ borderColor: 'var(--theme-border)' }}>
          <p className="font-semibold" style={{ fontSize: 'var(--text-base)', color: 'var(--theme-charcoal)', lineHeight: 'var(--leading-tight)' }}>
            License text
          </p>
          <p className="mt-0.5" style={{ fontSize: 'var(--text-sm)', color: 'var(--theme-charcoal-muted)', lineHeight: 'var(--leading-snug)' }}>
            Same wording as the{' '}
            <code
              className="rounded px-1 py-0.5"
              style={{ fontSize: 'var(--text-xs)', background: 'var(--theme-surface-muted)', color: 'var(--theme-charcoal)' }}
            >
              LICENSE
            </code>{' '}
            file in the repository.
          </p>
        </div>
        <div className="p-5">
          <pre
            className="overflow-y-auto whitespace-pre-wrap break-words rounded-[var(--radius-md)] border p-4 font-mono"
            style={{
              maxHeight: 'min(28rem, 55vh)',
              fontSize: 'var(--text-xs)',
              lineHeight: 'var(--leading-loose)',
              borderColor: 'var(--theme-border)',
              background: 'var(--theme-surface-muted)',
              color: 'var(--theme-charcoal)',
            }}
          >
            {licenseText.trim()}
          </pre>
        </div>
      </div>

    </div>
  )
}
