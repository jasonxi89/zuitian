import { useState } from 'react'
import Layout from './components/Layout'
import PhraseLibrary from './components/PhraseLibrary'
import ChatAssistant from './components/ChatAssistant'
import RandomPickup from './components/RandomPickup'

type Page = 'library' | 'chat' | 'random'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('library')

  const renderPage = () => {
    switch (currentPage) {
      case 'library':
        return <PhraseLibrary />
      case 'chat':
        return <ChatAssistant />
      case 'random':
        return <RandomPickup />
      default:
        return <PhraseLibrary />
    }
  }

  return (
    <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
      {renderPage()}
    </Layout>
  )
}

export default App
