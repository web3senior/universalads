import { Suspense } from 'react'
import PageTitle from '../../components/PageTitle'
import Game from './_components/Game'
import styles from './page.module.scss'

export default async function Page({ params, searchParams }) {
  return (
    <div className={`${styles.page} ms-motion-slideDownIn`}>
      <div className={`__container`} data-width={`large`}>
        <PageTitle title={`Game`} path={`../`} />
        <Suspense fallback={<div>Loading...</div>}>
          <Game />
        </Suspense>
      </div>
    </div>
  )
}