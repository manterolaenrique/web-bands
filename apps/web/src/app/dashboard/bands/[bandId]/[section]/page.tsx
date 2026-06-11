import {notFound} from 'next/navigation'

import {BandEditorScreen} from '../BandEditorScreen'
import {isMobileEditorSectionKey} from '@/components/dashboard/mobile-editor-sections'

type PageProps = {
  params: Promise<{
    bandId: string
    section: string
  }>
  searchParams: Promise<{
    message?: string
  }>
}

export default async function EditBandSectionPage({params, searchParams}: PageProps) {
  const {bandId, section} = await params
  const {message} = await searchParams

  if (!isMobileEditorSectionKey(section) || section === 'overview') {
    notFound()
  }

  return <BandEditorScreen bandId={bandId} message={message} routeSection={section} />
}
