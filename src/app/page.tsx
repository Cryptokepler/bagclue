import HeroEditorial from '@/components/home/HeroEditorial'
import FromParis from '@/components/home/FromParis'
import NewArrivals from '@/components/home/NewArrivals'
import ClientExperience from '@/components/home/ClientExperience'
import TrustAuthenticity from '@/components/home/TrustAuthenticity'

export const dynamic = 'force-dynamic'
export const revalidate = 60

export default async function Home() {
  return (
    <div className="min-h-screen">
      <HeroEditorial />
      <FromParis />
      <NewArrivals />
      <ClientExperience />
      <TrustAuthenticity />
    </div>
  )
}
