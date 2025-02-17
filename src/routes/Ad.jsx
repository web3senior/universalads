import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router'
import { web3, contract, useAuth, _, provider } from './../contexts/AuthContext'
import party from 'party-js'
import ABI from './../abi/UniversalADs.json'
import LSP0ERC725Account from '@lukso/lsp-smart-contracts/artifacts/LSP0ERC725Account.json'
import toast, { Toaster } from 'react-hot-toast'
import Web3 from 'web3'
import Hero from './../assets/hero.svg'
import styles from './Ad.module.scss'

const web3ReadOnly = new Web3(import.meta.env.VITE_LUKSO_PROVIDER)
const contractReadOnly = new web3ReadOnly.eth.Contract(ABI, import.meta.env.VITE_CONTRACT)

function Ad() {
  const [isThereActiveADs, setIsThereActiveADs] = useState(false)
  const [ad, setAd] = useState()

  const getNow = async () => await contract.methods.time().call()
  const getEnd = async () => await contract.methods.end().call()
  const getAd = async () => await contract.methods.getAD().call()
  const getAllEmoji = async () => await contractReadOnly.methods.getAllEmoji().call()
  const getAllUserReaction = async () => await contractReadOnly.methods.getAllUserReaction(`${auth.contextAccounts[0]}`).call()

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
    getNow().then((now) => {
      console.log(now)
      getAd().then(async (ad) => {
        console.log(ad)
        const info = await getIPFS(ad[4])
        ad.info = info
        console.log(ad)
        if (_.toNumber(ad[0]) > _.toNumber(now)) {
          setIsThereActiveADs(true)
          setAd(ad)
        } else setIsThereActiveADs(false)
      })
    })
  }, [])

  return (
    <div className={`${styles.page} __container`} data-width={`large`}>
      <Toaster />
      <main className={`${styles.main}`}>
      {!isThereActiveADs && <div className="alert alert--danger">There is no active AD</div>}
        {ad && (
         <a href={ad.info.link} target='_blank'>
  <figure>
           <img src={`https://ipfs.io/ipfs/${ad.info.image}`} />
         </figure>
         </a>
        )}

      </main>
    </div>
  )
}

export default Ad
