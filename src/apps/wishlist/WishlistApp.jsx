import { PlatformProvider } from '../../context/PlatformContext'
import Toast from '../../components/Toast'
import WishlistPage from './pages/WishlistPage'

export default function WishlistApp() {
  return <PlatformProvider><WishlistPage /><Toast /></PlatformProvider>
}
