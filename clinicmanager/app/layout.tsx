import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import { Github, Linkedin } from 'lucide-react'
import { ThemeSelector } from '@/components/ThemeSelector'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Clinic Manager',
  description: 'Gerencie suas consultas de forma eficiente',
  icons: {
    icon: '/favicon.ico',
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className={inter.className}>
        <Providers>
          <div className="flex flex-col min-h-screen">
            <header className="border-b">
              <div className="container flex items-center justify-between py-4">
                <h1 className="text-2xl font-bold">Clinic Manager</h1>
                <ThemeSelector />
              </div>
            </header>
            <main className="flex-1">{children}</main>
            <footer className="py-6 border-t">
              <div className="container flex flex-col items-center justify-center gap-2 md:flex-row md:justify-between">
                <p className="text-sm text-muted-foreground">
                  Criado por Vinicius Bacelar
                </p>
                <div className="flex items-center gap-4">
                  <a
                    href="https://github.com/Viniciusovski"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Github className="h-5 w-5" />
                    <span className="sr-only">GitHub</span>
                  </a>
                  <a
                    href="https://www.linkedin.com/in/viniciusbacelar/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Linkedin className="h-5 w-5" />
                    <span className="sr-only">LinkedIn</span>
                  </a>
                </div>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  )
}



import './globals.css'