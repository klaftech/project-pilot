import { Link } from 'react-router'
import MainLogo from '/logo.webp'

// same shell as the login page, for the logged-out password pages
export default function AuthCardLayout({ children }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link to="/login" className="flex items-center gap-2 self-center font-medium">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <img src={MainLogo} alt="ProjectPilot" />
          </div>
          ProjectPilot
        </Link>
        {children}
      </div>
    </div>
  )
}
