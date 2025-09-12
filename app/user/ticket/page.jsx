'use client'

import { useEffect, useState, Suspense, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Icon from '../../../helper/MaterialIcon'
import Nav from './../nav'
import { toast } from '@/components/Toaster'
import { getTicket, newTicket, updateTicket } from '../../../util/api'
import styles from './page.module.scss'
// import { getCategory, getFood } from '../util/api'

export default function Cart() {
  const [status, setStatus] = useState()
  const [data, setData] = useState()

  const handleForm = async (e) => {
    e.preventDefault()
    setStatus('loading')

    const formData = new FormData(e.target)
    const q = formData.get('q')
    const errors = {}

    const post = {
      q: q,
    }

    newTicket(post).then((res) => {
      console.log(res)
      toast(`${res.message}`, 'success')
      e.target.reset()
      getTicket().then((result) => {
        console.log(result)
        setData(result)
      })
    })
  }

  const asnwerStatus = (a) => {
    if (a === '0') return <span className={`badge badge-danger badge-pill`}>ثبت شده</span>
    else if (a === '1') return <span className={`badge badge-success badge-pill`}>پاسخ داده شده</span>
    else if (a === '2') return <span className={`badge badge-primary badge-pill`}>خوانده شده</span>
  }

  const toggle = (e, id,status) => {
    if (e.target.open && status === '1') {
      const data = { status: '2' }
      updateTicket(data, id).then((result) => {
        console.log(result)
      })
    }
  }

  useEffect(() => {
    getTicket().then((result) => {
      console.log(result)
      setData(result)
    })
  }, [])

  return (
    <div className={`${styles.page} ms-motion-slideDownIn`}>
      <div className={`__container`} data-width={`large`}>
        <div className="ms-Grid">
          <div className="ms-Grid-row">
            <Nav />
            <div className={`ms-Grid-col ms-sm12 ms-md12 ms-lg9`}>
              {data &&
              data.length > 0 &&
                data.map((item, i) => {
                  return (
                    <div key={i} className={`card mt-10`}>
                      <div className={`card__body`} style={{ padding: `.1rem` }}>
                        <details onToggle={(e) => toggle(e, item.id ,item.status)}>
                          <summary>
                            {item.q} {asnwerStatus(item.status)}
                          </summary>
                          <div>
                            {!item.a && <>هنوز پاسخی ثبت نشده است.</>}
                            {item.a}
                          </div>
                        </details>
                      </div>
                    </div>
                  )
                })}

              <div className={`grid grid--fit mt-20`} style={{ '--data-width': `200px` }}>
                <div className={`card`}>
                  <div className={`card__body`}>
                    <form action="" className={`form`} onSubmit={(e) => handleForm(e)}>
                      <div className="mt-10">
                        سوال:
                        <textarea name="q" id="" placeholder={`لطفا سوال خود را کامل شرح دهید`}></textarea>
                      </div>
                      <div>
                        <input className="btn  mt-20" style={{ padding: '1rem', background: `var(--color-primary)`, color: `var(--white)` }} type="submit" value="ارسال" />
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
