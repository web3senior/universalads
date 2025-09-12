'use client'

import Link from 'next/link'
import { Suspense } from 'react'
import { useEffect, useState } from 'react'
import { useFormStatus } from 'react-dom'
import logoLukso from '@/public/icons/heart.svg'
import Loading from '../../../components/Loading'
import { useAuth } from '../../../contexts/AuthContext'
import Web3 from 'web3'
import { initContract, getEmoji, getReaction } from '@/util/communication'
import moment from 'moment'
import DefaultPFP from './../../../public/default-pfp.svg'
import Shimmer from '../../../helper/Shimmer'
import styles from './Profiles.module.scss'

export default function Profiles() {
  const [emoji, setEmoji] = useState([])
  const [reaction, setReaction] = useState([])
  const [user, setUser] = useState([])
  const [LYX, setLYX] = useState()
const auth = useAuth()
  const { web3, contract } = initContract()

  const fetchData = async (dataURL) => {
    let requestOptions = {
      method: 'GET',
      redirect: 'follow',
    }
    const response = await fetch(`${dataURL}`, requestOptions)
    if (!response.ok) throw new Response('Failed to get data', { status: 500 })
    return response.json()
  }

  // function numberToBytes32(number) {
  //   const hex = web3.utils.toHex(number);
  //   return web3.utils.padLeft(hex, 64);
  // }

  const getChillwhaleData = async (addresses) => {
    const myHeaders = new Headers()
    myHeaders.append('Content-Type', `application/json`)
    myHeaders.append('Accept', `application/json`)

    const requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify({
        query: `query MyQuery {
  Asset(
    limit: 30
    where: {isLSP7: {_eq: false}, id: {_eq: "0x86e817172b5c07f7036bf8aa46e2db9063743a83"}}
  ) {
    id
    isLSP7
    lsp4TokenName
    lsp4TokenSymbol
    lsp4TokenType
    name
    totalSupply
    owner_id
    tokens(where: {formattedTokenId: {_in: ${JSON.stringify(addresses)}}}) {
      id
      formattedTokenId
      name
      images(limit: 1) {
        src
      }
      holders {
        profile_id
        profile {
          fullName
          profileImages(limit: 1) {
            src
          }
        }
      }
    }
  }
}`,
      }),
    }
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}`, requestOptions)
    if (!response.ok) {
      throw new Response('Failed to ', { status: 500 })
    }
    const data = await response.json()
    return data
  }

  const getProfiles = async (addresses) => {
    const myHeaders = new Headers()
    myHeaders.append('Content-Type', `application/json`)
    myHeaders.append('Accept', `application/json`)

    const requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify({
        query: `query MyQuery {
  Profile(where: {id: {_in: ${JSON.stringify(addresses)}}}) {
    name
    tags
    description
    fullName
    id
    isEOA
    isContract
    src
    profileImages {
      src
    }
  }
}`,
      }),
    }
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}`, requestOptions)
    if (!response.ok) {
      throw new Response('Failed to ', { status: 500 })
    }
    const data = await response.json()
    return data
  }

  const getLSP7Price = async (token) => {
    let requestOptions = {
      method: 'GET',
      redirect: 'follow',
    }

    const response = await fetch(`https://api.geckoterminal.com/api/v2/networks/lukso/tokens/${token}`, requestOptions)
    if (!response.ok) throw new Response('Failed to get data', { status: 500 })
    return response.json()
  }

  const getLYXPrice = async () => {
    let requestOptions = {
      method: 'GET',
      redirect: 'follow',
    }

    const response = await fetch(`https://api.diadata.org/v1/assetQuotation/Lukso/0x0000000000000000000000000000000000000000`, requestOptions)
    if (!response.ok) throw new Response('Failed to get data', { status: 500 })
    return response.json()
  }

  const toUsDollar = (price) => {
    console.log(web3.utils.toNumber(price))
    if (!LYX) return
    const amount = LYX * web3.utils.fromWei(web3.utils.toNumber(price), `ether`)
    return amount.toPrecision(4)
  }

  useEffect(() => {
    // getEmoji().then((res) => {
    //   console.log(res)
    //   if (res.length < 1) return
    //   setEmoji(res)
    // })

    // getReaction(auth.contextAccounts[0]).then(async (reactionData) => {
    //   console.log(reactionData)
    //   if (reactionData.length < 1) return
    //   setReaction(reactionData)

    //   let senders = []
    //   reactionData.forEach(item => senders.push(item.sender.toLowerCase()))
    //   console.log(senders)

    //   getProfiles(senders).then(res => {
    //     console.log(res)
    //     let users = []
    //     reactionData.forEach(react => {
    //       users.push(Object.assign(react, res.data.Profile.filter(profile => profile.id.toLowerCase() === react.sender.toLowerCase())[0]))
    //     })
    //     setUser(users)
    //   })

    //   getLYXPrice().then((res) => {
    //     console.log(parseFloat(res.Price))
    //     setLYX(parseFloat(res.Price))
    //   })

      // let responses_with_profile = []
      // await Promise.all(
      //   res.map(async (response, i) => {
      //     return getProfile(response.sender).then((profile) => {
      //       responses_with_profile.push(Object.assign(profile, response))
      //     })
      //   })
      // )
   // })
  }, [])

  // {reaction && reaction.sort((a, b) => web3.utils.toNumber(b.dt) - web3.utils.toNumber(a.dt)).map((item, i) => {
  return (
    <div className={`${styles.page} ms-motion-slideDownIn`}>
      {user.length === 0 && (
        <div className={`d-flex flex-column align-items-center justify-content-between w-100`}>
          <div className={`shimmer ${styles.shimmer}`} />
          <div className={`shimmer ${styles.shimmer}`} />
          <div className={`shimmer ${styles.shimmer}`} />
          <div className={`shimmer ${styles.shimmer}`} />
          <div className={`shimmer ${styles.shimmer}`} />
          <div className={`shimmer ${styles.shimmer}`} />
          <div className={`shimmer ${styles.shimmer}`} />
          <div className={`shimmer ${styles.shimmer}`} />
          <div className={`shimmer ${styles.shimmer}`} />
        </div>
      )}

      {user.length > 0 && user.sort((a, b) => web3.utils.toNumber(b.dt) - web3.utils.toNumber(a.dt)).map((item, i) => {
        return (
        
            <div key={i}  className={`${styles.item} grid grid--fit gap-1 w-100 mt-20`} style={{ '--data-width': `200px` }}>
              <div className={`${styles.profileContainer} d-flex flex-row align-items-center justify-content-between`}>
                <a target={`_blank`} href={`https://universaleverything.io/${item.sender}`}>
                  <div className={`${styles.pfp} `}>
                    <figure>
                      <img alt={item.fullname} title={item.id} src={item.profileImages.length > 0 && item.profileImages[0].src} className={`rounded`} />
                      <img alt={`♥`} src={`./emoji/${emoji.filter(filterItem => filterItem.emojiId === item.emojiId)[0].emoji}.svg`} />
                    </figure>
                    <div className={``}>
                      <b>{item.name}</b>
                      <small className={`text-secondary`}>{web3.utils.toUtf8(item.message)}</small>
                    </div>
                  </div>
                </a>
              </div>

              <div className={`${styles.priceContainer} d-flex flex-column align-items-end justify-content-between grid--gap-025`}>
                <p className={`text-center`}><code className={`text-secondary rounded`}>{moment.unix(web3.utils.toNumber(item.dt)).utc().fromNow()}</code></p>
                
               <div className={`d-flex flex-row align-items-center justify-content-between grid--gap-025`}>
                 <span className={`${styles.price} rounded`} title={new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', currencyDisplay: 'narrowSymbol' }).format(toUsDollar(item.price))}>
                  {web3.utils.fromWei(item.price, `ether`)}
                </span>

                <div className={`${styles.priceIcon} d-flex align-items-center rounded`}>
                  <img alt={`L`} src={logoLukso.src}/> 
                  <code>LYX</code>
                </div>
               </div>
              </div>
            </div>
        )
      }
      )}
    </div>
  )
}