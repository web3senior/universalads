import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router'
import { web3, contract, useAuth, _, provider } from './../contexts/AuthContext'
import party from 'party-js'
import ABI from './../abi/UniversalADs.json'
import LSP0ERC725Account from '@lukso/lsp-smart-contracts/artifacts/LSP0ERC725Account.json'
import toast, { Toaster } from 'react-hot-toast'
import Web3 from 'web3'
import Hero from './../assets/hero.svg'
import styles from './Home.module.scss'

const web3ReadOnly = new Web3(import.meta.env.VITE_LUKSO_PROVIDER)
const contractReadOnly = new web3ReadOnly.eth.Contract(ABI, import.meta.env.VITE_CONTRACT)

function Home() {
  const [isThereActiveADs, setIsThereActiveADs] = useState()

  const getNow = async () => await contract.methods.time().call()
  const getEnd = async () => await contract.methods.end().call()
  const getAd = async () => await contract.methods.getAD().call()
  const getAllEmoji = async () => await contractReadOnly.methods.getAllEmoji().call()
  const getAllUserReaction = async () => await contractReadOnly.methods.getAllUserReaction(`${auth.contextAccounts[0]}`).call()

  const claimFee = async (e) => {
    const t = toast.loading(`Waiting for transaction's confirmation`)
    e.target.innerText = `Waiting...`
    if (typeof window.lukso === 'undefined') window.open('https://chromewebstore.google.com/detail/universal-profiles/abpickdkkbnbcoepogfhkhennhfhehfn?hl=en-US&utm_source=candyzap.com', '_blank')

    try {
      window.lukso
        .request({ method: 'eth_requestAccounts' })
        .then((accounts) => {
          const account = accounts[0]

          fetchGrid(account).then((res) => {

            if (!res) {
              toast.error(`Your wallet address is not eligible`)
              toast.dismiss(t)
              e.target.innerText = `Connect & Claim`
              return
            }
           
            // console.log(res[0].grid)
            // const resres = res[0].grid.filter((item, id) => item.type === `IFRAME` && item.properties.src.search(`universalads`) > -1)
            // console.log(resres)
            // if (resres < 1) {
            //   toast.error(`Your wallet address is not eligible`)
            //   toast.dismiss(t)
            //   e.target.innerText = `Connect & Claim`
            //   return
            // }
        

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

          })
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
      e.target.innerText = `Mint`
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
          if (data===`0x`) return false
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
    getNow().then((nowRes) => {
      getEnd().then((endRes) => {
        const now = _.toNumber(nowRes)
        const end = _.toNumber(endRes)
        if (end - now > 0) {
          setIsThereActiveADs(true)
          getAd().then((res) => {
            console.log(res)
          })
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
      </header>

      <main className={`${styles.main}`}>
        {!isThereActiveADs && <div className='alert alert--danger'>There is no active AD</div> }
        <div className={`grid grid--fit grid--gap-1`} style={{ '--data-width': `300px` }}>
          <div className={`${styles['create-card']} ms-depth-8 d-flex flex-column justify-content-between`}>
            <h2>Create Your AD</h2>
            <p>Design and launch your on-chain advertising campaign. Target your desired audience and start reaching new customers.</p>
            <div className={`d-flex flex-column`}>
              <a href={`/create`}>Create Ad</a>
            </div>
          </div>

          <div className={`${styles['claim-card']} ms-depth-8 d-flex flex-column justify-content-between`}>
            <h2>Claim Your Earnings</h2>
            <p>Withdraw your accumulated advertising revenue. Securely transfer your earnings to your wallet.</p>

            <div className={`d-flex flex-column`}>
              <small>2% ⏣LYX of the amount</small>
              <button onClick={(e) => claimFee(e)}>Claim Fees</button>
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
