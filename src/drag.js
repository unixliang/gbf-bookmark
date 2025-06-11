import data from './data'
import { renderAll, saveData } from './utils'

export function initDrag() {
  const container = document.getElementById('gbf-bookmark-lacia')
  let draggingElem = null
  let placeholder = null
  let initialX = 0
  let initialY = 0
  let isDragging = false
  let lastTouch = null
  let longPressTimer = null
  const LONG_PRESS_DURATION = 500  // 长按触发时间（毫秒）
  let initialTouchX = 0
  let initialTouchY = 0
  const TOUCH_MOVE_THRESHOLD = 10  // 触摸移动阈值（像素）

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

  // 为每个书签添加拖拽事件（鼠标 + 触摸）
  function initDragEvents(item) {
    // 鼠标事件
    item.addEventListener('mousedown', handleDragStart)
    item.addEventListener('mousemove', handleDragMove)
    item.addEventListener('mouseup', handleDragEnd)
    item.addEventListener('mouseleave', handleDragEnd)

    // 触摸事件
    item.addEventListener('touchstart', handleTouchStart, { passive: false })
    item.addEventListener('touchmove', handleTouchMove, { passive: false })
    item.addEventListener('touchend', handleTouchEnd)
    item.addEventListener('touchcancel', handleTouchEnd)
  }

  // 开始长按检测
  function startLongPressTimer(e, elem) {
    const touch = e.touches[0]
    initialTouchX = touch.clientX
    initialTouchY = touch.clientY

    clearLongPressTimer()
    longPressTimer = setTimeout(() => {
      // 添加视觉反馈
      elem.style.transform = 'scale(1.1)'
      // 触发拖拽
      startDragging(e, elem)
    }, LONG_PRESS_DURATION)
  }

  // 清除长按定时器
  function clearLongPressTimer() {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      longPressTimer = null
    }
  }

  // 检查触摸是否移动超过阈值
  function hasTouchMoved(e) {
    const touch = e.touches[0]
    const moveX = Math.abs(touch.clientX - initialTouchX)
    const moveY = Math.abs(touch.clientY - initialTouchY)
    return moveX > TOUCH_MOVE_THRESHOLD || moveY > TOUCH_MOVE_THRESHOLD
  }

  // 开始拖拽
  function startDragging(e, elem) {
    const touch = e.touches[0]
    draggingElem = elem
    isDragging = true
    lastTouch = touch

    // 记录初始位置
    initialX = touch.clientX - draggingElem.offsetLeft
    initialY = touch.clientY - draggingElem.offsetTop

    // 创建占位符
    placeholder = document.createElement('div')
    placeholder.className = 'bookmark-placeholder'
    draggingElem.parentNode.insertBefore(placeholder, draggingElem)

    // 设置拖拽样式
    draggingElem.classList.add('dragging')
    
    // 更新拖拽元素位置
    updateDraggingPosition(touch)

    // 添加震动反馈（如果设备支持）
    if (navigator.vibrate) {
      navigator.vibrate(50)
    }
  }

  // 触摸开始
  function handleTouchStart(e) {
    e.preventDefault() // 防止触发鼠标事件
    if (e.touches.length !== 1) return // 只处理单指触摸

    startLongPressTimer(e, e.currentTarget)
  }

  // 触摸移动
  function handleTouchMove(e) {
    e.preventDefault()
    
    // 如果还没开始拖拽，检查是否应该取消长按
    if (!isDragging) {
      if (hasTouchMoved(e)) {
        clearLongPressTimer()
        if (draggingElem) {
          draggingElem.style.transform = ''
        }
      }
      return
    }

    // 已经在拖拽中
    if (e.touches.length !== 1) return
    const touch = e.touches[0]
    lastTouch = touch
    updateDraggingPosition(touch)
    updatePlaceholderPosition(touch)
  }

  // 触摸结束
  function handleTouchEnd(e) {
    e.preventDefault()
    
    // 清除长按定时器
    clearLongPressTimer()
    
    // 如果没有在拖拽中，恢复元素样式
    if (!isDragging && draggingElem) {
      draggingElem.style.transform = ''
      draggingElem = null
      return
    }

    if (!isDragging) return
    
    // 使用最后一次触摸位置
    if (lastTouch) {
      updatePlaceholderPosition(lastTouch)
    }
    
    finishDrag()
  }

  // 开始拖拽（鼠标）
  function handleDragStart(e) {
    if (e.button !== 0) return // 只响应左键
    e.preventDefault()
    
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
    
    // 限制拖拽范围在视窗内
    const maxX = window.innerWidth - draggingElem.offsetWidth
    const maxY = window.innerHeight - draggingElem.offsetHeight
    const boundedX = Math.max(0, Math.min(x, maxX))
    const boundedY = Math.max(0, Math.min(y, maxY))
    
    draggingElem.style.transform = `translate(${boundedX}px, ${boundedY}px)`
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
  function handleDragEnd(e) {
    if (!isDragging) return
    e.preventDefault()
    finishDrag()
  }

  // 全局结束拖拽（鼠标）
  function handleGlobalDragEnd(e) {
    if (!isDragging) return
    e.preventDefault()
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
    lastTouch = null
    clearLongPressTimer()

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