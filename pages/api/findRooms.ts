// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";

type Data = {
  error?: string;
  [key: string]: any;
};

const base = `https://sa.ucla.edu/ro/Public/SOC/Results/ClassroomDetail`;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=60, stale-while-revalidate=3000"
  );
  const { term, building, room } = req.query;
  // ?term=24W&classroom=KAPLAN++%257C++00348++%23availability

  let nonNumberStarting = room?.toString().match(/^\D+/g);
  let nonNumberEnding = room?.toString().match(/\D+$/g);
  let nonNumberStartingString = "";
  let nonNumberEndingString = "";
  if (nonNumberStarting) {
    nonNumberStartingString = nonNumberStarting[0]
  }
  if (nonNumberEnding) {
    nonNumberEndingString = nonNumberEnding[0]
  }
  nonNumberEndingString = nonNumberEndingString.padEnd(2, "+");
  nonNumberStartingString = nonNumberStartingString.padStart(2, "+");

  // pad room to 5 digits total, only digits
  const roomStr = room?.toString().replace(/\D/g, "").padStart(5, "0");
  const url = `${base}?term=${term}&classroom=${building}++|${nonNumberStartingString}${roomStr}${nonNumberEndingString}`;
  const response = await fetch(url);
  console.log(url);

  const data = await response.text();
  const regex = /createFullCalendar\(\$\.parseJSON\('(.*)'\)/g;
  const match = regex.exec(data);

  console.log(match);
  if (match) {
    const json = JSON.parse(match[1]);
    res.status(200).json(json);
  } else {
    res.status(200).json({ error: "No data found" });
  }
}