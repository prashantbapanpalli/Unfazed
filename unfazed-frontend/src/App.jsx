import AppRoutes from './routes/AppRoutes'
import { UpgradeModal } from './components/common/UpgradePrompt'

export default function App() {
  return (
    <>
      <AppRoutes />
      <footer className="py-4 text-center text-xs text-slate-400">Unlox Major Project | B Prashant</footer>
      <UpgradeModal />
    </>
  )
}
