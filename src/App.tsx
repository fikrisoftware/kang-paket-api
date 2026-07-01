import { TooltipProvider } from './components/ui/tooltip'
import { AppShell } from './components/layout/AppShell'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import { Toaster } from './components/common/Toaster'

export default function App(): JSX.Element {
  return (
    <ErrorBoundary>
      <TooltipProvider delayDuration={400}>
        <AppShell />
        <Toaster />
      </TooltipProvider>
    </ErrorBoundary>
  )
}
