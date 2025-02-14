import { useEffect, useState, Suspense, useRef } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import ABI from '../abi/UniversalADs.json'
import Web3 from 'web3'
import styles from './Admin.module.scss'

const web3 = new Web3(window.lukso)
const contract = new web3.eth.Contract(ABI, import.meta.env.VITE_CONTRACT)
const _ = web3.utils

function Admin() {
  const [isLoading, setIsLoading] = useState(false)
  const [price, setPrice] = useState([])

  const getPrice = async () => await contract.methods.price().call()

  const createAD = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.target)
    let startDate = document.querySelector(`[name="startDate"]`).valueAsNumber
    startDate = startDate.toString().slice(0, startDate.toString().length - 3)
    let endDate = document.querySelector(`[name="endDate"]`).valueAsNumber
    endDate = endDate.toString().slice(0, endDate.toString().length - 3)

    //ToDO: upload on ipfs
    const title = formData.get('title')
    const link = formData.get('link')
    const image = formData.get('image')

    const metadata = `bafkreib4d3hsayvqdseezzozwozws2chdyeowt4wvennoqcupbshe7ehdy`
    const duration = formData.get('duration')
    console.log(startDate, endDate, metadata, duration, _.toWei(duration, `ether`))
    try {
      window.lukso.request({ method: 'eth_requestAccounts' }).then((accounts) => {
        contract.methods
          .advertiser(startDate, endDate, metadata, duration)
          .send({
            from: accounts[0],
            value: price,
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
                  Start:
                  <input type="datetime-local" name="startDate" id="" />
                </div>

                <div>
                  End:
                  <input type="datetime-local" name="endDate" id="" />
                </div>

                <div>
                  <input type="text" name="title" placeholder="Title" />
                </div>

                <div>
                  <input type="text" name="link" placeholder="Link" required />
                </div>

                <div>
                  <input type="text" name="Image" placeholder="Image" required />
                </div>

                <div>
                  <label htmlFor="">Duration: </label>
                  <input type="number" name="duration" id="" defaultValue={1} />
                  <small>days</small>
                </div>
                <button className="mt-20 btn" type="submit">
                  {isLoading ? 'Please wait...' : 'Submit'}
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
