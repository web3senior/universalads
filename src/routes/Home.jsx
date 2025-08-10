import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router'
import { web3, contract, useAuth, _, provider } from './../contexts/AuthContext'
import party from 'party-js'
import ABI from './../abi/UniversalADs.json'
import LSP0ERC725Account from '@lukso/lsp-smart-contracts/artifacts/LSP0ERC725Account.json'
import toast, { Toaster } from 'react-hot-toast'
import Web3 from 'web3'
import Hero from './../assets/hero.svg'
import moment from 'moment'
import styles from './Home.module.scss'

const web3ReadOnly = new Web3(import.meta.env.VITE_LUKSO_PROVIDER)
const contractReadOnly = new web3ReadOnly.eth.Contract(ABI, import.meta.env.VITE_CONTRACT)

function Home() {
  const [isThereActiveADs, setIsThereActiveADs] = useState()
  const [ad, setAd] = useState()
  const [balance, setBalance] = useState()
    const [totalClaim, setTotalClaim] = useState(0)
  const auth = useAuth()

  const getNow = async () => await contract.methods.time().call()
  const getEnd = async () => await contract.methods.end().call()
  const getTotalClaim = async () => await contract.methods._claimCounter().call()
  const getAd = async () => await contract.methods.getAD().call()
  const getBalance = async () => await contract.methods.getBalance().call()
  const getAllEmoji = async () => await contractReadOnly.methods.getAllEmoji().call()
  const getAllUserReaction = async () => await contractReadOnly.methods.getAllUserReaction(`${auth.contextAccounts[0]}`).call()

  const claimFee = async (e) => {
    const t = toast.loading(`Waiting for transaction's confirmation`)

    try {
      // window.lukso
      //   .request({ method: 'eth_requestAccounts' })
      //   .then((accounts) => {
          const account = auth.accounts[0]

          fetchGrid(account).then(async(res) => {
            console.log(res)
            if (!res) {
              toast.error(`Your wallet address is not eligible`)
              toast.dismiss(t)
              e.target.innerText = `Connect & Claim`
              return
            }

        
            const resres = res.LSP28TheGrid[0].grid.filter((item, id) => item.type === `IFRAME` && item.properties.src.search(`https://universalads.vercel.app/ad`) > -1)
            console.log(resres)
            if (resres < 1) {
              toast.error(`Your wallet address is not eligible`)
              toast.dismiss(t)
              e.target.innerText = `Connect & Claim`
              return
            }


            contract.methods
              .claim()
              .send({
                from: account,
              })
              .then((res) => {
                console.log(res) //res.events.tokenId

                // Run partyjs
                party.confetti(document.querySelector(`.__container`), {
                  count: party.variation.range(20, 40),
                  shapes: ['coin'],
                })

                toast.success(`Done`)

                e.target.innerText = `Connect & Claim`
                toast.dismiss(t)
              })
              .catch((error) => {
                e.target.innerText = `Connect & Claim`
                toast.dismiss(t)
              })
          // })
        })
        .catch((error) => {
          e.target.innerText = `Connect & Claim`
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
    getTotalClaim().then((res) => {
      console.log(res)
      setTotalClaim(res)
    })

    getBalance().then((res) => {
      console.log(res)
      setBalance(_.fromWei(res))
    })

    getNow().then((now) => {
      getAd().then(async (ad) => {
        console.log(ad)
        const info = await getIPFS(ad[4])
        ad.info = info
        setAd(ad)
        console.log(ad)
        if (_.toNumber(ad[0]) > _.toNumber(now)) {
          setIsThereActiveADs(true)
        } else setIsThereActiveADs(false)
      })
    })
  }, [])

  return (
    <div className={`${styles.page} __container`} data-width={`large`}>
      <Toaster />
      <header className={`${styles.header} d-flex flex-column align-items-center justify-content-between`}>
        <figure className={`ms-motion-slideDownIn ms-depth-16 rounded`}>
          <img className={styles.nft} src="/logo.svg" alt={`${import.meta.env.VITE_NAME}`} width={96} height={96} />
        </figure>
        <h3>
          Welcome to <span style={{ fontFamily: `var(--ff-coves)`, fontWeight: `bold` }}>{import.meta.env.VITE_NAME}</span>!
        </h3>
        <h1>Start by creating an AD</h1>
        <small>Total claim: {totalClaim}</small>
      </header>

      <main className={`${styles.main}`}>
        {!isThereActiveADs && <div className="alert alert--danger">There is no active AD</div>}
        {ad && (
          <>
            <div className={`alert alert--success`} title={moment.unix(ad[0]).utc()}>
              <b>Expiration: </b>
              {moment.unix(ad[0]).utc().fromNow()}
              <br/>
              <b>Amount:</b> 2 % of {_.fromWei(ad[2], `ether`)} $LYX | {balance} $LYX left
            </div>
    
          </>
        )}

        <div className={`grid grid--fit grid--gap-1`} style={{ '--data-width': `300px` }}>
          <div className={`${styles['create-card']} ms-depth-8 d-flex flex-column justify-content-between`}>
            <h2>Create Your AD</h2>
            <p>Design and launch your on-chain advertising campaign. Target your desired audience and start reaching new customers.</p>
            <div className={`d-flex flex-row grid--gap-1`}>
            <a className='flex-fill' href={`/create`}>Create Ad</a>
            <a className='' href={`/update`}>Update Ad</a>
            </div>
          </div>

          <div className={`${styles['claim-card']} ms-depth-8 d-flex flex-column justify-content-between`}>
            <h2>Claim Your Earnings</h2>
            <p>Withdraw your accumulated advertising revenue. Securely transfer your earnings to your wallet.</p>

            <div className={`d-flex flex-column`}>
              <small>2% ⏣LYX of the amount</small>
              <button className="btn" onClick={(e) => claimFee(e)}>
                Claim Fees
              </button>
            </div>
          </div>
        </div>

        {/* <div className={`${styles.profiles} d-flex flex-column align-items-center justify-content-center`}>
          <p>400+ profiles have integrated advertising into their GRID.</p>
        </div> */}
      </main>
    </div>
  )
}

export default Home
