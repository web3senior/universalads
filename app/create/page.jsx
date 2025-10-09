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
  const [adCounter, setAdCounter] = useState()
  const [duration, setDuration] = useState()
  const [price, setPrice] = useState()
  const [amount, setAmount] = useState()
  const [ownerFee, setOwnerFee] = useState()
  const [claimFee, setClaimFee] = useState()
  const [adSpace, setAdSpace] = useState()
  const { web3, contract } = initContract()
  const giftModal = useRef()
  const giftModalSendButton = useRef()
  const giftModalCancelButton = useRef()
  const giftModalMessage = useRef()
  const auth = useUpProvider()
  const [status, setStatus] = useState('')

  const createAD = async (e) => {
    e.preventDefault()
    //setIsLoading(true)
    const t = toast.loading(`Waiting for transaction's confirmation`)
    const formData = new FormData(e.target)
    // let startDate = document.querySelector(`[name="startDate"]`).valueAsNumber
    // startDate = startDate.toString().slice(0, startDate.toString().length - 3)

    //ToDO: upload on ipfs
    const title = formData.get('title')
    const link = formData.get('link')
    const image = formData.get('image')
    const duration = formData.get('duration')
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
      //  window.lukso.request({ method: 'eth_requestAccounts' }).then((accounts) => {
      contract.methods
        .newAd('', title, image, link, duration)
        .send({
          from: auth.accounts[0],
          value: web3.utils.toWei(price * duration, `ether`),
        })
        .then((res) => {
          console.log(res) //res.events.tokenId
          toast.dismiss(t)
          toast.success(`Done`)
          //    setIsLoading(true)
        })
        .catch((error) => {
          console.log(error)
        })
      //})
    } catch (error) {
      console.log(error)
    }
  }

  const calculateTransactionDetails = (e) => {
    setDuration(e.target.value)
    setAmount((e.target.value * price).toFixed(2))
    setOwnerFee((((e.target.value * price) / 100) * 5).toFixed(6))
    setClaimFee((((e.target.value * price) / 100) * 2).toFixed(6))
  }

  useEffect(() => {
    // console.log(auth.accounts)
    hasSpace().then((res) => {
      console.log(web3.utils.toNumber(res))
      setAdSpace(web3.utils.toNumber(res))
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
        <div className={`grid grid--fit grid--gap-1`} style={{ '--data-width': `80px` }}>
          <div className={`card  border border--light`}>
            <div className={`card__body`}>
              <span>Price</span>
              <h2>{!price ? `Reading...` : price} LYX</h2>
              <small style={{color:`#999`}}>Price per day</small>
            </div>
          </div>

          <div className={`card border border--light`}>
            <div className={`card__body`}>
              <span>Host Fee</span>
              <h2>2%</h2>
              <small style={{color:`#999`}}>Fee that the UP that hosts the ad receives</small>
            </div>
          </div>

          <div className={`card border border--light`}>
            <div className={`card__body`}>
              <span>Available ads</span>
              <h2>{adSpace === 0 ? 'No space' : adSpace - 1} of 8</h2>
            </div>
          </div>
        </div>

        <div className={`${styles.form}`}>
          <form onSubmit={(e) => createAD(e)} className={`form flex flex-column gap-050`}>
            <div>
              <input type="text" name="title" placeholder={`Title`} />
            </div>

            <div>
              <input type="text" name="link" placeholder={`Link`} />
            </div>

            <div>
              <input type="text" name="image" placeholder={`Image url`} required />
            </div>

            <div>
              <input type="number" name="duration" id="" onChange={(e) => calculateTransactionDetails(e)} placeholder={`Days`} min={1} max={90} />
            </div>

            {duration && (
              <>
                <output>
                  <h3>Transaction details</h3>
                  <ul className={`flex flex-column align-items-center justify-content-between gap-025`}>
                    <li className={`w-100 flex align-items-center justify-content-between`}>
                      <span>Price</span>
                      <code>{price && `${price} LYX`}</code>
                    </li>
                    <li className={`w-100 flex align-items-center justify-content-between`}>
                      <span>Duration</span>
                      <code>{duration && `${duration} DAYS`}</code>
                    </li>
                    <li className={`w-100 flex align-items-center justify-content-between`}>
                      <span>Amount</span>
                      <code>{amount && `${amount} LYX`}</code>
                    </li>
                    <li className={`w-100 flex align-items-center justify-content-between`}>
                      <span>Owner fee</span>
                      <code>{ownerFee && `${ownerFee} LYX`} (5%)</code>
                    </li>
                    <li className={`w-100 flex align-items-center justify-content-between`}>
                      <span>Claim Per Profile</span>
                      <code>{claimFee && `${claimFee} LYX`} (2%)</code>
                    </li>
                    <li className={`w-100 flex align-items-center justify-content-between`}>
                      <span>Supported profiles</span>
                      <code>{`${((amount - ownerFee) / claimFee).toFixed(0)} USERS`}</code>
                    </li>
                  </ul>
                </output>
              </>
            )}

            <button className="mt-20" type="submit">
              {status === `loading` ? 'Please wait...' : 'Create ad'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
