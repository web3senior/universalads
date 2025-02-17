import { useEffect, useState, Suspense, useRef } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import ABI from '../abi/UniversalADs.json'
import Web3 from 'web3'
import { web3, contract, useAuth, _, provider } from './../contexts/AuthContext'
// import { PinataSDK } from "pinata-web3"
import { PinataSDK } from 'pinata'
import styles from './Admin.module.scss'

// export const pinata = new PinataSDK({
//   pinataJwt: `${import.meta.env.VITE_PINATA_JWT}`,
//   pinataGateway: `${import.meta.env.VITE_GATEWAY_URL}`
// })
const pinata = new PinataSDK({
  pinataJwt: import.meta.env.VITE_PINATA_API_KEY,
  pinataGateway: 'example-gateway.mypinata.cloud',
})

// const web3 = new Web3(window.lukso)
// const contract = new web3.eth.Contract(ABI, import.meta.env.VITE_CONTRACT)
// const _ = web3.utils

function Page() {
  const [isLoading, setIsLoading] = useState(false)
  const [price, setPrice] = useState([])
  const [isThereActiveADs, setIsThereActiveADs] = useState()
  const [ad, setAd] = useState()
  const auth = useAuth()

  const getPrice = async () => await contract.methods.price().call()
  const getNow = async () => await contract.methods.time().call()
  const getEnd = async () => await contract.methods.end().call()
  const getAd = async () => await contract.methods.getAD().call()
  const getAllEmoji = async () => await contractReadOnly.methods.getAllEmoji().call()
  const getAllUserReaction = async () => await contractReadOnly.methods.getAllUserReaction(`${auth.contextAccounts[0]}`).call()
  const getIPFS = async (CID) => {
    //  console.log(CID)
    try {
      let requestOptions = {
        method: 'GET',
        redirect: 'follow',
      }
      const response = await fetch(`https://ipfs.io/ipfs/${CID}`, requestOptions)
      if (!response.ok) throw new Response('Failed to get data', { status: 500 })
      return response.json()
    } catch (error) {
      return 'null'
    }
  }

  const updateAD = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    const t = toast.loading(`Waiting for transaction's confirmation`)
    const formData = new FormData(e.target)

    //ToDO: upload on ipfs
    const title = formData.get('title')
    const link = formData.get('link')
    const image = formData.get('image')

    const upload = await pinata.upload.json({
      name: title,
      link: link,
      image: image,
    })

    const metadata = `${upload.IpfsHash}`

    try {
      //window.lukso.request({ method: 'eth_requestAccounts' }).then((accounts) => {
        const account = auth.accounts[0]

        contract.methods
          .updateAds(metadata)
          .send({
            from: account,
          })
          .then((res) => {
            console.log(res) //res.events.tokenId

            setIsLoading(true)

            toast.success(`Done`)
            toast.dismiss(t)
          })
          .catch((error) => {
            toast.dismiss(t)
          })
    //  })
    } catch (error) {
      console.log(error)
      toast.dismiss(t)
    }
  }

  const updateEmoji = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    const t = toast.loading(`Waiting for transaction's confirmation`)

    const formData = new FormData(e.target)
    const emojiId = formData.get('emojiId')
    const metadata = formData.get('metadata')
    const name = formData.get('name')
    const emoji = formData.get('emoji')
    const price = formData.get('price')
    const status = formData.get('status')

    try {
      window.lukso.request({ method: 'eth_requestAccounts' }).then((accounts) => {
        contract.methods
          .updateEmoji(emojiId, metadata, name, emoji, _.toWei(price, `ether`), String(status).toLowerCase() === 'true')
          .send({
            from: accounts[0],
          })
          .then((res) => {
            console.log(res) //res.events.tokenId

            setIsLoading(true)

            toast.success(`Done`)

            toast.dismiss(t)
          })
          .catch((error) => {
            toast.dismiss(t)
          })
      })
    } catch (error) {
      console.log(error)
      toast.dismiss(t)
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

  useEffect(() => {
    getPrice().then((res) => {
      console.log(res)
      setPrice(res)
    })

    getNow().then((now) => {
      getAd().then(async (ad) => {
        console.log(ad)
        setAd(ad)

        const info = await getIPFS(ad[4])
        ad.info = info

        setAd(ad)
        console.log(ad)
        if (_.toNumber(ad[1]) - _.toNumber(now) > 0) {
          setIsThereActiveADs(true)
        } else setIsThereActiveADs(false)
      })
    })
  }, [])

  return (
    <div className={`${styles.page} ms-motion-slideDownIn`}>
      <Toaster />
      <div className={`__container`} data-width={`xlarge`}>
        <div className={`grid grid--fit grid--gap-1 w-100`} style={{ '--data-width': `300px` }}>
          <div className="card">
            <div className="card__header d-flex align-items-center justify-content-between">Update AD</div>
            <div className="card__body">
              <p className="alert alert--danger">Only manager of the ad can update!</p>
              {/* {errors?.email && <span>{errors.email}</span>} */}

              {ad && (
                <>
                  <ul style={{ background: `var(--global-background-color)`, padding: `1rem`, borderRadius: `0.5rem` }} className="ms-depth-4 mb-10">
                    <li>
                      <b>Start:</b> {toDate(ad[0])}
                    </li>
                    <li>
                      <b>End:</b> {toDate(ad[1])}
                    </li>
                    <li>
                      <b>Duration:</b> {ad[2]} Days
                    </li>
                    <li>
                      <b>Amount:</b> {_.fromWei(ad[3], `ether`)} $LYX
                    </li>
                    <li>
                      <b>Mnagaer:</b> {ad[4]}
                    </li>
                    {ad.info && (
                      <>
                        <li>
                          <b>Name:</b> {ad.info.name}
                        </li>
                        <li>
                          <b>Link:</b> {ad.info.link}
                        </li>
                        <li>
                          <figure>
                            <img src={`https://ipfs.io/ipfs/${ad.info.image}`} style={{width: `200px`, height: `auto`}}/>
                          </figure>
                        </li>
                      </>
                    )}
                  </ul>
                </>
              )}

              <form onSubmit={(e) => updateAD(e)} className={`form d-flex flex-column`} style={{ rowGap: '1rem' }}>
                <div>
                  <input type="text" name="title" placeholder="Title" />
                </div>

                <div>
                  <input type="text" name="link" placeholder="Link" required />
                </div>

                <div>
                  <input type="text" name="image" placeholder="Image URL" required />
                </div>

                <button className="mt-20 btn" type="submit">
                  {isLoading ? 'Please wait...' : 'Update AD'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Page
