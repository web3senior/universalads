'use client'

import { useEffect, useState, Suspense, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Icon from './../../../helper/MaterialIcon'
// import NarshinClubBanner from './../../../public/narshin-club-banner.png'
import { getDashboard } from './../../../util/api'
import styles from './page.module.scss'

export default function Page() {
  const [data, setData] = useState()

  useEffect(() => {
    getDashboard().then((result) => {
      console.log(result)
      setData(result)
    })
  }, [])

  return (
    <div className={`${styles.page} ms-motion-slideDownIn`}>
      <h1>Lobby</h1>
      <div className={`card`}>
        <div className={`card__body`}>
          <span>User rate in the leaderboard</span>
          <h1>#3</h1>
        </div>
      </div>
      {data && (
        <div className={`grid grid--fit grid--gap-1`} style={{ '--data-width': `200px` }}>
          <div className={`card`}>
            <div className={`card__body`}>
              <span>Orders</span>
              <h1>{data.invoice}</h1>
            </div>
          </div>

          <div className={`card`}>
            <div className={`card__body`}>
              <span>Messages </span>
              <h1>{data.ticket_unread}</h1>
            </div>
          </div>

          <div className={`card`}>
            <div className={`card__body`}>
              <ul className={`d-flex align-items-center justify-content-between`}>
                <li>
                  <span>$DRIP</span>
                  <h1>{data.point}</h1>
                </li>
                <li></li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
