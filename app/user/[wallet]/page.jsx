'use client'

import { useEffect, useState, Suspense, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Icon from '../../../helper/MaterialIcon'
import Nav from '../nav'
import blueCheckMarkIcon from '@/public/icons/blue-checkmark.svg'
import giftIcon from '@/public/icons/gift.svg'
import txIcon from '@/public/icons/tx.svg'
import logoLukso from '@/public/logos/lukso.svg'
import { useAuth } from '@/contexts/AuthContext'
import { useParams } from 'next/navigation'
import { getProfile, updateProfile } from '../../../util/api'
import { initContract, getEmoji, getAllReacted } from '@/util/communication'
import { toast } from '@/components/NextToast'
import styles from './page.module.scss'
// import { getCategory, getFood } from '../util/api'

export default function Page() {
  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState()
  const [activeTab, setActiveTab] = useState('posts') // New state for active tab
  const params = useParams()
  const auth = useAuth()
  const { web3, contract } = initContract()

  const handleForm = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.target)
    const fullname = formData.get('fullname')
    const phone = formData.get('phone')
    const address = formData.get('address')
    const wallet = formData.get('wallet')
    const errors = {}

    const post = {
      fullname: fullname,
      phone: phone,
      address: address,
      wallet: wallet,
    }

    updateProfile(post).then((res) => {
      console.log(res)
      toast(`${res.message}`, 'success')
    })
  }

  useEffect(() => {
    console.log(params.wallet)
    // toast(`test`, 'success')
    // console.log(auth)
    // getAllReacted().then((res) => {
    //   console.log(res)
    //   setData(res)
    // })
  }, [])

  return (
    <div className={`${styles.page} ms-motion-slideDownIn`}>
      <h2 className={`${styles.page__title} d-f-c`}>Profile</h2>

      <div className={`__container ${styles.page__container}`} data-width={`medium`}>
        <div className={`${styles.profileWrapper}`}>
          <Profile addr={params.wallet} />

          <ul className={`mt-20 flex flex-row align-items-center justify-content-between gap-10`}>
            <li className={`d-f-c flex-row align-items-start justify-content-center gap-025`}>
              <button className={`${styles.btnFollowers}`}>
                <span className={`mt-20 text-secondary`}>
                  <b>451</b> followers
                </span>
              </button>
              <span>•</span>
              <Link className={`${styles.link}`} target={`_blank`} href={`https://profile.link/arattalabs@0D5C`}>
                profile.link/arattalabs@0D5C
              </Link>
            </li>
            <li className={`d-f-c flex-row align-items-center justify-content-center gap-025`}>
              <figure className={`${styles.gift} rounded`}>
                <img alt={`Gift`} src={txIcon.src} />
              </figure>
              <figure className={`${styles.gift} rounded`}>
                <img alt={`Gift`} src={giftIcon.src} />
              </figure>
            </li>
          </ul>
        </div>

        <ul className={`${styles.tab} flex flex-row align-items-center justify-content-center mt-20 w-100`}>
          <li>
            <button className={activeTab === 'posts' ? styles.activeTab : ''} onClick={() => setActiveTab('posts')}>
              Posts <span className={`lable lable-dark`}>0</span>
            </button>
          </li>
          <li>
            <button className={activeTab === 'activity' ? styles.activeTab : ''} onClick={() => setActiveTab('activity')}>
              Activity
            </button>
          </li>
          <li>
            <button className={activeTab === 'repost' ? styles.activeTab : ''} onClick={() => setActiveTab('reposts')}>
              Reposts
            </button>
          </li>
        </ul>

        {activeTab === 'posts' && (
          <div className={`${styles.posts} d-f-c flex-column`}>
            <p>No posts yet.</p>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className={`${styles.activity} d-f-c flex-column`}>
            <p>No activity yet.</p>
          </div>
        )}

        {activeTab === 'reposts' && (
          <div className={`${styles.reposts} d-f-c flex-column`}>
            <p>No reposts yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Profile
 * @param {String} addr
 * @returns
 */
const Profile = ({ addr }) => {
  const [data, setData] = useState()
  const { web3, contract } = initContract()
  const auth = useAuth()

  useEffect(() => {
    getProfile(addr).then((data) => {
      console.log(data)
      setData(data)
    })
  }, [])

  if (!data) return <div className={`shimmer ${styles.shimmer}`} />
  return (
    <div className={`${styles.profile} flex flex-column align-items-start justify-content-start gap-050`}>
      <img
        alt={data.data.search_profiles[0].name || `PFP`}
        src={`${data.data.search_profiles[0].profileImages.length > 0 ? data.data.search_profiles[0].profileImages[0].src : 'https://ipfs.io/ipfs/bafkreiatl2iuudjiq354ic567bxd7jzhrixf5fh5e6x6uhdvl7xfrwxwzm'}`}
        className={`${styles.profile__pfp} rounded`}
      />
      <figcaption className={`flex flex-column align-items-start justify-content-center gap-025`}>
        <div className={`flex align-items-center gap-025`}>
          <h1>{data.data.search_profiles[0].name}</h1>
          <img className={`${styles.profile__checkmark}`} alt={`Checkmark`} src={blueCheckMarkIcon.src} />
        </div>
        {auth.walletConnected && (
          <>
            <code className={`${styles.profile__wallet}`}>
              <Link href={`https://explorer.lukso.network/address/${data.data.search_profiles[0].wallet}`} target={`_blank`} className={`text-secondary`}>
                {`${auth.accounts[0].slice(0, 4)}…${auth.accounts[0].slice(38)}`}
              </Link>
            </code>

            <p className={`${styles.profile__description} mt-20`}>{data.data.search_profiles[0].description || `This user has not set up a bio yet.`}</p>

            <ul className={`${styles.profile__tags} flex flex-row align-items-center gap-025 flex-wrap gap-025`}>
              {data.data.search_profiles[0].tags &&
                data.data.search_profiles[0].tags.map((tag, i) => (
                  <li key={i}>
                    <small>#{tag}</small>
                  </li>
                ))}
            </ul>
          </>
        )}
      </figcaption>
    </div>
  )
}
