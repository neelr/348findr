// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'

type Data = {
    error?: string,
    rooms?: { building: string, room: string }[]
}

const base = `https://sa.ucla.edu/RO/Public/SOC/Search/ClassroomGridSearch`

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {

  const url = `${base}`

  const response = await fetch(url)

  const data = await response.text()
  const regex = /name="classroom_autocomplete" label_text="Classroom" options="(.*)" input_class="parentSpanning"/g;
  const match = regex.exec(data)

  if (match) {
    // url decode
    const json = JSON.parse(decodeURIComponent(match[1].replaceAll("&quot;", "\"")))
    let rooms: { building: string, room: string }[] = []

    for (const building in json) {
        let room: { building: string, room: string } = {
            building: json[building].text.replace(/\s+\s+/g, '  ').split("  ")[0],
            room: json[building].text.replace(/\s+\s+/g, '  ').split("  ")[1]
        }
        rooms.push(room)
    }

    res.status(200).json({ rooms: rooms })
  } else {
    res.status(200).json({ error: 'No data found' })
  }
}
