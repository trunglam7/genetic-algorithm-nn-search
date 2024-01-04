
import styles from './page.module.css'
import dynamic from 'next/dynamic';

const GeneticAlgorithmSimulation = dynamic(
  () => import('./components/GeneticAlgorithmSimulation'),
  { ssr: false }
)

export default function Home() {
  return (
    <main className={styles.main}>
      <GeneticAlgorithmSimulation />
    </main>
  )
}
