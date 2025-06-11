import data from './data'
import { renderAll, saveData } from './utils'

export function initDrag() {
  const container = document.getElementById('gbf-bookmark-lacia')
  let draggingElem = null
  let placeholder = null
  let initialX = 0
  let initialY = 0
  let isDragging = false

  // 初始化所有书签项为可拖拽
  function initDraggableItems() {
    const items = container.getElementsByClassName('bookmark-item-lacia')
    Array.from(items).forEach(item => {
      if (!item.classList.contains('draggable')) {
        item.classList.add('draggable')
        initDragEvents(item)
      }
    })
  }

  // 为每个书签添加拖拽事件
  function initDragEvents(item) {
    item.addEventListener('mousedown', handleDragStart)
    item.addEventListener('mousemove', handleDragMove)
    item.addEventListener('mouseup', handleDragEnd)
    item.addEventListener('mouseleave', handleDragEnd)
  }

  // 开始拖拽
  function handleDragStart(e) {
    if (e.button !== 0) return // 只响应左键
    draggingElem = e.currentTarget
    isDragging = true

    // 记录初始位置
    initialX = e.clientX - draggingElem.offsetLeft
    initialY = e.clientY - draggingElem.offsetTop

    // 创建占位符
    placeholder = document.createElement('div')
    placeholder.className = 'bookmark-placeholder'
    draggingElem.parentNode.insertBefore(placeholder, draggingElem)

    // 设置拖拽样式
    draggingElem.classList.add('dragging')
    
    // 更新拖拽元素位置
    updateDraggingPosition(e)

    // 添加全局事件监听
    document.addEventListener('mousemove', handleGlobalDragMove)
    document.addEventListener('mouseup', handleGlobalDragEnd)
  }

  // 拖拽移动
  function handleDragMove(e) {
    if (!isDragging) return
    e.preventDefault()
    updateDraggingPosition(e)
  }

  // 全局拖拽移动
  function handleGlobalDragMove(e) {
    if (!isDragging) return
    e.preventDefault()
    updateDraggingPosition(e)
    updatePlaceholderPosition(e)
  }

  // 更新拖拽元素位置
  function updateDraggingPosition(e) {
    if (!draggingElem) return
    const x = e.clientX - initialX
    const y = e.clientY - initialY
    draggingElem.style.transform = `translate(${x}px, ${y}px)`
  }

  // 更新占位符位置
  function updatePlaceholderPosition(e) {
    const items = Array.from(container.getElementsByClassName('bookmark-item-lacia'))
    items.forEach(item => {
      if (item === draggingElem) return
      
      const rect = item.getBoundingClientRect()
      const mouseY = e.clientY

      if (mouseY > rect.top && mouseY < rect.bottom) {
        if (mouseY < rect.top + rect.height / 2) {
          item.parentNode.insertBefore(placeholder, item)
        } else {
          item.parentNode.insertBefore(placeholder, item.nextSibling)
        }
      }
    })
  }

  // 结束拖拽
  function handleDragEnd() {
    if (!isDragging) return
    finishDrag()
  }

  // 全局结束拖拽
  function handleGlobalDragEnd() {
    if (!isDragging) return
    finishDrag()
  }

  // 完成拖拽
  function finishDrag() {
    if (!draggingElem || !placeholder) return
    
    // 移除拖拽样式
    draggingElem.classList.remove('dragging')
    draggingElem.style.transform = ''

    // 更新位置
    placeholder.parentNode.insertBefore(draggingElem, placeholder)
    placeholder.remove()

    // 更新数据
    updateBookmarkOrder()

    // 清理状态
    draggingElem = null
    placeholder = null
    isDragging = false

    // 移除全局事件监听
    document.removeEventListener('mousemove', handleGlobalDragMove)
    document.removeEventListener('mouseup', handleGlobalDragEnd)
  }

  // 更新书签顺序
  function updateBookmarkOrder() {
    const items = Array.from(container.getElementsByClassName('bookmark-item-lacia'))
    const newOrder = items.map((item, index) => {
      const bookmarkId = item.dataset.bookmarkId
      const bookmark = data.list.find(b => b.id === bookmarkId)
      if (bookmark) {
        bookmark.index = index + 1
      }
      return bookmark
    }).filter(Boolean)

    data.list = newOrder
    saveData()
    renderAll()
  }

  // 初始化拖拽功能
  initDraggableItems()

  // 监听新增书签
  const observer = new MutationObserver(() => {
    initDraggableItems()
  })

  observer.observe(container, {
    childList: true,
    subtree: true
  })
} 