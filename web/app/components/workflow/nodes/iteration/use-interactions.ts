import { useCallback } from 'react'
import produce from 'immer'
import { useStoreApi } from 'reactflow'
import type { Node } from '../../types'
import { ITERATION_PADDING } from '../../constants'

export const useNodeIterationInteractions = () => {
  const store = useStoreApi()

  const handleNodeIterationRerender = useCallback((nodeId: string) => {
    const {
      getNodes,
      setNodes,
    } = store.getState()

    const nodes = getNodes()
    const currentNode = nodes.find(n => n.id === nodeId)!
    const childrenNodes = nodes.filter(n => n.parentId === nodeId)
    let rightNode: Node
    let bottomNode: Node

    childrenNodes.forEach((n) => {
      if (rightNode) {
        if (n.position.x + n.width! > rightNode.position.x + rightNode.width!)
          rightNode = n
      }
      else {
        rightNode = n
      }
      if (bottomNode) {
        if (n.position.y + n.height! > bottomNode.position.y + bottomNode.height!)
          bottomNode = n
      }
      else {
        bottomNode = n
      }
    })

    const widthShouldExtend = rightNode! && currentNode.width! < rightNode.position.x + rightNode.width!
    const heightShouldExtend = bottomNode! && currentNode.height! < bottomNode.position.y + bottomNode.height!

    if (widthShouldExtend || heightShouldExtend) {
      const newNodes = produce(nodes, (draft) => {
        draft.forEach((n) => {
          if (n.id === nodeId) {
            if (widthShouldExtend) {
              n.data.width = rightNode.position.x + rightNode.width! + ITERATION_PADDING.right
              n.width = rightNode.position.x + rightNode.width! + ITERATION_PADDING.right
            }
            if (heightShouldExtend) {
              n.data.height = bottomNode.position.y + bottomNode.height! + ITERATION_PADDING.bottom
              n.height = bottomNode.position.y + bottomNode.height! + ITERATION_PADDING.bottom
            }
          }
        })
      })

      setNodes(newNodes)
    }
  }, [store])

  const handleNodeIterationChildDrag = useCallback((node: Node) => {
    const { getNodes } = store.getState()
    const nodes = getNodes()

    const restrictPosition: { x?: number; y?: number } = { x: undefined, y: undefined }

    if (node.data.isInIteration) {
      const parentNode = nodes.find(n => n.id === node.parentId)

      if (parentNode) {
        if (node.position.y < ITERATION_PADDING.top)
          restrictPosition.y = ITERATION_PADDING.top
        if (node.position.x < ITERATION_PADDING.left)
          restrictPosition.x = ITERATION_PADDING.left
        if (node.position.x + node.width! > parentNode!.width! - ITERATION_PADDING.right)
          restrictPosition.x = parentNode!.width! - ITERATION_PADDING.right - node.width!
        if (node.position.y + node.height! > parentNode!.height! - ITERATION_PADDING.bottom)
          restrictPosition.y = parentNode!.height! - ITERATION_PADDING.bottom - node.height!
      }
    }

    return {
      restrictPosition,
    }
  }, [store])

  const handleNodeIterationChildSizeChange = useCallback((nodeId: string) => {
    const { getNodes } = store.getState()
    const nodes = getNodes()
    const currentNode = nodes.find(n => n.id === nodeId)!
    const parentId = currentNode.parentId

    if (parentId)
      handleNodeIterationRerender(parentId)
  }, [store, handleNodeIterationRerender])

  return {
    handleNodeIterationRerender,
    handleNodeIterationChildDrag,
    handleNodeIterationChildSizeChange,
  }
}