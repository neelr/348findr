import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import { use, useEffect, useState } from 'react'
import ClipLoader from "react-spinners/BeatLoader";


const LoadingBar = (props: {percent: number}) => {
  // custom loading bar
  return (
    <div>
      <div className="loading-bar" style={{width: "100px", height: "10px", backgroundColor: "lightgrey", borderRadius: "10px"}}>
        <div className="filler" style={{width: `${props.percent}%`, height: "100%", backgroundColor: "aquamarine", borderRadius: "inherit",
      borderWidth: "1px", borderColor: "black", borderStyle: "solid"}}>
        </div>
        </div>
    </div>
  )
}

function openNow(data: any[]) : [boolean, {strt_time: string, stop_time: string}] {
  const days = ['U', 'M', 'T', 'W', 'R', 'F', 'S']
  const date = new Date()
  const dayOfWeek = days[date.getDay()]
  let openNow = true;

  let closestTime = {
    strt_time: "23:59:59",
    stop_time: "00:00:00"
  }
  
  let delta = Infinity;
  // determine if overlap with current time
  for (const event of data) {
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
        delta = start.getTime() - date.getTime()
        openNow = false
        let startHour = parseInt(event["strt_time"].split(":")[0])
          let startMinute = event["strt_time"].split(":")[1]
          let startAmPm = "AM"
          if (startHour > 12) {
            startHour -= 12
            startAmPm = "PM"
          }
          closestTime.strt_time = `${startHour}:${startMinute} ${startAmPm}`
          let stopHour = parseInt(event["stop_time"].split(":")[0])
          let stopMinute = event["stop_time"].split(":")[1]
          let stopAmPm = "AM"
          if (stopHour > 12) {
            stopHour -= 12
            stopAmPm = "PM"
          }
          closestTime.stop_time = `${stopHour}:${stopMinute}${stopAmPm}`
          closestTime.strt_time = `${startHour}:${startMinute}${startAmPm}`
        break
      }
      if (date < start) {
        if (start.getTime() - date.getTime() < delta) {
          delta = start.getTime() - date.getTime()
          closestTime = {
            strt_time: event["strt_time"],
            stop_time: event["stop_time"]
          }

          // convert to 12 hour time
          let startHour = parseInt(event["strt_time"].split(":")[0])
          let startMinute = event["strt_time"].split(":")[1]
          let startAmPm = "AM"
          if (startHour > 12) {
            startHour -= 12
            startAmPm = "PM"
          }
          closestTime.strt_time = `${startHour}:${startMinute} ${startAmPm}`
          let stopHour = parseInt(event["stop_time"].split(":")[0])
          let stopMinute = event["stop_time"].split(":")[1]
          let stopAmPm = "AM"
          if (stopHour > 12) {
            stopHour -= 12
            stopAmPm = "PM"
          }
          closestTime.stop_time = `${stopHour}:${stopMinute}${stopAmPm}`
          closestTime.strt_time = `${startHour}:${startMinute}${startAmPm}`
        }
      }

    }
  }

  if (delta == Infinity && openNow) {
    closestTime = {
      strt_time: "open for rest of the day!",
      stop_time: ""
    }
  } else if (delta == Infinity && !openNow) {
    closestTime = {
      strt_time: "No Data Found",
      stop_time: ""
    }
  }
  return [openNow, closestTime]
}

export default function Home() {
  // get current day of week
  const term = '24W'
  // state for current buildings
  const [buildings, setBuildings] = useState([""])
  const [percent, setPercent] = useState(100)
  // state for current building
  const [currBuilding, setBuilding] = useState('')  
  const [openRooms, setOpenRooms] = useState([{building: "", room: "", closestTime: {strt_time: "", stop_time: ""}, url: ""}])
  const [closedRooms, setClosedRooms] = useState([{building: "", room: "", closestTime: {strt_time: "", stop_time: ""}, url: ""}])


  useEffect(() => {
    setOpenRooms([]);
    setClosedRooms([]);
    (async () => {
      let data = await fetch('/api/getRooms?term=24W')
      let {rooms, error} = await data.json()
      let buildingsMap = rooms.map((room:{building:string}) => room["building"]);
      setBuildings(Array.from(new Set(buildingsMap)))

      const open = []
      const closed = []
      let i = 0;
      console.log(rooms)
      rooms = rooms.filter((room: {building: string}) => room["building"] == currBuilding)
      for (const room of rooms) {
        i++;
        setPercent((i / rooms.length) * 100)
        const building = room["building"]
        const num = room["room"] as string

        if (currBuilding != building || currBuilding == "") {
          continue;
        }

        const url = `/api/findRooms?term=${term}&building=${building}&room=${num.trim()}`
        console.log(url)
        const response = await fetch(url)
        const data = await response.json()
        console.log(data)
        if (data.error && !data.data) {
          console.log(data.error)
        } else {
          let [isOpen, closestTime] = openNow(data.data);
          if (isOpen) {
            open.push({building: building as string, room: num, closestTime: closestTime, url: data.url})
          } else {
            closed.push({building: building as string, room: num, closestTime: closestTime, url: data.url})
          }
        }
      }

      setOpenRooms(open)
      setClosedRooms(closed)
    })()
  }, [currBuilding])

  return (
    <div className={styles.container}>
      <Head>
        <title>348findr</title>
        <meta name="description" content="classroom finder" />
      </Head>
      <h1>classroom finder</h1>
      <p>select a building, and it'll tell u classes open rn—along with the next block of time it's booked</p>

      <select onChange={(e) => setBuilding(e.target.value)}>
        <option value="">Select a building</option>
        {buildings.map((building, i) => {
          return <option key={i} value={building}>{building}</option>
        }
        )}
      </select>

      <ul>
        {openRooms.length == 0 ? <LoadingBar
          percent={percent}
        />
         : openRooms.map((room, i) => {
          return <a target='_blank' key={i} href={room.url}><li>{room.building} {room.room}, {room.closestTime.strt_time} - {room.closestTime.stop_time}</li></a>
        })}
      </ul>

      {
        closedRooms.length > 0 ? <div>
          <h2>closed rooms</h2>
          <ul style={{
            color: "#ef7676"
          }}>
            {closedRooms.map((room, i) => {
              return <a target='_blank' key={i} href={room.url}><li>{room.building} {room.room}, {room.closestTime.strt_time} - {room.closestTime.stop_time}</li></a>
            })
          }
          </ul>
        </div> : <div></div>
      }

      <footer>
        <p>made with {"<3"} by <a style={{color:"aquamarine"}} href="https://neelr.dev" target="_blank">@neelr</a></p>
        <p><a style={{color:"aquamarine"}} href="https://github.com/neelr/348findr" target="_blank">source</a></p>
      </footer>
    </div>
  )
}
