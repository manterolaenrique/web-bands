import type {BandSetlistPrintFontPreset, BandSetlistPrintPayload} from '@web-bands/bands-domain'
import {Document, Font, Image, Page, StyleSheet, Text, View, renderToBuffer} from '@react-pdf/renderer'
import {existsSync} from 'node:fs'
import {join} from 'node:path'

import {formatSetlistDate} from '@/lib/setlists/format'

function resolveFontPath(fileName: string) {
  const packagePath = join(process.cwd(), 'public', 'fonts', 'setlists', fileName)
  if (existsSync(packagePath)) {
    return packagePath
  }

  return join(process.cwd(), 'apps', 'web', 'public', 'fonts', 'setlists', fileName)
}

Font.register({
  family: 'SetlistMontserrat',
  fonts: [
    {src: resolveFontPath('Montserrat-Variable.ttf'), fontWeight: 400},
    {src: resolveFontPath('Montserrat-Variable.ttf'), fontWeight: 700},
  ],
})
Font.register({
  family: 'SetlistOswald',
  fonts: [
    {src: resolveFontPath('Oswald-Variable.ttf'), fontWeight: 400},
    {src: resolveFontPath('Oswald-Variable.ttf'), fontWeight: 700},
  ],
})
Font.register({
  family: 'SetlistCormorant',
  fonts: [
    {src: resolveFontPath('CormorantGaramond-Variable.ttf'), fontWeight: 400},
    {src: resolveFontPath('CormorantGaramond-Variable.ttf'), fontWeight: 700},
  ],
})
Font.registerHyphenationCallback((word) => [word])

const styles = StyleSheet.create({
  page: {
    paddingTop: 34,
    paddingRight: 36,
    paddingBottom: 34,
    paddingLeft: 36,
    backgroundColor: '#ffffff',
    color: '#111827',
    fontFamily: 'SetlistMontserrat',
    fontSize: 10,
  },
  header: {
    minHeight: 70,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 18,
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: '#d1d5db',
  },
  headerCopy: {
    flexGrow: 1,
    flexShrink: 1,
  },
  eyebrow: {
    marginBottom: 4,
    color: '#4f46e5',
    fontSize: 8,
    fontWeight: 700,
    letterSpacing: 1.5,
  },
  bandName: {
    marginBottom: 5,
    fontSize: 24,
    lineHeight: 1,
    fontWeight: 700,
  },
  metadata: {
    color: '#374151',
    fontSize: 9.5,
    lineHeight: 1.25,
  },
  logo: {
    width: 108,
    height: 62,
    objectFit: 'contain',
    objectPosition: 'right top',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 7,
  },
  compactList: {
    gap: 5,
  },
  item: {
    minHeight: 37,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 0.8,
    borderColor: '#e0e2e7',
    borderRadius: 9,
    backgroundColor: '#f7f8fa',
  },
  compactItem: {
    minHeight: 33,
    paddingVertical: 6,
  },
  blockItem: {
    backgroundColor: '#eef0ff',
    borderColor: '#cfd3fb',
  },
  itemMain: {
    minWidth: 0,
    flexGrow: 1,
    flexShrink: 1,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  itemNumber: {
    width: 20,
    color: '#4b5563',
    fontSize: 10,
    fontWeight: 700,
  },
  itemTitle: {
    flexGrow: 1,
    flexShrink: 1,
    color: '#111827',
    fontSize: 15,
    lineHeight: 1.08,
    fontWeight: 700,
  },
  compactItemTitle: {
    fontSize: 14,
  },
  blockTitle: {
    fontSize: 11.5,
    letterSpacing: 0.8,
  },
  note: {
    maxWidth: 142,
    color: '#4b5563',
    fontSize: 8.5,
    lineHeight: 1.2,
    textAlign: 'right',
  },
  stageBandName: {
    fontSize: 27,
    letterSpacing: 0.5,
  },
  stageMetadata: {
    fontSize: 9,
    letterSpacing: 0.35,
  },
  stageItemTitle: {
    fontSize: 16,
    letterSpacing: 0.45,
  },
  editorialBandName: {
    fontSize: 31,
  },
  editorialItemTitle: {
    fontSize: 16,
  },
})

const fontFamilies: Record<BandSetlistPrintFontPreset, string> = {
  modern: 'SetlistMontserrat',
  stage: 'SetlistOswald',
  editorial: 'SetlistCormorant',
}

function displayTitle(value: string, allCaps: boolean) {
  return allCaps ? value.toLocaleUpperCase('es-AR') : value
}

export function SetlistPdfDocument({
  payload,
  logoDataUrl,
}: {
  payload: BandSetlistPrintPayload
  logoDataUrl?: string | null
}) {
  const preset = payload.setlist.printFontPreset
  const fontFamily = fontFamilies[preset]
  const bandName = preset === 'stage' ? payload.band.name.toLocaleUpperCase('es-AR') : payload.band.name
  const isCompact = payload.setlist.items.length > 32

  return (
    <Document
      title={`${payload.band.name} - ${payload.setlist.title || payload.setlist.venueName}`}
      author={payload.band.name}
      creator="WEB BANDS"
    >
      <Page size="A4" orientation="portrait" wrap style={styles.page}>
        <View style={styles.header} wrap={false}>
          <View style={styles.headerCopy}>
            {payload.setlist.title ? <Text style={[styles.eyebrow, {fontFamily}]}>{payload.setlist.title}</Text> : null}
            <Text
              style={[
                styles.bandName,
                {fontFamily},
                preset === 'stage' ? styles.stageBandName : {},
                preset === 'editorial' ? styles.editorialBandName : {},
              ]}
            >
              {bandName}
            </Text>
            <Text style={[styles.metadata, preset === 'stage' ? styles.stageMetadata : {}]}>
              {formatSetlistDate(payload.setlist.showDate)} - {payload.setlist.venueName}
              {payload.setlist.location ? ` - ${payload.setlist.location}` : ''}
            </Text>
          </View>
          {logoDataUrl ? (
            // react-pdf Image does not expose the browser img alt attribute.
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image src={logoDataUrl} style={styles.logo} />
          ) : null}
        </View>

        <View style={[styles.list, isCompact ? styles.compactList : {}]}>
          {payload.setlist.items.map((item, index) => {
            const title = displayTitle(
              item.itemType === 'song' ? item.songTitleSnapshot || 'Tema' : item.blockLabel || 'Bloque',
              payload.setlist.printAllCaps
            )

            return (
              <View
                key={item.id}
                wrap={false}
                style={[
                  styles.item,
                  isCompact ? styles.compactItem : {},
                  item.itemType === 'block' ? styles.blockItem : {},
                ]}
              >
                <View style={styles.itemMain}>
                  <Text style={styles.itemNumber}>{index + 1}</Text>
                  <Text
                    style={[
                      styles.itemTitle,
                      isCompact ? styles.compactItemTitle : {},
                      {fontFamily},
                      item.itemType === 'block' ? styles.blockTitle : {},
                      preset === 'stage' ? styles.stageItemTitle : {},
                      preset === 'editorial' ? styles.editorialItemTitle : {},
                    ]}
                  >
                    {title}
                  </Text>
                </View>
                {item.notesOverride ? <Text style={styles.note}>{item.notesOverride}</Text> : null}
              </View>
            )
          })}
        </View>
      </Page>
    </Document>
  )
}

export function renderBandSetlistPdf(payload: BandSetlistPrintPayload, logoDataUrl?: string | null) {
  return renderToBuffer(<SetlistPdfDocument payload={payload} logoDataUrl={logoDataUrl} />)
}
