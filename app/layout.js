import { Inter } from 'next/font/google'
import { SpeedInsights } from "@vercel/speed-insights/next"
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
title: 'S4ITMM TV - Football Live',
description: 'Live football streaming platform',
}

export default function RootLayout({ children }) {
return (
<html lang="en">
<head>
<link rel="stylesheet" href="/css/style.css" />

<link  
      rel="stylesheet"  
      href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"  
    />  
  </head>  
  <body className={inter.className}>  
    {children}  

    {/* Vercel Speed Insights */}  
    <SpeedInsights />  
  </body>  
</html>

)
}
