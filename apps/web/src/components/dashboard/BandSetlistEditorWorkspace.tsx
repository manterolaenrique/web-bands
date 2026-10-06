'use client'

import type {
  BandSetlistDetail,
  BandSetlistEditorPayload,
  BandSetlistItem,
  BandSetlistPrintFontPreset,
  BandSongLibraryItem,
} from '@web-bands/bands-domain'

import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {CSS} from '@dnd-kit/utilities'

import {useRouter} from 'next/navigation'
import {useEffect, useEffectEvent, useId, useRef, useState, useTransition, type ReactNode} from 'react'
import {createPortal} from 'react-dom'

import {BandWorkspaceHeader} from '@/components/dashboard/BandWorkspaceHeader'
import {PendingLink} from '@/components/ui/PendingLink'
import {
  createSetlistItemRequest,
  deleteSetlistItemRequest,
  reorderSetlistItemsRequest,
  updateSetlistItemRequest,
  updateSetlistRequest,
} from '@/lib/dashboard/setlists-api'
import {formatSetlistDate} from '@/lib/setlists/format'
import {SETLIST_PRINT_FONT_LABELS} from '@/lib/setlists/print-style'

type ItemDraft = {
  blockLabel: string
  notesOverride: string
}

type BlockDraft = {
  blockLabel: string
  notesOverride: string
}

type BuilderMobileTab = 'library' | 'order'

function buildItemDraft(item: BandSetlistItem): ItemDraft {
  return {
    blockLabel: item.blockLabel || '',
    notesOverride: item.notesOverride || '',
  }
}

function normalizeText(value: string | null | undefined) {
  return value || ''
}

function isMetaDirty(
  metaValues: {
    title: string
    showDate: string
    venueName: string
    location: string
    pressLogoAssetId: string
    printFontPreset: BandSetlistPrintFontPreset
    printAllCaps: boolean
    linkedShowKey: string
  },
  setlist: BandSetlistDetail
) {
  return (
    metaValues.title !== normalizeText(setlist.title) ||
    metaValues.showDate !== setlist.showDate ||
    metaValues.venueName !== setlist.venueName ||
    metaValues.location !== normalizeText(setlist.location) ||
    metaValues.pressLogoAssetId !== normalizeText(setlist.pressLogoAssetId) ||
    metaValues.printFontPreset !== setlist.printFontPreset ||
    metaValues.printAllCaps !== setlist.printAllCaps ||
    metaValues.linkedShowKey !== normalizeText(setlist.linkedShowKey)
  )
}

function buildItemMeta(item: BandSetlistItem) {
  if (item.itemType === 'block') {
    return item.notesOverride ? 'Bloque con nota' : 'Bloque'
  }

  return item.notesOverride ? 'Tema con nota' : 'Tema'
}

function getItemTitle(item: BandSetlistItem) {
  return item.itemType === 'song' ? item.songTitleSnapshot || 'Tema' : item.blockLabel || 'Bloque'
}

function SetlistDialog({
  title,
  eyebrow,
  onClose,
  children,
}: {
  title: string
  eyebrow: string
  onClose: () => void
  children: ReactNode
}) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement | null>(null)
  const closeDialog = useEffectEvent(onClose)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    const previousActiveElement = document.activeElement instanceof HTMLElement ? document.activeElement : null
    document.body.style.overflow = 'hidden'

    const focusableSelector =
      'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

    const focusFirstControl = window.requestAnimationFrame(() => {
      panelRef.current?.querySelector<HTMLElement>(focusableSelector)?.focus()
    })

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeDialog()
        return
      }

      if (event.key !== 'Tab' || !panelRef.current) {
        return
      }

      const focusableElements = Array.from(panelRef.current.querySelectorAll<HTMLElement>(focusableSelector))
      const first = focusableElements[0]
      const last = focusableElements.at(-1)
      if (!first || !last) {
        return
      }

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.cancelAnimationFrame(focusFirstControl)
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
      previousActiveElement?.focus({preventScroll: true})
    }
  }, [])

  return createPortal(
    <div className="demos-sheet setlists-inline-sheet" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <button className="demos-sheet__backdrop" type="button" onClick={onClose} aria-label="Cerrar ventana" />
      <div className="demos-sheet__panel demos-sheet__panel--dialog setlists-inline-sheet__panel" ref={panelRef}>
        <div className="setlists-item-sheet__header">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h2 id={titleId}>{title}</h2>
          </div>
          <button className="setlists-dialog__close" type="button" onClick={onClose} aria-label="Cerrar ventana">
            <span aria-hidden="true">X</span>
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  )
}

function LibrarySongRow({
  song,
  disabled,
  onAdd,
}: {
  song: BandSongLibraryItem
  disabled: boolean
  onAdd: () => void
}) {
  const {attributes, listeners, setNodeRef, transform, isDragging} = useDraggable({
    id: `library:${song.id}`,
    data: {type: 'library-song', songId: song.id, title: song.title},
    disabled,
  })

  return (
    <article
      className={`setlists-song-picker__item setlists-song-picker__item--draggable${isDragging ? ' is-dragging' : ''}`}
      ref={setNodeRef}
      style={{transform: CSS.Translate.toString(transform)}}
    >
      <button
        className="setlists-drag-handle"
        type="button"
        aria-label={`Arrastrar ${song.title} al orden`}
        disabled={disabled}
        {...attributes}
        {...listeners}
      >
        <span aria-hidden="true">::</span>
      </button>
      <div className="setlists-song-picker__copy">
        <strong>{song.title}</strong>
      </div>
      <button className="button button--primary" type="button" disabled={disabled} onClick={onAdd}>
        Agregar
      </button>
    </article>
  )
}

function SetlistMoveMenu({
  title,
  index,
  itemCount,
  disabled,
  onMove,
}: {
  title: string
  index: number
  itemCount: number
  disabled: boolean
  onMove: (direction: -1 | 1) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({top: 0, left: 0})
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const close = () => setIsOpen(false)
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (!triggerRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        close()
      }
    }

    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('resize', close)
    window.addEventListener('scroll', close, true)
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('resize', close)
      window.removeEventListener('scroll', close, true)
    }
  }, [isOpen])

  const toggleMenu = () => {
    const trigger = triggerRef.current
    if (!trigger || isOpen) {
      setIsOpen(false)
      return
    }

    const rect = trigger.getBoundingClientRect()
    const menuWidth = 176
    const menuHeight = 112
    const hasRoomBelow = window.innerHeight - rect.bottom > menuHeight + 12
    setPosition({
      top: hasRoomBelow ? rect.bottom + 6 : Math.max(8, rect.top - menuHeight - 6),
      left: Math.min(Math.max(8, rect.right - menuWidth), window.innerWidth - menuWidth - 8),
    })
    setIsOpen(true)
  }

  return (
    <div className="setlists-order-menu">
      <button
        className="button"
        type="button"
        ref={triggerRef}
        disabled={disabled}
        data-setlist-move-trigger
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={toggleMenu}
      >
        Mover
      </button>
      {isOpen
        ? createPortal(
            <div
              className="setlists-order-menu__content setlists-order-menu__content--portal"
              ref={menuRef}
              role="menu"
              aria-label={`Mover ${title}`}
              style={position}
            >
              <button
                className="button"
                type="button"
                role="menuitem"
                disabled={disabled || index === 0}
                onClick={() => {
                  setIsOpen(false)
                  onMove(-1)
                }}
              >
                Mover arriba
              </button>
              <button
                className="button"
                type="button"
                role="menuitem"
                disabled={disabled || index === itemCount - 1}
                onClick={() => {
                  setIsOpen(false)
                  onMove(1)
                }}
              >
                Mover abajo
              </button>
            </div>,
            document.body
          )
        : null}
    </div>
  )
}

function SortableSetlistRow({
  item,
  index,
  itemCount,
  disabled,
  pending,
  highlighted,
  onMove,
  onEdit,
  onDelete,
  registerRow,
}: {
  item: BandSetlistItem
  index: number
  itemCount: number
  disabled: boolean
  pending: boolean
  highlighted: boolean
  onMove: (direction: -1 | 1) => void
  onEdit: () => void
  onDelete: () => void
  registerRow: (itemId: string, node: HTMLElement | null) => void
}) {
  const {attributes, listeners, setNodeRef, transform, transition, isDragging} = useSortable({
    id: item.id,
    data: {type: 'setlist-item', title: item.songTitleSnapshot || item.blockLabel || 'Item'},
    disabled: disabled || pending,
  })

  return (
    <article
      className={`setlists-order-item${isDragging ? ' is-dragging' : ''}${pending ? ' is-pending' : ''}${
        highlighted ? ' is-highlighted' : ''
      }`}
      ref={(node) => {
        setNodeRef(node)
        registerRow(item.id, node)
      }}
      style={{transform: CSS.Transform.toString(transform), transition}}
      data-setlist-item-id={item.id}
    >
      <button
        className="setlists-drag-handle"
        type="button"
        aria-label={`Mover ${item.songTitleSnapshot || item.blockLabel}`}
        disabled={disabled || pending}
        {...attributes}
        {...listeners}
      >
        <span aria-hidden="true">::</span>
      </button>
      <div className="setlists-order-item__order">
        <strong>{index + 1}</strong>
      </div>
      <div className="setlists-order-item__copy">
        <div className="setlists-editor-item__header">
          <span className={`setlists-item-badge setlists-item-badge--${item.itemType}`}>
            {item.itemType === 'song' ? 'Tema' : 'Bloque'}
          </span>
          <h3>{item.itemType === 'song' ? item.songTitleSnapshot : item.blockLabel}</h3>
        </div>
        <p>{pending ? 'Guardando...' : buildItemMeta(item)}</p>
      </div>
      <div className="setlists-order-item__actions">
        <SetlistMoveMenu
          title={getItemTitle(item)}
          index={index}
          itemCount={itemCount}
          disabled={disabled || pending}
          onMove={onMove}
        />
        <button
          className="setlists-order-item__remove"
          type="button"
          disabled={disabled || pending}
          onClick={onDelete}
          aria-label={`Quitar ${getItemTitle(item)} de la setlist`}
          title="Quitar de la setlist"
        >
          <span aria-hidden="true">X</span>
        </button>
        <button className="button button--primary" type="button" disabled={pending} onClick={onEdit}>
          Editar
        </button>
      </div>
    </article>
  )
}

export function BandSetlistEditorWorkspace({
  bandId,
  payload,
  isNewSession = false,
}: {
  bandId: string
  payload: BandSetlistEditorPayload
  isNewSession?: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [setlist, setSetlist] = useState(payload.setlist)
  const [metaValues, setMetaValues] = useState({
    title: payload.setlist.title || '',
    showDate: payload.setlist.showDate,
    venueName: payload.setlist.venueName,
    location: payload.setlist.location || '',
    pressLogoAssetId: payload.setlist.pressLogoAssetId || '',
    printFontPreset: payload.setlist.printFontPreset,
    printAllCaps: payload.setlist.printAllCaps,
    linkedShowKey: payload.setlist.linkedShowKey || '',
  })
  const [songQuery, setSongQuery] = useState('')
  const [message, setMessage] = useState<string | null>(
    isNewSession ? 'Setlist creado. Busca un tema, agregalo y ve ordenando el show.' : null
  )
  const [workingItemId, setWorkingItemId] = useState<string | null>(null)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null)
  const [editingDraft, setEditingDraft] = useState<ItemDraft>({blockLabel: '', notesOverride: ''})
  const [isBlockComposerOpen, setIsBlockComposerOpen] = useState(false)
  const [blockDraft, setBlockDraft] = useState<BlockDraft>({blockLabel: '', notesOverride: ''})
  const [pendingItemIds, setPendingItemIds] = useState<Set<string>>(() => new Set())
  const [isOrderPending, setIsOrderPending] = useState(false)
  const [activeDragTitle, setActiveDragTitle] = useState<string | null>(null)
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const [mobileTab, setMobileTab] = useState<BuilderMobileTab>(
    isNewSession || payload.setlist.items.length === 0 ? 'library' : 'order'
  )
  const [showViewOrderPrompt, setShowViewOrderPrompt] = useState(false)
  const orderListRef = useRef<HTMLDivElement | null>(null)
  const rowRefs = useRef(new Map<string, HTMLElement>())
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const builderTabsRef = useRef<HTMLDivElement | null>(null)
  const {setNodeRef: setOrderDropRef, isOver: isOrderDropActive} = useDroppable({
    id: 'setlist-drop-zone',
    data: {type: 'setlist-drop-zone'},
  })
  const sensors = useSensors(
    useSensor(PointerSensor, {activationConstraint: {distance: 6}}),
    useSensor(TouchSensor, {activationConstraint: {delay: 180, tolerance: 8}}),
    useSensor(KeyboardSensor, {coordinateGetter: sortableKeyboardCoordinates})
  )

  const filteredSongs = payload.songs.filter((song) => {
    const query = songQuery.trim().toLowerCase()
    if (!query) {
      return true
    }

    return song.title.toLowerCase().includes(query) || (song.defaultNotes || '').toLowerCase().includes(query)
  })

  const editingItem = editingItemId ? setlist.items.find((item) => item.id === editingItemId) || null : null
  const deleteCandidate = deleteCandidateId
    ? setlist.items.find((item) => item.id === deleteCandidateId) || null
    : null

  useEffect(() => {
    return () => {
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current)
      }
    }
  }, [])

  const registerRow = (itemId: string, node: HTMLElement | null) => {
    if (node) {
      rowRefs.current.set(itemId, node)
    } else {
      rowRefs.current.delete(itemId)
    }
  }

  const revealMovedItem = (item: BandSetlistItem, targetIndex: number) => {
    setHighlightedItemId(item.id)
    setAnnouncement(`${getItemTitle(item)} movido al puesto ${targetIndex + 1}.`)

    if (highlightTimerRef.current) {
      clearTimeout(highlightTimerRef.current)
    }
    highlightTimerRef.current = setTimeout(() => setHighlightedItemId(null), 1800)

    window.requestAnimationFrame(() => {
      const list = orderListRef.current
      const row = rowRefs.current.get(item.id)
      if (!list || !row) {
        return
      }

      const listRect = list.getBoundingClientRect()
      const rowRect = row.getBoundingClientRect()
      if (rowRect.top < listRect.top + 8) {
        list.scrollBy({top: rowRect.top - listRect.top - 8, behavior: 'smooth'})
      } else if (rowRect.bottom > listRect.bottom - 8) {
        list.scrollBy({top: rowRect.bottom - listRect.bottom + 8, behavior: 'smooth'})
      }

      row.querySelector<HTMLElement>('[data-setlist-move-trigger]')?.focus({preventScroll: true})
    })
  }

  const showMobileOrder = () => {
    setMobileTab('order')
    setShowViewOrderPrompt(false)
    window.requestAnimationFrame(() => builderTabsRef.current?.scrollIntoView({block: 'start', behavior: 'smooth'}))
  }

  const beginEditingItem = (item: BandSetlistItem) => {
    setEditingItemId(item.id)
    setEditingDraft(buildItemDraft(item))
  }

  const syncSetlist = (nextSetlist: BandSetlistDetail) => {
    setSetlist(nextSetlist)
  }

  const syncItems = (nextItems: BandSetlistItem[]) => {
    setSetlist((current) => ({
      ...current,
      items: nextItems,
      itemCount: nextItems.length,
    }))
  }

  const normalizeItems = (items: BandSetlistItem[]) =>
    items.map((item, index) => ({...item, sortOrder: index + 1}))

  const applyShowPrefill = (showKey: string) => {
    if (!showKey) {
      setMetaValues((current) => ({...current, linkedShowKey: ''}))
      return
    }

    const show = payload.showPrefills.find((entry) => entry.key === showKey)
    if (!show) {
      return
    }

    setMetaValues((current) => ({
      ...current,
      linkedShowKey: show.key,
      showDate: show.date.slice(0, 10),
      venueName: show.venue,
      location: show.location || '',
    }))
  }

  const handleSaveMeta = () => {
    setMessage(null)
    startTransition(async () => {
      const response = await updateSetlistRequest(bandId, setlist.id, {
        title: metaValues.title,
        showDate: metaValues.showDate,
        venueName: metaValues.venueName,
        location: metaValues.location,
        pressLogoAssetId: metaValues.pressLogoAssetId || undefined,
        printFontPreset: metaValues.printFontPreset,
        printAllCaps: metaValues.printAllCaps,
        linkedShowKey: metaValues.linkedShowKey || undefined,
      })

      if (!response.ok || !response.body?.setlist) {
        setMessage(response.body?.message || 'No se pudo guardar el setlist.')
        return
      }

      syncSetlist(response.body.setlist)
      setMessage('Datos del setlist guardados.')
    })
  }

  const handleAddSong = async (songId: string, requestedIndex?: number) => {
    const song = payload.songs.find((candidate) => candidate.id === songId)
    if (!song) {
      setMessage('No encontramos el tema en la biblioteca.')
      return
    }

    const insertIndex = Math.min(Math.max(requestedIndex ?? setlist.items.length, 0), setlist.items.length)
    const temporaryId = `pending:${crypto.randomUUID()}`
    const temporaryItem: BandSetlistItem = {
      id: temporaryId,
      setlistId: setlist.id,
      sortOrder: insertIndex + 1,
      itemType: 'song',
      songId: song.id,
      songTitleSnapshot: song.title,
      notesOverride: song.defaultNotes,
      createdAt: new Date().toISOString(),
    }

    setMessage(null)
    setShowViewOrderPrompt(true)
    setPendingItemIds((current) => new Set(current).add(temporaryId))
    setSetlist((current) => {
      const nextItems = [...current.items]
      nextItems.splice(Math.min(insertIndex, nextItems.length), 0, temporaryItem)
      const normalized = normalizeItems(nextItems)
      return {...current, items: normalized, itemCount: normalized.length}
    })

    const response = await createSetlistItemRequest(bandId, setlist.id, {
      itemType: 'song',
      songId,
      insertIndex,
    })

    setPendingItemIds((current) => {
      const next = new Set(current)
      next.delete(temporaryId)
      return next
    })

    if (!response.ok || !response.body?.item) {
      setSetlist((current) => {
        const nextItems = normalizeItems(current.items.filter((item) => item.id !== temporaryId))
        return {...current, items: nextItems, itemCount: nextItems.length}
      })
      setMessage(response.body?.message || 'No se pudo agregar el tema al setlist.')
      return
    }

    setSetlist((current) => {
      const nextItems = normalizeItems(
        current.items.map((item) => (item.id === temporaryId ? response.body!.item! : item))
      )
      return {...current, items: nextItems, itemCount: nextItems.length}
    })
    setMessage('Tema agregado al orden actual.')
  }

  const handleAddBlock = () => {
    setMessage(null)
    startTransition(async () => {
      const response = await createSetlistItemRequest(bandId, setlist.id, {
        itemType: 'block',
        blockLabel: blockDraft.blockLabel,
        notesOverride: blockDraft.notesOverride || undefined,
      })

      if (!response.ok || !response.body?.item) {
        setMessage(response.body?.message || 'No se pudo agregar el bloque.')
        return
      }

      syncItems([...setlist.items, response.body.item])
      setBlockDraft({blockLabel: '', notesOverride: ''})
      setIsBlockComposerOpen(false)
      setMessage('Bloque agregado al orden actual.')
    })
  }

  const persistOrder = async (previousItems: BandSetlistItem[], nextItems: BandSetlistItem[]) => {
    setIsOrderPending(true)
    const response = await reorderSetlistItemsRequest(
      bandId,
      setlist.id,
      nextItems.map((item) => item.id)
    )
    setIsOrderPending(false)

    if (!response.ok) {
      syncItems(normalizeItems(previousItems))
      setMessage(response.body?.message || 'No se pudo reordenar el setlist.')
      return
    }

    setMessage('Orden actualizado.')
  }

  const moveItem = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction
    if (
      targetIndex < 0 ||
      targetIndex >= setlist.items.length ||
      pendingItemIds.size > 0 ||
      isOrderPending
    ) {
      return
    }

    const previousItems = setlist.items
    const movedItem = previousItems[index]
    const nextItems = normalizeItems(arrayMove(previousItems, index, targetIndex))
    syncItems(nextItems)
    setMessage(null)
    revealMovedItem(movedItem, targetIndex)
    void persistOrder(previousItems, nextItems)
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragTitle(String(event.active.data.current?.title || 'Item'))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragTitle(null)
    const {active, over} = event
    if (!over) {
      return
    }

    if (active.data.current?.type === 'library-song') {
      const overIndex = setlist.items.findIndex((item) => item.id === over.id)
      let insertIndex = over.id === 'setlist-drop-zone' || overIndex < 0 ? setlist.items.length : overIndex
      const translatedRect = active.rect.current.translated
      if (overIndex >= 0 && translatedRect && translatedRect.top > over.rect.top + over.rect.height / 2) {
        insertIndex += 1
      }

      void handleAddSong(String(active.data.current.songId), insertIndex)
      return
    }

    if (pendingItemIds.size > 0 || isOrderPending) {
      setMessage('Espera a que termine de guardarse el tema antes de cambiar el orden.')
      return
    }

    const oldIndex = setlist.items.findIndex((item) => item.id === active.id)
    const overIndex = over.id === 'setlist-drop-zone'
      ? setlist.items.length - 1
      : setlist.items.findIndex((item) => item.id === over.id)
    if (oldIndex < 0 || overIndex < 0 || oldIndex === overIndex) {
      return
    }

    const previousItems = setlist.items
    const movedItem = previousItems[oldIndex]
    const nextItems = normalizeItems(arrayMove(previousItems, oldIndex, overIndex))
    syncItems(nextItems)
    setMessage(null)
    revealMovedItem(movedItem, overIndex)
    void persistOrder(previousItems, nextItems)
  }

  const handleSaveEditedItem = () => {
    if (!editingItem) {
      return
    }

    setWorkingItemId(editingItem.id)
    setMessage(null)
    startTransition(async () => {
      const response = await updateSetlistItemRequest(bandId, setlist.id, editingItem.id, {
        blockLabel: editingItem.itemType === 'block' ? editingDraft.blockLabel : undefined,
        notesOverride: editingDraft.notesOverride,
      })
      setWorkingItemId(null)

      if (!response.ok || !response.body?.item) {
        setMessage(response.body?.message || 'No se pudo guardar el item.')
        return
      }

      syncItems(setlist.items.map((current) => (current.id === editingItem.id ? response.body!.item! : current)))
      setEditingItemId(null)
      setMessage('Item actualizado.')
    })
  }

  const handleConfirmDeleteItem = () => {
    if (!deleteCandidate) {
      return
    }

    const deletedItem = deleteCandidate
    const previousItems = setlist.items
    setWorkingItemId(deletedItem.id)
    setMessage(null)
    syncItems(normalizeItems(previousItems.filter((item) => item.id !== deletedItem.id)))
    setDeleteCandidateId(null)

    void (async () => {
      const response = await deleteSetlistItemRequest(bandId, setlist.id, deletedItem.id)
      setWorkingItemId(null)

      if (!response.ok) {
        syncItems(previousItems)
        setMessage(response.body?.message || 'No se pudo eliminar el item.')
        return
      }

      setMessage('Item eliminado.')
    })()
  }

  const handleSaveAndPreview = () => {
    setMessage(null)
    startTransition(async () => {
      let nextSetlist = setlist

      if (isMetaDirty(metaValues, nextSetlist)) {
        const response = await updateSetlistRequest(bandId, nextSetlist.id, {
          title: metaValues.title,
          showDate: metaValues.showDate,
          venueName: metaValues.venueName,
          location: metaValues.location,
          pressLogoAssetId: metaValues.pressLogoAssetId || undefined,
          printFontPreset: metaValues.printFontPreset,
          printAllCaps: metaValues.printAllCaps,
          linkedShowKey: metaValues.linkedShowKey || undefined,
        })

        if (!response.ok || !response.body?.setlist) {
          setMessage(response.body?.message || 'No se pudo guardar la cabecera del setlist.')
          return
        }

        nextSetlist = response.body.setlist
        syncSetlist(nextSetlist)
      }

      router.push(`/dashboard/bands/${bandId}/setlists/${nextSetlist.id}/print`)
    })
  }

  return (
    <div className="setlists-editor">
      <BandWorkspaceHeader
        bandId={bandId}
        bandName={payload.band.name}
        bandStatus={payload.band.status}
        publicBandHref={payload.publicBandHref}
        canManage={payload.canManage}
        activeSection="setlists"
        eyebrow="Herramientas privadas · Editor de setlist"
        description={`${formatSetlistDate(setlist.showDate)}${setlist.location ? ` - ${setlist.location}` : ''}`}
        actions={
          <PendingLink
            className="button"
            href={`/dashboard/bands/${bandId}/setlists/${setlist.id}/print`}
            pendingLabel="Abriendo vista A4..."
          >
            Vista A4
          </PendingLink>
        }
      />

      <section className="dashboard-card setlists-builder-summary">
        <div>
          <p className="eyebrow">Constructor de setlists</p>
          <h2>{setlist.title || setlist.venueName}</h2>
          <p className="muted">
            {formatSetlistDate(setlist.showDate)}
            {setlist.location ? ` - ${setlist.location}` : ''}
          </p>
        </div>

        <div className="setlists-builder-summary__stats">
          <article className="setlists-builder-summary__stat">
            <span>Temas en biblioteca</span>
            <strong>{payload.songs.length}</strong>
          </article>
          <article className="setlists-builder-summary__stat">
            <span>Items cargados</span>
            <strong>{setlist.items.length}</strong>
          </article>
          <article className="setlists-builder-summary__stat">
            <span>Logos listos</span>
            <strong>{payload.availableLogos.length}</strong>
          </article>
        </div>
      </section>

      <section className="dashboard-card setlists-card setlists-builder-meta">
        <div className="setlists-card__header">
          <div>
            <p className="eyebrow">Datos de la hoja</p>
            <h2>Fecha, venue y logo</h2>
            <p className="muted">Esta cabecera queda compacta para dejar el armado principal en dos paneles: temas a la izquierda y orden actual a la derecha.</p>
          </div>
        </div>

        <div className="setlists-create-form setlists-create-form--compact">
          <label className="form-field">
            <span className="form-label">Prefill desde shows</span>
            <select
              className="form-select"
              value={metaValues.linkedShowKey}
              onChange={(event) => {
                const value = event.currentTarget.value
                if (!value) {
                  setMetaValues((current) => ({...current, linkedShowKey: ''}))
                  return
                }

                applyShowPrefill(value)
              }}
            >
              <option value="">Sin prefill</option>
              {payload.showPrefills.map((show) => (
                <option key={show.key} value={show.key}>
                  {show.date.slice(0, 10)} - {show.venue}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span className="form-label">Logo de prensa</span>
            <select
              className="form-select"
              value={metaValues.pressLogoAssetId}
              onChange={(event) => {
                const value = event.currentTarget.value
                setMetaValues((current) => ({...current, pressLogoAssetId: value}))
              }}
            >
              <option value="">Sin logo</option>
              {payload.availableLogos.map((logo) => (
                <option key={logo.id} value={logo.id}>
                  {logo.label}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span className="form-label">Fecha</span>
            <input
              className="form-input"
              type="date"
              value={metaValues.showDate}
              onChange={(event) => {
                const value = event.currentTarget.value
                setMetaValues((current) => ({...current, showDate: value}))
              }}
            />
          </label>
          <label className="form-field">
            <span className="form-label">Venue</span>
            <input
              className="form-input"
              value={metaValues.venueName}
              onChange={(event) => {
                const value = event.currentTarget.value
                setMetaValues((current) => ({...current, venueName: value}))
              }}
            />
          </label>
          <label className="form-field">
            <span className="form-label">Ubicacion</span>
            <input
              className="form-input"
              value={metaValues.location}
              onChange={(event) => {
                const value = event.currentTarget.value
                setMetaValues((current) => ({...current, location: value}))
              }}
            />
          </label>
          <label className="form-field">
            <span className="form-label">Titulo opcional</span>
            <input
              className="form-input"
              value={metaValues.title}
              onChange={(event) => {
                const value = event.currentTarget.value
                setMetaValues((current) => ({...current, title: value}))
              }}
            />
          </label>
          <label className="form-field">
            <span className="form-label">Tipografia A4</span>
            <select
              className="form-select"
              value={metaValues.printFontPreset}
              onChange={(event) => {
                const value = event.currentTarget.value as BandSetlistPrintFontPreset
                setMetaValues((current) => ({...current, printFontPreset: value}))
              }}
            >
              {Object.entries(SETLIST_PRINT_FONT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="checkbox-field form-field">
            <input
              checked={metaValues.printAllCaps}
              type="checkbox"
              onChange={(event) => {
                const checked = event.currentTarget.checked
                setMetaValues((current) => ({...current, printAllCaps: checked}))
              }}
            />
            <span>Lista en mayusculas</span>
          </label>
          <button className="button" type="button" disabled={isPending} onClick={handleSaveMeta}>
            {isPending ? 'Guardando...' : 'Guardar datos'}
          </button>
        </div>
      </section>

      <section className="dashboard-card setlists-card">
        <div className="setlists-card__header">
          <div>
            <p className="eyebrow">Armado del show</p>
            <h2>Temas a la izquierda, orden actual a la derecha</h2>
            <p className="muted">Suma canciones, revisa el orden sin perder tu posicion y abre solo el detalle que necesites editar.</p>
          </div>
        </div>

        {message ? (
          <div className="setlists-builder-message">
            <p className="muted">{message}</p>
            {showViewOrderPrompt ? (
              <button className="button setlists-mobile-view-order" type="button" onClick={showMobileOrder}>
                Ver en orden
              </button>
            ) : null}
          </div>
        ) : null}
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {announcement}
        </p>

        <div className="setlists-builder-tabs" ref={builderTabsRef} role="tablist" aria-label="Constructor de setlist">
          <button
            className={mobileTab === 'library' ? 'is-active' : ''}
            type="button"
            role="tab"
            aria-selected={mobileTab === 'library'}
            onClick={() => setMobileTab('library')}
          >
            Agregar temas
          </button>
          <button
            className={mobileTab === 'order' ? 'is-active' : ''}
            type="button"
            role="tab"
            aria-selected={mobileTab === 'order'}
            onClick={() => {
              setMobileTab('order')
              setShowViewOrderPrompt(false)
            }}
          >
            Orden actual ({setlist.items.length})
          </button>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragCancel={() => setActiveDragTitle(null)}
          onDragEnd={handleDragEnd}
        >
          <div className="setlists-builder-layout">
          <div
            className={`setlists-builder-column setlists-builder-column--library${
              mobileTab === 'library' ? '' : ' is-mobile-hidden'
            }`}
            role="tabpanel"
          >
            <div className="setlists-editor-adder">
              <div className="setlists-builder-toolbar">
                <div>
                  <p className="eyebrow">1. Biblioteca</p>
                  <h3>Buscar y agregar temas</h3>
                  <p className="muted">Arrastra un tema a la posicion deseada o toca `Agregar` para sumarlo al final.</p>
                </div>
                <button
                  className="button button--ghost setlists-builder-toolbar__secondary"
                  type="button"
                  disabled={isPending}
                  onClick={() => setIsBlockComposerOpen((current) => !current)}
                >
                  {isBlockComposerOpen ? 'Cerrar bloque' : 'Agregar bloque'}
                </button>
              </div>

              <label className="form-field">
                <span className="form-label">Buscar en la biblioteca</span>
                <input
                  className="form-input"
                  type="search"
                  value={songQuery}
                  onChange={(event) => setSongQuery(event.currentTarget.value)}
                  placeholder="Buscar tema en la biblioteca..."
                />
              </label>

              <div className="setlists-song-picker">
                {payload.songs.length === 0 ? (
                  <div className="setlists-empty">
                    <h3>No hay temas cargados todavia</h3>
                    <p className="muted">Carga primero los temas en la biblioteca y luego vuelve para sumarlos al setlist.</p>
                  </div>
                ) : filteredSongs.length === 0 ? (
                  <div className="setlists-empty">
                    <h3>No encontramos temas</h3>
                    <p className="muted">Prueba con otro nombre o revisa la biblioteca guardada.</p>
                  </div>
                ) : (
                  filteredSongs.map((song) => (
                    <LibrarySongRow
                      key={song.id}
                      song={song}
                      disabled={isPending}
                      onAdd={() => void handleAddSong(song.id)}
                    />
                  ))
                )}
              </div>

              {isBlockComposerOpen ? (
                <div className="setlists-inline-panel">
                  <div className="setlists-builder-toolbar">
                    <div>
                      <p className="eyebrow">Bloques del show</p>
                      <h3>Separar momentos del set</h3>
                      <p className="muted">Usa bloques como Intro, Acustico, Bis o Final sin salir del panel izquierdo.</p>
                    </div>
                  </div>

                  <div className="setlists-block-presets">
                    {['Intro', 'Acustico', 'Bis', 'Final'].map((preset) => (
                      <button
                        className="button"
                        key={preset}
                        type="button"
                        disabled={isPending}
                        onClick={() => setBlockDraft((current) => ({...current, blockLabel: preset}))}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>

                  <div className="setlists-item-sheet__form">
                    <label className="form-field">
                      <span className="form-label">Nombre del bloque</span>
                      <input
                        className="form-input"
                        value={blockDraft.blockLabel}
                        onChange={(event) => {
                          const value = event.currentTarget.value
                          setBlockDraft((current) => ({...current, blockLabel: value}))
                        }}
                        placeholder="Nombre del bloque"
                      />
                    </label>

                    <label className="form-field">
                      <span className="form-label">Nota del bloque</span>
                      <textarea
                        className="form-textarea"
                        value={blockDraft.notesOverride}
                        onChange={(event) => {
                          const value = event.currentTarget.value
                          setBlockDraft((current) => ({...current, notesOverride: value}))
                        }}
                        placeholder="Comentario opcional para ese momento del show."
                      />
                    </label>
                  </div>

                  <div className="setlists-item-sheet__footer">
                    <button className="button" type="button" onClick={() => setIsBlockComposerOpen(false)} disabled={isPending}>
                      Cancelar
                    </button>
                    <button
                      className="button button--primary"
                      type="button"
                      disabled={isPending || blockDraft.blockLabel.trim().length < 2}
                      onClick={handleAddBlock}
                    >
                      {isPending ? 'Agregando...' : 'Agregar bloque'}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div
            className={`setlists-builder-column setlists-builder-column--order${
              mobileTab === 'order' ? '' : ' is-mobile-hidden'
            }`}
            role="tabpanel"
          >
            <div className="setlists-editor-adder setlists-order-panel">
              <div className="setlists-builder-toolbar">
                <div>
                  <p className="eyebrow">2. Orden actual</p>
                  <h3>Orden del show</h3>
                  <p className="muted">
                    {setlist.items.length} {setlist.items.length === 1 ? 'item cargado' : 'items cargados'}
                  </p>
                </div>
              </div>

              <div
                className={`setlists-order-list${isOrderDropActive ? ' is-drop-active' : ''}`}
                ref={(node) => {
                  orderListRef.current = node
                  setOrderDropRef(node)
                }}
              >
                <SortableContext items={setlist.items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
                  {setlist.items.length === 0 ? (
                    <div className="setlists-empty setlists-empty--drop-zone">
                      <h3>Arrastra el primer tema aca</h3>
                      <p className="muted">Tambien puedes usar el boton `Agregar` de la biblioteca.</p>
                    </div>
                  ) : (
                    setlist.items.map((item, index) => (
                      <SortableSetlistRow
                        key={item.id}
                        item={item}
                        index={index}
                        itemCount={setlist.items.length}
                        disabled={isPending || isOrderPending || pendingItemIds.size > 0}
                        pending={pendingItemIds.has(item.id)}
                        highlighted={highlightedItemId === item.id}
                        onMove={(direction) => moveItem(index, direction)}
                        onEdit={() => beginEditingItem(item)}
                        onDelete={() => setDeleteCandidateId(item.id)}
                        registerRow={registerRow}
                      />
                    ))
                  )}
                </SortableContext>
              </div>

            </div>
          </div>
        </div>
          <DragOverlay>
            {activeDragTitle ? <div className="setlists-drag-overlay">{activeDragTitle}</div> : null}
          </DragOverlay>
        </DndContext>
      </section>

      <div className="setlists-builder-page__footer">
        <button className="button button--primary" type="button" onClick={handleSaveAndPreview} disabled={isPending}>
          {isPending ? 'Guardando...' : 'Guardar y ver vista previa'}
        </button>
      </div>

      {editingItem ? (
        <SetlistDialog
          eyebrow="Editar informacion"
          title={getItemTitle(editingItem)}
          onClose={() => setEditingItemId(null)}
        >
          <p className="muted">
            {editingItem.itemType === 'song'
              ? 'Ajusta solamente la nota que aparecera en la hoja.'
              : 'Ajusta el nombre y la nota del bloque.'}
          </p>
          <div className="setlists-item-sheet__form">
            {editingItem.itemType === 'block' ? (
              <label className="form-field">
                <span className="form-label">Nombre del bloque</span>
                <input
                  className="form-input"
                  value={editingDraft.blockLabel}
                  onChange={(event) => {
                    const value = event.currentTarget.value
                    setEditingDraft((current) => ({...current, blockLabel: value}))
                  }}
                  placeholder="Intro, Bis, Final..."
                />
              </label>
            ) : (
              <div className="setlists-item-sheet__meta">
                <span className="setlists-item-badge setlists-item-badge--song">Tema</span>
                <strong>{editingItem.songTitleSnapshot}</strong>
              </div>
            )}

            <label className="form-field">
              <span className="form-label">Nota visible en la hoja</span>
              <textarea
                className="form-textarea"
                value={editingDraft.notesOverride}
                onChange={(event) => {
                  const value = event.currentTarget.value
                  setEditingDraft((current) => ({...current, notesOverride: value}))
                }}
                placeholder="Referencia, afinacion o recordatorio para esta fecha."
              />
            </label>
          </div>
          <div className="setlists-item-sheet__footer">
            <button className="button" type="button" onClick={() => setEditingItemId(null)}>
              Cancelar
            </button>
            <button
              className="button button--primary"
              type="button"
              disabled={isPending && workingItemId === editingItem.id}
              onClick={handleSaveEditedItem}
            >
              {isPending && workingItemId === editingItem.id ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </SetlistDialog>
      ) : null}

      {deleteCandidate ? (
        <SetlistDialog
          eyebrow="Quitar del orden"
          title={getItemTitle(deleteCandidate)}
          onClose={() => setDeleteCandidateId(null)}
        >
          <p className="muted">
            Se quitara el puesto {setlist.items.findIndex((item) => item.id === deleteCandidate.id) + 1} de esta setlist. El tema seguira disponible en la biblioteca.
          </p>
          <div className="setlists-item-sheet__footer">
            <button className="button" type="button" onClick={() => setDeleteCandidateId(null)}>
              Cancelar
            </button>
            <button className="button button--danger" type="button" onClick={handleConfirmDeleteItem}>
              Quitar de la setlist
            </button>
          </div>
        </SetlistDialog>
      ) : null}
    </div>
  )
}
