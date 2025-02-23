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

function Admin() {
  const [isLoading, setIsLoading] = useState(false)
  const [price, setPrice] = useState([])

  const getPrice = async () => await contract.methods.price().call()

  const createAD = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    const t = toast.loading(`Waiting for transaction's confirmation`)
    const formData = new FormData(e.target)
    // let startDate = document.querySelector(`[name="startDate"]`).valueAsNumber
    // startDate = startDate.toString().slice(0, startDate.toString().length - 3)

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
    const duration = formData.get('duration')
    console.log(metadata, duration, _.toWei(duration, `ether`))
    try {
      window.lukso.request({ method: 'eth_requestAccounts' }).then((accounts) => {
        contract.methods
          .advertiser(metadata, duration)
          .send({
            from: accounts[0],
            value: price * duration,
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

  useEffect(() => {
    getPrice().then((res) => {
      console.log(res)
      setPrice(res)
    })
  }, [])

  return (
    <div className={`${styles.page} ms-motion-slideDownIn`}>
      <Toaster />
      <div className={`__container`} data-width={`xlarge`}>
        <div className={`grid grid--fit grid--gap-1 w-100`} style={{ '--data-width': `300px` }}>
          <div className="card">
            <div className="card__header d-flex align-items-center justify-content-between">New AD</div>
            <div className="card__body">
              {/* {errors?.email && <span>{errors.email}</span>} */}
              <form onSubmit={(e) => createAD(e)} className={`form d-flex flex-column`} style={{ rowGap: '1rem' }}>
                <div>
                  <input type="text" name="title" placeholder="Title" />
                </div>

                <div>
                  <input type="text" name="link" placeholder="Link" required />
                </div>

                <div>
                  <input type="text" name="image" placeholder="Image URL" required />
                </div>

                <div>
                  <label htmlFor="">Days: </label>
                  <input type="number" name="duration" id="" defaultValue={1} />
                  <small>Price per day: 1 LYX</small>
                </div>
                <button className="mt-20 btn" type="submit">
                  {isLoading ? 'Please wait...' : 'Create new AD'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Admin
