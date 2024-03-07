import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import { use, useEffect, useState } from 'react'
import ClipLoader from "react-spinners/BeatLoader";


function openNow(data: any[]) {
  const days = ['U', 'M', 'T', 'W', 'R', 'F', 'S']
  const date = new Date()
  const dayOfWeek = days[date.getDay()]
  alert(dayOfWeek)
  let openNow = true;

  // determine if overlap with current time
  for (const event of data) {
    console.log(event)
    if (event["Days_in_week"].includes(dayOfWeek)) {
      // strt_time and stop_time are in format HH:MM:SS
      // use Date object to compare
      console.log(event["strt_time"])
      const start = new Date()
      start.setFullYear(date.getFullYear())
      start.setMonth(date.getMonth())
      start.setDate(date.getDate())
      start.setHours(event["strt_time"].split(":")[0])
      start.setMinutes(event["strt_time"].split(":")[1])
      start.setSeconds(event["strt_time"].split(":")[2])
      const end = new Date()
      end.setFullYear(date.getFullYear())
      end.setMonth(date.getMonth())
      end.setDate(date.getDate())
      end.setHours(event["stop_time"].split(":")[0])
      end.setMinutes(event["stop_time"].split(":")[1])
      end.setSeconds(event["stop_time"].split(":")[2])

      if (start <= date && date <= end) {
        openNow = false
        break
      }
    }
  }
  return openNow
}

export default function Home() {
  // get current day of week
  const term = '24W'
  // state for current buildings
  const [buildings, setBuildings] = useState([""])
  // state for current building
  const [currBuilding, setBuilding] = useState('')  
  const [openRooms, setOpenRooms] = useState([{building: "", room: ""}])


  useEffect(() => {
    setOpenRooms([]);
    (async () => {
      let data = await fetch('/api/getRooms')
      let {rooms, error} = await data.json()
      let buildingsMap = rooms.map((room:{building:string}) => room["building"]);
      setBuildings(Array.from(new Set(buildingsMap)))

      const open = []
      for (const room of rooms) {
        const building = room["building"]
        const num = room["room"] as string

        if (currBuilding != building || currBuilding == "") {
          continue;
        }

        const url = `/api/findRooms?term=${term}&building=${building}&room=${num.trim()}`
        console.log(url)
        const response = await fetch(url)
        const data = await response.json()
        if (data.error) {
          console.log(data.error)
        } else {
          if (openNow(data)) {
            open.push({building: building, room: num})
          }
        }
      }

      setOpenRooms(open)
    })()
  }, [currBuilding])

  return (
    <div className={styles.container}>
      <h1>classroom finder</h1>

      <select onChange={(e) => setBuilding(e.target.value)}>
        <option value="">Select a building</option>
        {buildings.map((building, i) => {
          return <option key={i} value={building}>{building}</option>
        }
        )}
      </select>

      <ul>
        {openRooms.length == 0 ? <ClipLoader
        color={"white"}
        loading={true}
        size={10}
        aria-label="Loading Spinner"
        data-testid="loader"
      /> : openRooms.map((room, i) => {
          return <li key={i}>{room.building} {room.room}</li>
        })}
      </ul>
    </div>
  )
}
