'use client'

import { useState, useEffect, useId, useRef } from 'react'
import Link from 'next/link'
import moment from 'moment'
import arattalabs from '@/public/arattalabs.svg'
import upIcon from '@/public/icons/up.png'
import logo from '@/public/logo.svg'
import { toast } from 'react-hot-toast'
import { initContract, getPrice, getADs, getAdLength, hasSpace } from '@/util/communication'
import { getProfile } from '@/util/api'
import Web3 from 'web3'
import ABI from '@/abi/universalads.json'
import LSP0ERC725Account from '@/abi/LSP0ERC725Account.json'
import { useUpProvider } from '@/contexts/UpProvider'
import { PinataSDK } from 'pinata'
import styles from './page.module.scss'

moment.defineLocale('en-short', {
  relativeTime: {
    future: 'in %s',
    past: '%s', //'%s ago'
    s: '1s',
    ss: '%ds',
    m: '1m',
    mm: '%dm',
    h: '1h',
    hh: '%dh',
    d: '1d',
    dd: '%dd',
    M: '1mo',
    MM: '%dmo',
    y: '1y',
    yy: '%dy',
  },
})

const pinata = new PinataSDK({
  pinataJwt: process.env.NEXT_PUBLIC_PINATA_API_KEY,
  pinataGateway: 'example-gateway.mypinata.cloud',
})

export default function Page() {
  const [modal, setModal] = useState('')
  const [adCounter, setAdCounter] = useState()
  const [price, setPrice] = useState()
  const [adSpace, setAdSpace] = useState()
  const [ads, setAds] = useState([])
  const { web3, contract } = initContract()
  const giftModal = useRef()
  const giftModalSendButton = useRef()
  const giftModalCancelButton = useRef()
  const giftModalMessage = useRef()
  const auth = useUpProvider()

  const fetchGrid = async (addr) => {
    //console.log(addr)
    var contract = new web3.eth.Contract(LSP0ERC725Account.abi, addr)
    try {
      return contract.methods
        .getData('0x724141d9918ce69e6b8afcf53a91748466086ba2c74b94cab43c649ae2ac23ff')
        .call()
        .then(async (data) => {
          console.log(data)
          if (data === `0x`) return false
          data = data.substring(6, data.length)
          // console.log(data)
          //  data ="0x" + data.substring(6)
          //  console.log(data)
          // slice the bytes to get its pieces
          const hashFunction = '0x' + data.slice(0, 8)
          // console.log(hashFunction)
          const hash = '0x' + data.slice(76)
          const url = '0x' + data.slice(76)

          // console.log(hashFunction, ' | ', hash, ' | ', url)

          // check if it uses keccak256
          //  if (hashFunction === '0x6f357c6a') {
          // download the json file
          const json = await getIPFS(web3.utils.hexToUtf8(url).replace('ipfs://', '').replace('://', ''))
          return json
          // compare hashes
          if (web3.utils.keccak256(JSON.stringify(json)) === hash.replace(hashFunction, '')) {
            return json
          } else false
          // }
        })
    } catch (error) {
      console.log(error)
      return false
    }
  }

  const toDate = (unix_timestamp) => {
    var date = new Date(unix_timestamp * 1000)

    // Hours part from the timestamp
    var hours = date.getHours()

    // Minutes part from the timestamp
    var minutes = '0' + date.getMinutes()

    // Seconds part from the timestamp
    var seconds = '0' + date.getSeconds()

    // Will display time in 10:30:23 format
    var formattedTime = hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2)
    return new Date(date).toString()
  }

  const getIPFS = async (CID) => {
    //  console.log(CID)
    let requestOptions = {
      method: 'GET',
      redirect: 'follow',
    }
    const response = await fetch(`https://api.universalprofile.cloud/ipfs/${CID}`, requestOptions)
    if (!response.ok) throw new Response('Failed to get data', { status: 500 })
    return response.json()
  }

  useEffect(() => {
    // console.log(auth.accounts)
    hasSpace().then((res) => {
      console.log(web3.utils.toNumber(res))
      setAdSpace(web3.utils.toNumber(res))
    })

    getAdLength().then((adLength) => {
      setAdCounter(web3.utils.toNumber(adLength))
      if (web3.utils.toNumber(adLength) > 0) {
        getADs(0, adLength).then((res) => {
          console.log(res)
          if (res.length > 0) {
            const adData = res.filter((filterItem) => filterItem.creator !== `0x0000000000000000000000000000000000000000`)
            setAds(adData)
          }
        })
      }
    })

    getPrice().then((price) => {
      console.log(price)
      const priceToEther = web3.utils.fromWei(web3.utils.toNumber(price), `ether`)
      setPrice(priceToEther)
    })
  }, [])

  return (
    <div className={`${styles.page} ms-motion-slideDownIn d-f-c flex-column gap-1`}>
      <div className={`__container ${styles.page__container}`} data-width={`large`}>
        {adSpace === 9 && (
          <div className={`${styles.ad} animate fade`}>
            <div className={`relative`}>
              <section data-name={``} className={`${styles.ad__item} flex flex-column align-items-start justify-content-between gap-1`}>
                <Link target={`_blank`} href={``} className={`flex flex-row align-items-center gap-025  ${styles.ad__pfp} `}>
                  <Profile addr={`0xeC006735e83BcC039657D6a1De16f6AC1d78B9BF`} />
                </Link>

                <Link target={`_blank`} href={`#`} className={`flex flex-row align-items-center gap-025  ${styles.ad__link} `}>
                  <div className={`${styles.ad__image} d-f-c`} data-title={``} style={{ '--src': `url("")` }}>
                    Your AD here
                  </div>
                </Link>

                <Link target={`_blank`} href={`https://profile.link/universalads@eC00`} className={`flex flex-row align-items-center gap-025  ${styles.copyright} `}>
                  <img alt={`UniversalADs`} src={logo.src} />
                </Link>
              </section>
            </div>
          </div>
        )}

        {adSpace !== 9 && ads.length > 0 && <AdSlider ads={ads} />}
      </div>

      <Link href={`/create`} className={`${styles.btnCreate} rounded`}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M11.25 12.75H5.5V11.25H11.25V5.5H12.75V11.25H18.5V12.75H12.75V18.5H11.25V12.75Z" fill="#424242" />
        </svg>
      </Link>

      <Link target={`_blank`} href={`//aratta.dev`} className={`${styles.link} `}>
        <img alt={`ArattaLabs`} src={arattalabs.src} />
      </Link>
    </div>
  )
}

const AdSlider = ({ ads }) => {
  const [activeAd, setActiveAd] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const { web3, contract } = initContract()

  
  const claimFee = async (e, adId) => {
    const t = toast.loading(`Waiting for transaction's confirmation`)

    try {
      // window.lukso
      //   .request({ method: 'eth_requestAccounts' })
      //   .then((accounts) => {
      const account = auth.accounts[0]

      fetchGrid(account)
        .then(async (res) => {
          console.log(res)
          if (!res) {
            toast.error(`Your wallet address is not eligible`)
            toast.dismiss(t)
            e.target.innerText = `Claim`
            return
          }

          const resres = res.LSP28TheGrid[0].grid.filter((item, id) => item.type === `IFRAME` && item.properties.src.search(`https://universalads.vercel.app/ad`) > -1)
          console.log(resres)
          if (resres < 1) {
            toast.error(`Your wallet address is not eligible`)
            toast.dismiss(t)
            e.target.innerText = `Claim`
            return
          }

          const web3 = new Web3(auth.provider)

          // Create a Contract instance
          const contract = new web3.eth.Contract(ABI, process.env.NEXT_PUBLIC_CONTRACT)
          contract.methods
            .claimFee(adId)
            .send({
              from: account,
            })
            .then((res) => {
              console.log(res) //res.events.tokenId

              // Run partyjs
              // party.confetti(document.querySelector(`.__container`), {
              //   count: party.variation.range(20, 40),
              //   shapes: ['coin'],
              // })

              toast.success(`Done`)

              e.target.innerText = `Claim`
              toast.dismiss(t)
            })
            .catch((error) => {
              e.target.innerText = `Claim`
              toast.dismiss(t)
            })
          // })
        })
        .catch((error) => {
          e.target.innerText = `Claim`
          // Handle error
          console.log(error, error.code)
          toast.dismiss(t)
          // Stop loader if error occured

          // 4001 - The request was rejected by the user
          // -32602 - The parameters were invalid
          // -32603- Internal error
        })
    } catch (error) {
      console.log(error)
      toast.dismiss(t)
      e.target.innerText = `Claim fee`
    }
  }


  useEffect(() => {
    let intervalId

    if (!isPaused) {
      // Only start interval if not paused
      intervalId = setInterval(() => {
        setActiveAd((prevActiveAd) => {
          if (prevActiveAd === ads.length - 1) {
            return 0
          }
          return prevActiveAd + 1
        })
      }, 9000)
    }

    // Cleanup function
    return () => clearInterval(intervalId)
  }, [ads.length, isPaused])

  return (
    <>
      <div
        className={`${styles.ad} animate fade`}
        onMouseEnter={() => setIsPaused(true)} // Pause on mouse over
        onMouseLeave={() => setIsPaused(false)}
      >
        <section data-name={ads[activeAd].title} className={`${styles.ad__item} flex flex-column align-items-start justify-content-between gap-1`}>
          <Link target={`_blank`} href={``} className={`flex flex-row align-items-center gap-025  ${styles.ad__pfp} `}>
            <Profile addr={ads[activeAd].creator} />
          </Link>

          {<button onClick={(e) => claimFee(e, web3.utils.toNumber(ads[activeAd].adIndex))}>Claim</button>}

     <Link target={`_blank`} href={`update`} className={`flex flex-row align-items-center gap-025  ${styles.ad__link} `}>
            Update
          </Link>
          <Link target={`_blank`} href={`${ads[activeAd].link}`} className={`flex flex-row align-items-center gap-025  ${styles.ad__link} `}>
            <div className={`${styles.ad__image}`} data-title={`${ads[activeAd].title}`} style={{ '--src': `url("${ads[activeAd].image}")` }} />
          </Link>

          <Link target={`_blank`} href={`https://profile.link/universalads@eC00`} className={`flex flex-row align-items-center gap-025  ${styles.copyright} `}>
            <img alt={`UniversalADs`} src={logo.src} />
          </Link>
        </section>
      </div>

      <ul className={`${styles.dots} rounded flex align-items-center justify-content-center gap-025`}>
        {isPaused ? (
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M3.05263 5.70042L5.70042 4L3.05263 2.29958V5.70042ZM4.00074 8C3.44747 8 2.92744 7.89502 2.44063 7.68505C1.95382 7.47509 1.53039 7.19014 1.17032 6.83021C0.810246 6.47028 0.525158 6.04702 0.315053 5.56042C0.105017 5.07382 0 4.55393 0 4.00074C0 3.44747 0.104982 2.92744 0.314947 2.44063C0.524912 1.95382 0.80986 1.53039 1.16979 1.17032C1.52972 0.810246 1.95298 0.525158 2.43958 0.315053C2.92618 0.105017 3.44607 0 3.99926 0C4.55253 0 5.07256 0.104982 5.55937 0.314947C6.04618 0.524912 6.46961 0.80986 6.82968 1.16979C7.18975 1.52972 7.47484 1.95298 7.68495 2.43958C7.89498 2.92618 8 3.44607 8 3.99926C8 4.55253 7.89502 5.07256 7.68505 5.55937C7.47509 6.04618 7.19014 6.46961 6.83021 6.82968C6.47028 7.18975 6.04702 7.47484 5.56042 7.68495C5.07382 7.89498 4.55393 8 4.00074 8Z"
              fill="white"
            />
          </svg>
        ) : (
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M2.90695 5.57895H3.53842V2.42105H2.90695V5.57895ZM4.46158 5.57895H5.09305V2.42105H4.46158V5.57895ZM4.00074 8C3.44747 8 2.92744 7.89502 2.44063 7.68505C1.95382 7.47509 1.53039 7.19014 1.17032 6.83021C0.810246 6.47028 0.525158 6.04702 0.315053 5.56042C0.105017 5.07382 0 4.55393 0 4.00074C0 3.44747 0.104982 2.92744 0.314947 2.44063C0.524912 1.95382 0.80986 1.53039 1.16979 1.17032C1.52972 0.810246 1.95298 0.525158 2.43958 0.315053C2.92618 0.105017 3.44607 0 3.99926 0C4.55253 0 5.07256 0.104982 5.55937 0.314947C6.04618 0.524912 6.46961 0.80986 6.82968 1.16979C7.18975 1.52972 7.47484 1.95298 7.68495 2.43958C7.89498 2.92618 8 3.44607 8 3.99926C8 4.55253 7.89502 5.07256 7.68505 5.55937C7.47509 6.04618 7.19014 6.46961 6.83021 6.82968C6.47028 7.18975 6.04702 7.47484 5.56042 7.68495C5.07382 7.89498 4.55393 8 4.00074 8Z"
              fill="white"
            />
          </svg>
        )}
        {ads.map((item, i) => {
          return (
            <li key={i} onClick={() => setActiveAd(i)}>
              <span style={{ width: activeAd === i ? `40px` : null }} data-active={activeAd === i ? true : null} />
            </li>
          )
        })}
      </ul>
    </>
  )
}

/**
 * Profile
 * @param {String} addr
 * @returns
 */
const Profile = ({ addr, createdAt }) => {
  console.log(addr)
  const [data, setData] = useState()
  const { web3, contract } = initContract()
  const auth = useUpProvider()

  useEffect(() => {
    getProfile(addr).then((data) => {
      console.log(data)
      setData(data)
    })
  }, [addr])

  if (!data || data.data) return <div className={`shimmer ${styles.shimmer}`} />
  return (
    <figure className={`${styles.profile} rounded flex flex-row align-items-center justify-content-start gap-050`}>
      <div className={` ${styles.profileImageWrapper}`}>
        <img
          alt={data.data.search_profiles[0].name || `Default PFP`}
          title={data.data.search_profiles[0].name}
          src={`${data.data.search_profiles[0].profileImages.length > 0 ? data.data.search_profiles[0].profileImages[0].src : 'https://ipfs.io/ipfs/bafkreiatl2iuudjiq354ic567bxd7jzhrixf5fh5e6x6uhdvl7xfrwxwzm'}`}
          className={`${styles.pfp} rounded`}
        />
        <img alt={`blue checkmark icon`} src={upIcon.src} />
      </div>
    </figure>
  )
}
