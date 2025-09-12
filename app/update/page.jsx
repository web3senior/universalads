'use client'

import { useState, useEffect, useId, useRef } from 'react'
import Link from 'next/link'
import moment from 'moment'
import { initContract, getPrice, getADs, getAdLength, hasSpace } from '@/util/communication'
import Web3 from 'web3'
import ABI from '@/abi/universalads.json'
import { useUpProvider } from '@/contexts/UpProvider'
import { PinataSDK } from 'pinata'
import styles from './page.module.scss'
import toast from 'react-hot-toast'

// moment.defineLocale('en-short', {
//   relativeTime: {
//     future: 'in %s',
//     past: '%s ago', //'%s ago'
//     s: '1s',
//     ss: '%ds',
//     m: '1m',
//     mm: '%dm',
//     h: '1h',
//     hh: '%dh',
//     d: '1d',
//     dd: '%dd',
//     M: '1mo',
//     MM: '%dmo',
//     y: '1y',
//     yy: '%dy',
//   },
// })

const pinata = new PinataSDK({
  pinataJwt: process.env.NEXT_PUBLIC_PINATA_API_KEY,
  pinataGateway: 'example-gateway.mypinata.cloud',
})

export default function Page() {
  const [adCounter, setAdCounter] = useState()
  const [duration, setDuration] = useState()
  const [price, setPrice] = useState()
  const [amount, setAmount] = useState()
  const [ownerFee, setOwnerFee] = useState()
  const [claimFee, setClaimFee] = useState()
  const [adSpace, setAdSpace] = useState()
  const [dTitle, setDTitle] = useState('')
  const [dLink, setDLink] = useState('')
  const [dImage, setDImage] = useState('')
  const { web3, contract } = initContract()
  const giftModal = useRef()
  const giftModalSendButton = useRef()
  const giftModalCancelButton = useRef()
  const giftModalMessage = useRef()

  const auth = useUpProvider()
  const [ads, setAds] = useState([])
  const [status, setStatus] = useState('')

  const updateAd = async (e) => {
    e.preventDefault()
    //setIsLoading(true)
    //const t = toast.loading(`Waiting for transaction's confirmation`)
    const formData = new FormData(e.target)
    // let startDate = document.querySelector(`[name="startDate"]`).valueAsNumber
    // startDate = startDate.toString().slice(0, startDate.toString().length - 3)

    //ToDO: upload on ipfs
    const adId = formData.get('adId')
    const title = formData.get('title')
    const link = formData.get('link')
    const image = formData.get('image')
    // const upload = await pinata.upload.json({
    //   name: title,
    //   link: link,
    //   image: image,
    // })
    // const metadata = `${upload.IpfsHash}`

    const web3 = new Web3(auth.provider)

    // Create a Contract instance
    const contract = new web3.eth.Contract(ABI, process.env.NEXT_PUBLIC_CONTRACT)

    // console.log(metadata, duration, _.toWei(duration, `ether`))
    try {
      // window.lukso.request({ method: 'eth_requestAccounts' }).then((accounts) => {
      contract.methods
        .updateAd(adId, '', title, image, link)
        .send({
          from: auth.accounts[0],
        })
        .then((res) => {
          console.log(res) //res.events.tokenId
          toast.success(`Updated`)
          //setIsLoading(true)
        })
        .catch((error) => {
          console.log(error)
        })
      // })
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    // console.log(auth.accounts)

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
    <div className={`${styles.page} ms-motion-slideDownIn`}>
      <div className={`__container ${styles.page__container}`} data-width={`medium`}>
        <Link href={`/`} className={`d-f-c`}>
          Back
        </Link>

        <div className={`${styles.form}`}>
          <form onSubmit={(e) => updateAd(e)} className={`mt-10 form flex flex-column gap-050`}>
            <div>
              <label htmlFor="">Select ad</label>

              <select
                name="adId"
                id=""
                required
                onChange={(e) => {
                  const selectedAd = ads.filter((filterItem) => web3.utils.toNumber(filterItem.adIndex) === e.target.value)
                  console.log(typeof e.target.value)
                  setDTitle(selectedAd.title)
                }}
              >
                <option value="">select</option>
                {ads &&
                  ads.length > 0 &&
                  ads.map((item, i) => (
                    <option key={i} value={web3.utils.toNumber(item.adIndex)}>
                      {item.title} {` | `}
                      {moment.unix(web3.utils.toNumber(item.endTime)).utc().fromNow()}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <input type="text" name="title" defaultValue={dTitle} placeholder={`Title`} />
            </div>

            <div>
              <input type="text" name="link" defaultValue={dLink} placeholder={`Link`} />
            </div>

            <div>
              <input type="text" name="image" defaultValue={dImage} placeholder={`Image url`} required />
            </div>

            <button className="mt-20" type="submit">
              {status === `loading` ? 'Please wait...' : 'Update ad'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
